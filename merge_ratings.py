#!/usr/bin/env python3
"""
merge_ratings.py — flatten per-breed rating files into a single breed_ratings.json.

Reads all breed_details/<slug>_ratings.json files and outputs:
{
  "great-dane": {
    "Adapts Well To Apartment Living": 1,
    "Good For Novice Dog Owners": 1,
    ...all 26 traits flat...
  },
  ...
}

Usage:
    python merge_ratings.py              # reads breed_details/, writes breed_ratings.json
    python merge_ratings.py --dry-run    # print JSON, don't save
"""

import argparse
import json
from pathlib import Path

IN_DIR   = Path(__file__).parent / "breed_details"
OUT_FILE = Path(__file__).parent / "breed_ratings.json"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    files = sorted(IN_DIR.glob("*_ratings.json"))
    if not files:
        print(f"No rating files found in {IN_DIR}/")
        return

    merged = {}
    for f in files:
        data = json.loads(f.read_text())
        slug = data["slug"]
        flat = {}
        for cat_traits in data["ratings"].values():
            flat.update(cat_traits)
        merged[slug] = flat
        print(f"  {slug}: {len(flat)} traits")

    print(f"\nTotal: {len(merged)} breeds")

    if args.dry_run:
        print(json.dumps(merged, indent=2, ensure_ascii=False))
    else:
        OUT_FILE.write_text(json.dumps(merged, indent=2, ensure_ascii=False))
        print(f"Written: {OUT_FILE}")


if __name__ == "__main__":
    main()
