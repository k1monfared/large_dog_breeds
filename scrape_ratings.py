#!/usr/bin/env python3
"""
scrape_ratings.py — scrape per-breed star ratings from DogTime.

For each breed this script fetches the breed page and counts the filled stars
(xe-breed-star--selected spans) for every trait in every category.  It does
NOT re-scrape the generic description text — that lives in criteria_schema.json
which you generate once with scrape_criteria_schema.py.

Output is written to breed_details/<slug>_ratings.json, one file per breed:

{
  "breed":      "Great Dane",
  "slug":       "great-dane",
  "url":        "https://dogtime.com/dog-breeds/great-dane",
  "scraped_at": "2026-02-26",
  "ratings": {
    "Adaptability": {
      "Adapts Well To Apartment Living": 1,
      "Good For Novice Dog Owners":      1,
      ...
    },
    "All-around friendliness": { ... },
    ...
  }
}

Usage:
    python scrape_ratings.py                      # all 26 breeds
    python scrape_ratings.py --breed 'Great Dane' # single breed
    python scrape_ratings.py --workers 4          # parallel, 4 threads
    python scrape_ratings.py --dry-run            # print JSON, don't save
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
OUT_DIR   = Path(__file__).parent / "breed_details"
TODAY     = date.today().isoformat()

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )
}


def clean(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


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


def extract_ratings(html: str) -> dict[str, dict[str, int]]:
    """
    Returns:
    {
      "Adaptability": {
        "Adapts Well To Apartment Living": 1,
        ...
      },
      ...
    }
    """
    soup = BeautifulSoup(html, "lxml")
    ratings: dict[str, dict[str, int]] = {}

    for details in soup.find_all("details"):
        summary = details.find("summary", recursive=False)
        if not summary:
            continue
        h2 = summary.find("h2")
        if not h2:
            continue

        category = clean(h2.get_text(" ", strip=True))
        cat_ratings: dict[str, int] = {}

        # Category-level overall rating (star span alongside the h2 in summary)
        cat_star_span = summary.find("span", class_="xe-breed-star-rating")
        if cat_star_span:
            filled = len(cat_star_span.find_all("span", class_="xe-breed-star--selected"))
            cat_ratings[f"{category} - Overall"] = filled

        for sub_details in details.find_all("details"):
            sub_summary = sub_details.find("summary", recursive=False)
            if not sub_summary:
                continue
            h4 = sub_summary.find("h4")
            if not h4:
                continue

            trait = clean(h4.get_text(" ", strip=True))

            star_span = sub_summary.find("span", class_="xe-breed-star-rating")
            if star_span:
                filled = len(star_span.find_all("span", class_="xe-breed-star--selected"))
            else:
                filled = None  # rating not found

            cat_ratings[trait] = filled

        if cat_ratings:
            ratings[category] = cat_ratings

    return ratings


def scrape_breed_ratings(breed: dict, dry_run: bool = False) -> dict | None:
    name = breed["name"]
    url  = breed.get("source_url")
    slug = breed.get("dogtime_slug", name.lower().replace(" ", "-"))

    if not url:
        print(f"  [skip] {name} — no source_url")
        return None

    print(f"  Scraping {name} …")
    html = fetch_page(url)
    if not html:
        print(f"  [fail] {name} — could not fetch page")
        return None

    ratings = extract_ratings(html)
    if not ratings:
        print(f"  [fail] {name} — no ratings found")
        return None

    total = sum(len(v) for v in ratings.values())
    print(f"  [ok] {name} — {len(ratings)} categories, {total} traits")

    result = {
        "breed":      name,
        "slug":       slug,
        "url":        url,
        "scraped_at": TODAY,
        "ratings":    ratings,
    }

    if not dry_run:
        OUT_DIR.mkdir(exist_ok=True)
        path = OUT_DIR / f"{slug}_ratings.json"
        path.write_text(json.dumps(result, indent=2, ensure_ascii=False))

    return result


def main():
    ap = argparse.ArgumentParser(description="Scrape per-breed star ratings from DogTime")
    ap.add_argument("--breed",   help="Single breed name (e.g. 'Great Dane')")
    ap.add_argument("--all",     action="store_true", help="Scrape all breeds in JSON (default if no --breed)")
    ap.add_argument("--workers", type=int, default=6, help="Parallel workers")
    ap.add_argument("--dry-run", action="store_true", help="Print JSON, don't save files")
    args = ap.parse_args()

    breeds = json.loads(DATA_FILE.read_text())

    if args.breed:
        targets = [b for b in breeds if b["name"].lower() == args.breed.lower()]
        if not targets:
            print(f"Breed '{args.breed}' not found in JSON.")
            return
    else:
        targets = breeds  # default: all

    if args.dry_run:
        print("[dry-run] files will NOT be saved\n")
    else:
        OUT_DIR.mkdir(exist_ok=True)

    results = {}

    if len(targets) == 1 or args.workers == 1:
        for b in targets:
            r = scrape_breed_ratings(b, dry_run=args.dry_run)
            if r:
                results[b["name"]] = r
    else:
        print(f"Scraping {len(targets)} breeds with {args.workers} workers…\n")
        with ThreadPoolExecutor(max_workers=args.workers) as ex:
            future_map = {ex.submit(scrape_breed_ratings, b, args.dry_run): b["name"] for b in targets}
            for future in as_completed(future_map):
                name = future_map[future]
                try:
                    r = future.result()
                    if r:
                        results[name] = r
                except Exception as exc:
                    print(f"  [exception] {name}: {exc}")

    print(f"\nScraped: {len(results)}/{len(targets)}")

    if args.dry_run:
        for data in results.values():
            print(json.dumps(data, indent=2, ensure_ascii=False))
    elif not args.dry_run and results:
        print(f"Files saved to: {OUT_DIR}/")
        for name, data in results.items():
            slug = data["slug"]
            print(f"  {slug}_ratings.json")


if __name__ == "__main__":
    main()
