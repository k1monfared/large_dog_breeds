#!/usr/bin/env python3
"""
add_breed.py — add a new breed to large_dog_breeds.json.

Finds the breed's DogTime page, extracts available data (name, size ranges,
image URL), scrapes star ratings, and inserts a new entry.  Fields that
can't be auto-extracted are set to placeholder values — a summary is printed
so you know what to fill in manually.

Slug resolution: the script tries several URL variations (with/without "-dog"
suffix) to find the right DogTime page.  It validates that the page title
matches the requested breed — same breed, not just similar name.

Usage:
    python add_breed.py 'Samoyed'
    python add_breed.py 'Border Collie' --dry-run
    python add_breed.py 'Australian Shepherd'

As a callable module:
    from add_breed import add_breed_entry
    result = add_breed_entry("Samoyed")
    # returns {"ok": True, "breed": {...}, "placeholders": [...]}
    # or      {"ok": False, "error": "..."}
"""

import argparse
import hashlib
import json
import re
import subprocess
import sys
import time
from pathlib import Path

import requests
from bs4 import BeautifulSoup

DATA_FILE    = Path(__file__).parent / "large_dog_breeds.json"
RATINGS_DIR  = Path(__file__).parent / "breed_details"
RATINGS_JSON = Path(__file__).parent / "breed_ratings.json"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )
}

RANGE_PATTERNS = {
    "weight_lbs": [
        r"(\d+\.?\d*)\s+to\s+(\d+\.?\d*)\s*pounds",
        r"(\d+\.?\d*)\s*[–—\-]\s*(\d+\.?\d*)\s*pounds",
        r"(\d+\.?\d*)\s+to\s+(\d+\.?\d*)\s*lbs",
        r"(\d+\.?\d*)\s*[–—\-]\s*(\d+\.?\d*)\s*lbs",
    ],
    "height_in": [
        r"(\d+\.?\d*)\s+to\s+(\d+\.?\d*)\s*inches",
        r"(\d+\.?\d*)\s*[–—\-]\s*(\d+\.?\d*)\s*inches",
    ],
    "lifespan_yrs": [
        r"(\d+\.?\d*)\s+to\s+(\d+\.?\d*)\s*years",
        r"(\d+\.?\d*)\s*[–—\-]\s*(\d+\.?\d*)\s*years",
    ],
}

SANITY_BOUNDS = {
    "weight_lbs":  (5.0,  300.0),
    "height_in":   (6.0,   45.0),
    "lifespan_yrs":(3.0,   25.0),
}


# ── Helpers ──────────────────────────────────────────────────────────────────

def fetch_page(url: str, max_attempts: int = 3) -> str | None:
    for attempt in range(max_attempts):
        try:
            resp = requests.get(url, headers=HEADERS, timeout=15)
            if resp.status_code == 200:
                return resp.text
            if resp.status_code in (429, 503):
                time.sleep(2 ** (attempt + 1))
            else:
                return None
        except requests.RequestException:
            time.sleep(2 ** attempt)
    return None


def name_to_slug(name: str) -> str:
    slug = name.lower().strip()
    slug = re.sub(r"[^a-z0-9]+", "-", slug).strip("-")
    return slug


def slug_candidates(name: str) -> list[str]:
    """Return URL slug variations to try for a breed name."""
    base = name_to_slug(name)
    candidates = [base]
    if not base.endswith("-dog"):
        candidates.append(base + "-dog")
    else:
        candidates.append(base[:-4])
    return candidates


def extract_page_breed_name(html: str) -> str | None:
    """Extract the breed name from a DogTime page (h1 or title tag)."""
    soup = BeautifulSoup(html, "lxml")
    # Try h1 first (most reliable)
    h1 = soup.find("h1")
    if h1:
        text = re.sub(r"\s+", " ", h1.get_text()).strip()
        if 2 < len(text) < 80:
            return text
    # Fallback: title tag
    title = soup.find("title")
    if title:
        text = title.get_text().strip()
        # "German Shepherd Dog Breed Information and Characteristics" → strip suffix
        text = re.sub(r"\s+(Dog\s+Breed\s+Information.*|Breed\s+Information.*)$", "", text, flags=re.I).strip()
        if 2 < len(text) < 80:
            return text
    return None


def is_same_breed(input_name: str, page_name: str) -> bool:
    """
    Return True if input_name clearly refers to the same breed as page_name.
    Conservative: avoids matching partial names like "Retriever" → "Labrador Retriever".

    Rules:
      1. Exact match (after normalisation)
      2. page_name starts with input_name + space, AND input_name is specific
         (≥8 chars OR ≥2 words) — handles "Doberman" → "Doberman Pinscher"
      3. input_name starts with page_name (handles "German Shepherd Dog" → "German Shepherd")
    """
    def norm(s):
        s = s.lower().strip()
        s = re.sub(r"\s*(dog|breed)\s*$", "", s).strip()
        s = re.sub(r"[^a-z0-9 ]+", " ", s)
        return re.sub(r"\s+", " ", s).strip()

    inp  = norm(input_name)
    page = norm(page_name)

    if inp == page:
        return True

    # inp is a prefix of page (e.g. "doberman" → "doberman pinscher")
    if page.startswith(inp + " "):
        specific = len(inp) >= 8 or len(inp.split()) >= 2
        return specific

    # page is a prefix of inp (e.g. "german shepherd dog" → "german shepherd")
    if inp.startswith(page + " "):
        return True

    return False


def extract_ranges(text: str) -> dict:
    result = {}
    for field, patterns in RANGE_PATTERNS.items():
        lo_b, hi_b = SANITY_BOUNDS[field]
        pairs = []
        for pat in patterns:
            for m in re.finditer(pat, text, re.I):
                lo, hi = float(m.group(1)), float(m.group(2))
                if lo <= hi and lo >= lo_b and hi <= hi_b:
                    pairs.append((lo, hi))
        if pairs:
            result[field] = {"min": min(p[0] for p in pairs), "max": max(p[1] for p in pairs)}
    return result


def extract_image_url(soup: BeautifulSoup) -> str | None:
    for tag in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(tag.string or "")
            items = [data] if isinstance(data, dict) else (data if isinstance(data, list) else [])
            for item in items:
                url = item.get("thumbnailUrl") or item.get("image")
                if url:
                    return url
        except (json.JSONDecodeError, AttributeError):
            pass
    og = soup.find("meta", property="og:image")
    if og and og.get("content"):
        return og["content"]
    return None


def slug_to_color(slug: str) -> str:
    """Generate a consistent muted color from the slug."""
    h = hashlib.md5(slug.encode()).hexdigest()
    r = max(80, min(175, int(h[0:2], 16)))
    g = max(80, min(175, int(h[2:4], 16)))
    b = max(80, min(175, int(h[4:6], 16)))
    return f"#{r:02x}{g:02x}{b:02x}"


def extract_ratings(html: str) -> dict[str, dict[str, int]] | None:
    """Same logic as scrape_ratings.py — returns category dict or None."""
    soup = BeautifulSoup(html, "lxml")
    ratings = {}
    for details in soup.find_all("details"):
        summary = details.find("summary", recursive=False)
        if not summary:
            continue
        h2 = summary.find("h2")
        if not h2:
            continue
        category = re.sub(r"\s+", " ", h2.get_text(" ", strip=True)).strip()
        cat_ratings = {}
        for sub in details.find_all("details"):
            sub_summary = sub.find("summary", recursive=False)
            if not sub_summary:
                continue
            h4 = sub_summary.find("h4")
            if not h4:
                continue
            trait = re.sub(r"\s+", " ", h4.get_text(" ", strip=True)).strip()
            star_span = sub_summary.find("span", class_="xe-breed-star-rating")
            if star_span:
                filled = len(star_span.find_all("span", class_="xe-breed-star--selected"))
            else:
                filled = None
            cat_ratings[trait] = filled
        if cat_ratings:
            ratings[category] = cat_ratings
    return ratings if ratings else None


# ── Core function ─────────────────────────────────────────────────────────────

def add_breed_entry(breed_name: str, dry_run: bool = False) -> dict:
    """
    Find the DogTime page for breed_name, extract data, and add to JSON files.

    Returns:
        {"ok": True,  "breed": {...}, "placeholders": [...]}
        {"ok": False, "error": "..."}
    """
    # Check for duplicate
    existing_breeds = json.loads(DATA_FILE.read_text())
    for b in existing_breeds:
        if b["name"].lower() == breed_name.lower():
            return {"ok": False, "error": f"'{b['name']}' is already in large_dog_breeds.json"}

    # Find the DogTime page
    found_slug = None
    found_url  = None
    found_html = None
    found_page_name = None

    for slug in slug_candidates(breed_name):
        url = f"https://dogtime.com/dog-breeds/{slug}"
        print(f"  Trying {url} …")
        html = fetch_page(url)
        if not html:
            continue
        page_name = extract_page_breed_name(html)
        if not page_name:
            continue
        if is_same_breed(breed_name, page_name):
            found_slug      = slug
            found_url       = url
            found_html      = html
            found_page_name = page_name
            break

    if not found_slug:
        return {
            "ok":    False,
            "error": (
                f"Could not find '{breed_name}' on DogTime. "
                "Check that the breed name is correct and try again. "
                "Tip: try the full official name (e.g. 'Doberman Pinscher' not 'Doberman')."
            ),
        }

    print(f"  Found: {found_page_name} → {found_url}")

    # Extract data from page
    soup   = BeautifulSoup(found_html, "lxml")
    text   = soup.get_text(" ", strip=True)
    ranges = extract_ranges(text)
    img    = extract_image_url(soup)

    # Extract star ratings
    ratings = extract_ratings(found_html)

    # Build breed entry (placeholder for fields we can't extract)
    placeholders = []

    def placeholder(key, val):
        placeholders.append(key)
        return val

    entry = {
        "name":          found_page_name.removesuffix(" Dog").strip()
                         if found_page_name.endswith(" Dog") and " " in found_page_name.rstrip(" Dog")
                         else found_page_name,
        "origin":        placeholder("origin",       "Unknown"),
        "weight_lbs":    ranges.get("weight_lbs",    placeholder("weight_lbs",    {"min": 0, "max": 0})),
        "height_in":     ranges.get("height_in",     placeholder("height_in",     {"min": 0, "max": 0})),
        "lifespan_yrs":  ranges.get("lifespan_yrs",  placeholder("lifespan_yrs",  {"min": 0, "max": 0})),
        "temperament":   placeholder("temperament",  []),
        "purpose":       placeholder("purpose",      []),
        "grooming":      placeholder("grooming",     "Moderate"),
        "exercise":      placeholder("exercise",     "Moderate"),
        "good_with_kids":placeholder("good_with_kids", True),
        "good_with_dogs":placeholder("good_with_dogs", False),
        "coat":          placeholder("coat",         "Unknown"),
        "shedding":      placeholder("shedding",     "Moderate"),
        "trainability":  placeholder("trainability", "Moderate"),
        "health_notes":  placeholder("health_notes", "See DogTime for details"),
        "color":         slug_to_color(found_slug),
        "dogtime_slug":  found_slug,
        "source_url":    found_url,
    }

    # Remove placeholders that were actually filled in by extraction
    for key in ("weight_lbs", "height_in", "lifespan_yrs"):
        if key in ranges:
            if key in placeholders:
                placeholders.remove(key)

    if img:
        entry["dogtime_image_url"] = img

    if dry_run:
        return {"ok": True, "breed": entry, "placeholders": placeholders, "dry_run": True, "ratings": ratings}

    # Write to large_dog_breeds.json
    existing_breeds.append(entry)
    DATA_FILE.write_text(json.dumps(existing_breeds, indent=2, ensure_ascii=False))
    print(f"  Added '{entry['name']}' to large_dog_breeds.json")

    # Save ratings
    if ratings:
        flat = {}
        for cat_traits in ratings.values():
            flat.update(cat_traits)
        RATINGS_DIR.mkdir(exist_ok=True)
        rating_file = RATINGS_DIR / f"{found_slug}_ratings.json"
        from datetime import date
        rating_file.write_text(json.dumps({
            "breed":      entry["name"],
            "slug":       found_slug,
            "url":        found_url,
            "scraped_at": date.today().isoformat(),
            "ratings":    ratings,
        }, indent=2, ensure_ascii=False))
        print(f"  Saved ratings → {rating_file.name}")

        # Re-run merge_ratings.py to update breed_ratings.json
        subprocess.run([sys.executable, str(Path(__file__).parent / "merge_ratings.py")],
                       check=False, capture_output=True)
        print("  Updated breed_ratings.json")
    else:
        print("  Warning: no star ratings found for this breed (page may use a different template)")

    return {"ok": True, "breed": entry, "placeholders": placeholders, "ratings": ratings}


# ── CLI ───────────────────────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser(description="Add a new breed to large_dog_breeds.json")
    ap.add_argument("name",      help="Breed name (e.g. 'Samoyed')")
    ap.add_argument("--dry-run", action="store_true", help="Print result but don't save")
    args = ap.parse_args()

    print(f"\nAdding breed: {args.name}\n")
    result = add_breed_entry(args.name, dry_run=args.dry_run)

    if not result["ok"]:
        print(f"\n[error] {result['error']}")
        sys.exit(1)

    breed = result["breed"]
    phs   = result["placeholders"]

    if args.dry_run:
        print("\n[dry-run] Would add:")
        print(json.dumps(breed, indent=2, ensure_ascii=False))

    print(f"\n[ok] Added: {breed['name']}")
    print(f"     Slug:  {breed['dogtime_slug']}")
    print(f"     URL:   {breed['source_url']}")

    if phs:
        print(f"\n[!] Fields needing manual update in large_dog_breeds.json:")
        for p in phs:
            print(f"     • {p}")

    if result.get("ratings"):
        total = sum(len(v) for v in result["ratings"].values())
        print(f"\n     Ratings: {len(result['ratings'])} categories, {total} traits")
    else:
        print("\n     Ratings: not available")


if __name__ == "__main__":
    main()
