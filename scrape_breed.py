#!/usr/bin/env python3
"""
scrape_breed.py — scrape full article content from a DogTime breed page
into a structured JSON hierarchy with sections, subsections, ratings, and text.

Usage:
    python scrape_breed.py 'Great Dane'               # scrape & print
    python scrape_breed.py 'Great Dane' --pretty      # pretty-print JSON
    python scrape_breed.py 'Great Dane' --save        # save to breed_details/
    python scrape_breed.py --all                      # scrape all 26 breeds
    python scrape_breed.py --all --workers 4          # parallel, 4 threads
"""

import argparse
import json
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date
from pathlib import Path

import requests
from bs4 import BeautifulSoup, NavigableString, Tag

DATA_FILE = Path(__file__).parent / "large_dog_breeds.json"
OUT_DIR   = Path(__file__).parent / "breed_details"
TODAY     = date.today().isoformat()

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )
}

# Noise classes/ids to remove before parsing
NOISE_RE = re.compile(
    r"sidebar|ad-slot|ad_slot|widget|related|curated|carousel|"
    r"social|breadcrumb|comment|newsletter|promo|banner|nav",
    re.I,
)

HEADING_LEVEL = {"h2": 2, "h3": 3, "h4": 4, "h5": 5}
HEADING_TAGS  = list(HEADING_LEVEL.keys())


# ── Helpers ─────────────────────────────────────────────────────────────────

def fetch_page(url: str, max_attempts: int = 3) -> str | None:
    for attempt in range(max_attempts):
        try:
            resp = requests.get(url, headers=HEADERS, timeout=15)
            if resp.status_code == 200:
                return resp.text
            if resp.status_code in (429, 503):
                wait = 2 ** (attempt + 1)
                print(f"  [rate-limit] {resp.status_code} — waiting {wait}s")
                time.sleep(wait)
            else:
                print(f"  [HTTP {resp.status_code}] {url}")
                return None
        except requests.RequestException as exc:
            print(f"  [error] {exc}")
            time.sleep(2 ** attempt)
    return None


def clean(text: str) -> str:
    """Collapse whitespace."""
    return re.sub(r"\s+", " ", text or "").strip()


def strip_stars(text: str) -> str:
    """Remove leading/trailing star characters and whitespace."""
    return re.sub(r"^[★☆\s]+|[★☆\s]+$", "", text).strip()


def count_stars(text: str) -> int | None:
    """
    Count filled stars. DogTime renders ALL star characters as ★ in HTML text
    (empty stars are styled grey via CSS, invisible to scraping). So counting
    ★ always gives 5 and is unreliable. Only return a value when we see a mix
    of ★ and ☆ — which would mean the page uses actual Unicode empty stars.
    """
    filled = text.count("★")
    empty  = text.count("☆")
    if filled > 0 and empty > 0:
        return filled   # genuine mixed ★/☆ — reliable
    # All ★ (no ☆) means CSS-only styling — can't tell empty from filled
    return None


def extract_rating(el: Tag) -> int | None:
    """Try every known pattern to get a 1-5 rating from an element."""
    # 1. data attributes on the element itself or any descendant
    for node in [el, *el.find_all(True)]:
        for attr in ("data-vote", "data-rating", "data-score", "data-value"):
            v = node.get(attr, "")
            if re.fullmatch(r"[1-5]", str(v).strip()):
                return int(v)
    # 2. aria-label like "3 out of 5 stars"
    for node in [el, *el.find_all(True)]:
        label = node.get("aria-label", "")
        m = re.search(r"(\d)\s*(out of|/)\s*5", label, re.I)
        if m:
            return int(m.group(1))
    # 3. star characters in the text
    raw = el.get_text(" ", strip=True)
    return count_stars(raw)


def is_noise(el: Tag) -> bool:
    classes = " ".join(el.get("class", []))
    eid = el.get("id", "")
    return bool(NOISE_RE.search(classes) or NOISE_RE.search(eid))


# ── DOM flattener ────────────────────────────────────────────────────────────

def flatten_content(root: Tag) -> list[Tag]:
    """
    Walk root's subtree in document order and return a flat list of
    significant elements: headings (h2-h5), paragraphs, and lists.

    Special case: DogTime nests h3/h4 headings inside <ul><li> accordion
    elements. When a <ul> or <ol> contains any heading descendants we recurse
    into it (and into each <li>) rather than treating the whole list as one
    item. This surfaces the inner headings as proper nodes so the hierarchy
    builder can create subsections from them.
    """
    result = []
    seen   = set()

    def seal(node):
        """Mark node + all descendants as seen so they're never revisited."""
        seen.add(id(node))
        for d in node.find_all(True):
            seen.add(id(d))

    def walk(node):
        if not isinstance(node, Tag):
            return
        if is_noise(node):
            return
        nid = id(node)
        if nid in seen:
            return

        name = node.name

        if name in HEADING_LEVEL:
            seen.add(nid)
            result.append(node)

        elif name in ("p", "blockquote"):
            seen.add(nid)
            result.append(node)
            seal(node)

        elif name in ("ul", "ol"):
            seen.add(nid)
            if node.find(HEADING_TAGS):
                # List contains headings → recurse so we surface them
                for child in node.children:
                    walk(child)
            else:
                # Simple flat list → treat as a unit
                result.append(node)
                seal(node)

        elif name == "li":
            seen.add(nid)
            if node.find(HEADING_TAGS):
                # This li wraps a subsection → recurse into its children
                for child in node.children:
                    walk(child)
            else:
                # Plain li (no inner headings) → treat as a text item
                result.append(node)
                seal(node)

        else:
            for child in node.children:
                walk(child)

    for child in root.children:
        walk(child)

    return result


# ── Core parser ──────────────────────────────────────────────────────────────

def scrape_content(html: str) -> dict | None:
    """
    Parse a DogTime breed HTML page and return a structured dict:

    {
      "intro":  str,          # paragraphs before first h2
      "sections": [
        {
          "title":       str,
          "rating":      int|null,    # 1-5 filled stars, or null
          "text":        str,         # prose in this section (before subsections)
          "items":       [str, ...],  # bullet-list items in this section
          "subsections": [
            {
              "title":  str,
              "rating": int|null,
              "text":   str,
              "items":  [str, ...],
              "tips":   [             # h4-level entries
                {"title": str, "text": str, "items": [str,...]}
              ]
            }
          ]
        }
      ]
    }

    Keys with empty/null values are omitted.
    """
    soup = BeautifulSoup(html, "lxml")

    # Remove noise
    for el in soup.find_all(["script", "style", "aside", "footer", "nav"]):
        el.decompose()
    for el in soup.find_all(class_=NOISE_RE):
        el.decompose()
    for el in soup.find_all(id=NOISE_RE):
        el.decompose()

    # Find main content container
    content = (
        soup.find("div", class_=re.compile(r"\bentry-content\b"))
        or soup.find("article")
        or soup.find("main")
    )
    if not content:
        return None

    elements = flatten_content(content)

    # ── State machine ────────────────────────────────────────────────────
    result   = {"intro": [], "sections": []}
    stack    = []   # list of (level:int, section:dict)

    def current_section():
        return stack[-1][1] if stack else None

    def pop_to(level):
        """Remove stack entries at >= level."""
        while stack and stack[-1][0] >= level:
            stack.pop()

    def add_text(section, text):
        existing = section.setdefault("_texts", [])
        existing.append(text)

    def add_items(section, items):
        existing = section.setdefault("_items", [])
        existing.extend(items)

    def add_to_current(text=None, items=None):
        sec = current_section()
        if sec is None:
            if text:
                result["intro"].append(text)
            elif items:
                result["intro"].extend(items)
        else:
            if text:
                add_text(sec, text)
            elif items:
                add_items(sec, items)

    for el in elements:
        name = el.name

        # ── Headings ──
        if name in HEADING_LEVEL:
            level = HEADING_LEVEL[name]
            raw   = clean(el.get_text(" ", strip=True))
            title = strip_stars(raw)
            if not title:
                continue

            rating = extract_rating(el)

            if level == 1:
                continue  # breed title — skip

            elif level == 2:
                pop_to(2)
                sec = {"title": title, "_texts": [], "_items": [], "subsections": []}
                if rating is not None:
                    sec["rating"] = rating
                result["sections"].append(sec)
                stack.append((2, sec))

            elif level == 3:
                pop_to(3)
                sec = {"title": title, "_texts": [], "_items": [], "tips": []}
                if rating is not None:
                    sec["rating"] = rating
                parent = current_section()
                if parent:
                    parent.setdefault("subsections", []).append(sec)
                else:
                    # orphan h3 — create implicit container
                    wrapper = {"title": "", "_texts": [], "_items": [], "subsections": [sec]}
                    result["sections"].append(wrapper)
                    stack.append((2, wrapper))
                stack.append((3, sec))

            elif level >= 4:
                pop_to(4)
                sec = {"title": title, "_texts": [], "_items": []}
                if rating is not None:
                    sec["rating"] = rating
                parent = current_section()
                if parent:
                    parent.setdefault("tips", []).append(sec)
                else:
                    result["intro"].append(f"[{title}]")
                stack.append((4, sec))

        # ── Block content ──
        elif name in ("p", "blockquote"):
            t = strip_stars(clean(el.get_text(" ", strip=True)))
            if t:
                add_to_current(text=t)

        elif name == "li":
            # Plain li surfaced by the heading-list walker — add as a single item
            t = strip_stars(clean(el.get_text(" ", strip=True)))
            if t:
                add_to_current(items=[t])

        elif name in ("ul", "ol"):
            items = [
                clean(li.get_text(" ", strip=True))
                for li in el.find_all("li", recursive=False)
            ]
            items = [strip_stars(i) for i in items if i]
            items = [i for i in items if i]
            if items:
                add_to_current(items=items)

    # ── Finalise structure ────────────────────────────────────────────────

    def finalise(sec: dict) -> dict:
        out = {}
        if sec.get("title"):
            out["title"] = sec["title"]
        if sec.get("rating") is not None:
            out["rating"] = sec["rating"]

        text = " ".join(sec.get("_texts", []))
        if text:
            out["text"] = text

        items = sec.get("_items", [])
        if items:
            out["items"] = items

        # tips (h4)
        tips = [finalise(t) for t in sec.get("tips", [])]
        tips = [t for t in tips if t]
        if tips:
            out["tips"] = tips

        # subsections
        subs = [finalise(s) for s in sec.get("subsections", [])]
        subs = [s for s in subs if s]
        if subs:
            out["subsections"] = subs

        return out

    intro = " ".join(result["intro"])
    sections = [finalise(s) for s in result["sections"]]
    sections = [s for s in sections if s.get("title")]

    out = {}
    if intro:
        out["intro"] = intro
    if sections:
        out["sections"] = sections
    return out


# ── Public API ───────────────────────────────────────────────────────────────

def scrape_breed(breed: dict) -> dict | None:
    """
    Fetch and scrape a single breed. Returns the structured content dict
    with added metadata, or None on failure.
    """
    name = breed["name"]
    url  = breed.get("source_url")
    slug = breed.get("dogtime_slug", "")

    if not url:
        print(f"  [skip] {name} — no source_url")
        return None

    print(f"  Scraping {name} …")
    html = fetch_page(url)
    if not html:
        print(f"  [fail] {name} — could not fetch page")
        return None

    data = scrape_content(html)
    if not data:
        print(f"  [fail] {name} — could not parse content")
        return None

    data["breed"]      = name
    data["slug"]       = slug
    data["url"]        = url
    data["scraped_at"] = TODAY

    # Move breed/slug/url/scraped_at to top of dict
    ordered = {k: data[k] for k in ("breed", "slug", "url", "scraped_at")}
    ordered.update({k: v for k, v in data.items() if k not in ordered})

    section_count = len(ordered.get("sections", []))
    print(f"  [ok] {name} — {section_count} sections")
    return ordered


# ── CLI ──────────────────────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser(description="Scrape full breed content from DogTime")
    ap.add_argument("breed",   nargs="?",          help="Breed name (e.g. 'Great Dane')")
    ap.add_argument("--all",   action="store_true", help="Scrape all breeds in large_dog_breeds.json")
    ap.add_argument("--save",  action="store_true", help="Save JSON to breed_details/<slug>.json")
    ap.add_argument("--pretty",action="store_true", help="Pretty-print JSON to stdout")
    ap.add_argument("--workers", type=int, default=6, help="Parallel workers for --all")
    args = ap.parse_args()

    breeds = json.loads(DATA_FILE.read_text())

    if args.all:
        targets = breeds
    elif args.breed:
        targets = [b for b in breeds if b["name"].lower() == args.breed.lower()]
        if not targets:
            print(f"Breed '{args.breed}' not found in JSON.")
            return
    else:
        ap.print_help()
        return

    if args.save:
        OUT_DIR.mkdir(exist_ok=True)

    results = {}

    if len(targets) == 1 or args.workers == 1:
        for b in targets:
            r = scrape_breed(b)
            if r:
                results[b["name"]] = r
    else:
        print(f"Scraping {len(targets)} breeds with {args.workers} workers…\n")
        with ThreadPoolExecutor(max_workers=args.workers) as ex:
            future_map = {ex.submit(scrape_breed, b): b["name"] for b in targets}
            for future in as_completed(future_map):
                name = future_map[future]
                try:
                    r = future.result()
                    if r:
                        results[name] = r
                except Exception as exc:
                    print(f"  [exception] {name}: {exc}")

    print(f"\nScraped: {len(results)}/{len(targets)}")

    for name, data in results.items():
        if args.save:
            slug = data.get("slug") or name.lower().replace(" ", "-")
            path = OUT_DIR / f"{slug}.json"
            path.write_text(json.dumps(data, indent=2, ensure_ascii=False))
            print(f"  Saved → {path}")

    if args.pretty or (not args.save and len(results) == 1):
        for data in results.values():
            print(json.dumps(data, indent=2, ensure_ascii=False))
    elif not args.save and len(results) > 1:
        print(json.dumps(list(results.values()), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
