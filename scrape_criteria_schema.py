#!/usr/bin/env python3
"""
scrape_criteria_schema.py — scrape DogTime's trait criteria hierarchy ONCE
and save it to criteria_schema.json.

The schema is the same for every breed: same 5 categories, same 26 traits,
same description text in the expandable sections.  Run this once, then use
scrape_ratings.py to collect per-breed star ratings.

Usage:
    python scrape_criteria_schema.py               # uses Great Dane page
    python scrape_criteria_schema.py --url URL     # use any breed page
    python scrape_criteria_schema.py --pretty      # pretty-print result
"""

import argparse
import json
import re
import sys
from pathlib import Path

import requests
from bs4 import BeautifulSoup

OUT_FILE = Path(__file__).parent / "criteria_schema.json"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )
}

# Use Great Dane as the reference page (any breed works)
DEFAULT_URL = "https://dogtime.com/dog-breeds/great-dane"


def clean(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


def fetch_page(url: str) -> str:
    resp = requests.get(url, headers=HEADERS, timeout=15)
    resp.raise_for_status()
    return resp.text


def scrape_schema(html: str) -> list[dict]:
    """
    Returns a list of category dicts:
    [
      {
        "category": "Adaptability",
        "traits": [
          {
            "name":        "Adapts Well To Apartment Living",
            "description": "Looking for the best dog for your apartment? ..."
          },
          ...
        ]
      },
      ...
    ]
    """
    soup = BeautifulSoup(html, "lxml")

    categories = []

    for details in soup.find_all("details"):
        # Only top-level <details> that have an h2 in their direct <summary>
        summary = details.find("summary", recursive=False)
        if not summary:
            continue
        h2 = summary.find("h2")
        if not h2:
            continue

        category_name = clean(h2.get_text(" ", strip=True))
        traits = []

        # Each trait lives in a nested <details> inside this top-level <details>
        for sub_details in details.find_all("details"):
            sub_summary = sub_details.find("summary", recursive=False)
            if not sub_summary:
                continue
            h4 = sub_summary.find("h4")
            if not h4:
                continue

            trait_name = clean(h4.get_text(" ", strip=True))

            # Description is in the first <div> sibling of <summary>
            desc_div = sub_details.find("div", recursive=False)
            description = ""
            if desc_div:
                description = clean(desc_div.get_text(" ", strip=True))

            traits.append({"name": trait_name, "description": description})

        if traits:
            categories.append({"category": category_name, "traits": traits})

    return categories


def main():
    ap = argparse.ArgumentParser(
        description="Scrape DogTime criteria schema (one-time, breed-agnostic)"
    )
    ap.add_argument("--url",    default=DEFAULT_URL, help="Breed page URL to use as reference")
    ap.add_argument("--pretty", action="store_true",  help="Pretty-print JSON to stdout")
    ap.add_argument("--no-save", action="store_true", help="Don't write criteria_schema.json")
    args = ap.parse_args()

    print(f"Fetching {args.url} …")
    html = fetch_page(args.url)

    schema = scrape_schema(html)

    if not schema:
        print("ERROR: No schema extracted — check page structure.", file=sys.stderr)
        sys.exit(1)

    total_traits = sum(len(c["traits"]) for c in schema)
    print(f"Extracted {len(schema)} categories, {total_traits} traits.")
    for c in schema:
        print(f"  {c['category']}: {len(c['traits'])} traits")

    if not args.no_save:
        OUT_FILE.write_text(json.dumps(schema, indent=2, ensure_ascii=False))
        print(f"Saved → {OUT_FILE}")

    if args.pretty or args.no_save:
        print(json.dumps(schema, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
