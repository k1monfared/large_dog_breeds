#!/usr/bin/env python3
"""
verify_breeds.py — parallel verifier for large_dog_breeds.json
Fetches each breed's DogTime.com page and checks weight, height, lifespan ranges.

Usage:
    python verify_breeds.py                        # verify all 26 breeds
    python verify_breeds.py --breed 'Great Dane'   # single breed test
    python verify_breeds.py --dry-run              # print changes, don't write
    python verify_breeds.py --workers 4            # reduce if rate-limited
"""

import argparse
import json
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date
from pathlib import Path

import requests
from bs4 import BeautifulSoup

DATA_FILE = Path(__file__).parent / "large_dog_breeds.json"
TODAY = date.today().isoformat()
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )
}

# ── Regex patterns ─────────────────────────────────────────────────────────────
RANGE_PATTERNS = {
    "weight_lbs": [
        # "110 to 175 pounds"
        r"(\d+\.?\d*)\s+to\s+(\d+\.?\d*)\s*pounds",
        # "110–175 pounds" (em-dash, en-dash, hyphen)
        r"(\d+\.?\d*)\s*[–—\-]\s*(\d+\.?\d*)\s*pounds",
        # "110 to 175 lbs"
        r"(\d+\.?\d*)\s+to\s+(\d+\.?\d*)\s*lbs",
        r"(\d+\.?\d*)\s*[–—\-]\s*(\d+\.?\d*)\s*lbs",
    ],
    "height_in": [
        r"(\d+\.?\d*)\s+to\s+(\d+\.?\d*)\s*inches",
        r"(\d+\.?\d*)\s*[–—\-]\s*(\d+\.?\d*)\s*inches",
        r"(\d+\.?\d*)\s+to\s+(\d+\.?\d*)\s*inch",
        r"(\d+\.?\d*)\s*[–—\-]\s*(\d+\.?\d*)\s*inch",
    ],
    "lifespan_yrs": [
        r"(\d+\.?\d*)\s+to\s+(\d+\.?\d*)\s*years",
        r"(\d+\.?\d*)\s*[–—\-]\s*(\d+\.?\d*)\s*years",
        r"(\d+\.?\d*)\s+to\s+(\d+\.?\d*)\s*year",
        r"(\d+\.?\d*)\s*[–—\-]\s*(\d+\.?\d*)\s*year",
    ],
}


def fetch_page(url: str, max_attempts: int = 3) -> str | None:
    """GET url with exponential backoff on 429/503."""
    for attempt in range(max_attempts):
        try:
            resp = requests.get(url, headers=HEADERS, timeout=15)
            if resp.status_code == 200:
                return resp.text
            if resp.status_code in (429, 503):
                wait = 2 ** (attempt + 1)
                print(f"  [rate-limit] {resp.status_code} — waiting {wait}s …")
                time.sleep(wait)
                continue
            print(f"  [HTTP {resp.status_code}] {url}")
            return None
        except requests.RequestException as exc:
            print(f"  [error] {exc}")
            time.sleep(2 ** attempt)
    return None


SANITY_BOUNDS = {
    "weight_lbs": (20.0, 300.0),
    "height_in": (15.0, 45.0),
    "lifespan_yrs": (3.0, 25.0),
}


def extract_all_ranges(
    patterns: list[str], text: str, field: str = ""
) -> tuple[float, float] | None:
    """
    Apply all patterns to text, collect every (lo, hi) match,
    filter by sanity bounds for the field, then return the union
    (overall_min, overall_max) or None if no valid matches remain.
    Handles male/female splits automatically via union.
    """
    lo_bound, hi_bound = SANITY_BOUNDS.get(field, (0.0, 1e9))
    all_pairs = []
    for pat in patterns:
        for m in re.finditer(pat, text, re.IGNORECASE):
            lo, hi = float(m.group(1)), float(m.group(2))
            if lo <= hi and lo >= lo_bound and hi <= hi_bound:
                all_pairs.append((lo, hi))
    if not all_pairs:
        return None
    return min(p[0] for p in all_pairs), max(p[1] for p in all_pairs)


def extract_image_url(soup: BeautifulSoup, html: str) -> str | None:
    """Extract best image URL: JSON-LD thumbnailUrl → og:image meta."""
    # Try JSON-LD first
    for tag in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(tag.string or "")
            if isinstance(data, dict):
                url = data.get("thumbnailUrl") or data.get("image")
                if url:
                    return url
            if isinstance(data, list):
                for item in data:
                    url = item.get("thumbnailUrl") or item.get("image")
                    if url:
                        return url
        except (json.JSONDecodeError, AttributeError):
            pass
    # Fallback: og:image
    og = soup.find("meta", property="og:image")
    if og and og.get("content"):
        return og["content"]
    return None


def parse_breed_data(html: str) -> dict:
    """Extract weight_lbs, height_in, lifespan_yrs ranges + image URL from HTML."""
    soup = BeautifulSoup(html, "lxml")

    # Remove script/style noise before text extraction
    for tag in soup(["script", "style"]):
        tag.decompose()

    text = soup.get_text(" ", strip=True)

    result = {}
    for field, patterns in RANGE_PATTERNS.items():
        match = extract_all_ranges(patterns, text, field=field)
        if match:
            result[field] = {"min": match[0], "max": match[1]}

    # Re-parse with scripts for image extraction
    soup2 = BeautifulSoup(html, "lxml")
    img_url = extract_image_url(soup2, html)
    if img_url:
        result["dogtime_image_url"] = img_url

    return result


def compare_range(
    field: str,
    json_range: dict,
    scraped_range: dict,
    corrections: list,
    tolerance: float = 0.10,
) -> dict:
    """
    Compare min/max with 10% tolerance per boundary.
    Records original value only when a correction is made.
    Returns (possibly updated) range dict.
    """
    updated = dict(json_range)
    for bound in ("min", "max"):
        j_val = json_range.get(bound)
        s_val = scraped_range.get(bound)
        if j_val is None or s_val is None:
            continue
        tol = max(abs(s_val) * tolerance, 1.0)
        if abs(j_val - s_val) > tol:
            corrections.append(
                {
                    "field": f"{field}.{bound}",
                    "original_value": j_val,
                    "new_value": s_val,
                    "source": "dogtime.com",
                }
            )
            updated[bound] = s_val
    return updated


def verify_breed(breed: dict) -> dict:
    """Worker: fetch page → parse → compare → return updated breed dict."""
    name = breed["name"]
    url = breed.get("source_url")
    if not url:
        print(f"  [skip] {name} — no source_url")
        breed["verified"] = False
        breed["verification_date"] = TODAY
        breed["corrections"] = []
        return breed

    print(f"  Fetching {name} …")
    html = fetch_page(url)
    if not html:
        print(f"  [fail] {name} — could not fetch page")
        breed["verified"] = False
        breed["verification_date"] = TODAY
        breed["corrections"] = []
        return breed

    scraped = parse_breed_data(html)
    corrections = []

    for field in ("weight_lbs", "height_in", "lifespan_yrs"):
        if field in scraped and field in breed:
            breed[field] = compare_range(
                field, breed[field], scraped[field], corrections
            )

    if "dogtime_image_url" in scraped:
        breed["dogtime_image_url"] = scraped["dogtime_image_url"]

    breed["verified"] = True
    breed["verification_date"] = TODAY
    breed["corrections"] = corrections

    if corrections:
        print(f"  [corrected] {name}: {len(corrections)} field(s) updated")
    else:
        print(f"  [ok] {name}")

    return breed


def main():
    parser = argparse.ArgumentParser(description="Verify large_dog_breeds.json against DogTime.com")
    parser.add_argument("--breed", help="Verify a single breed by name")
    parser.add_argument("--dry-run", action="store_true", help="Print changes without writing JSON")
    parser.add_argument("--workers", type=int, default=8, help="ThreadPoolExecutor max workers")
    args = parser.parse_args()

    breeds = json.loads(DATA_FILE.read_text())

    if args.breed:
        targets = [b for b in breeds if b["name"].lower() == args.breed.lower()]
        if not targets:
            print(f"Breed '{args.breed}' not found in JSON.")
            return
    else:
        targets = breeds

    # Build index map to restore original order after parallel execution
    index_map = {b["name"]: i for i, b in enumerate(breeds)}

    print(f"Verifying {len(targets)} breed(s) with {args.workers} worker(s)…\n")

    results = {}
    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        future_to_name = {executor.submit(verify_breed, dict(b)): b["name"] for b in targets}
        for future in as_completed(future_to_name):
            name = future_to_name[future]
            try:
                results[name] = future.result()
            except Exception as exc:
                print(f"  [exception] {name}: {exc}")

    # Merge results back into original breeds list
    for name, updated in results.items():
        breeds[index_map[name]] = updated

    # Summary
    verified = sum(1 for b in breeds if b.get("verified"))
    corrections_total = sum(len(b.get("corrections", [])) for b in breeds)
    print(f"\n{'─'*50}")
    print(f"Verified: {verified}/{len(breeds)} breeds")
    print(f"Total corrections: {corrections_total}")

    if corrections_total:
        print("\nCorrections made:")
        for b in breeds:
            for c in b.get("corrections", []):
                print(f"  {b['name']:30s} {c['field']:25s} {c['original_value']} → {c['new_value']}")

    if args.dry_run:
        print("\n[dry-run] No changes written.")
    else:
        DATA_FILE.write_text(json.dumps(breeds, indent=2, ensure_ascii=False))
        print(f"\nWrote {DATA_FILE}")


if __name__ == "__main__":
    main()
