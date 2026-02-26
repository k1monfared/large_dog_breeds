#!/usr/bin/env python3
"""
download_images.py — parallel image downloader for large_dog_breeds.json
Saves one representative JPEG per breed to images/[slug].jpg.

Usage:
    python download_images.py                     # download all (skip existing)
    python download_images.py --force             # re-download all
    python download_images.py --breed 'Great Dane'  # single breed test
"""

import argparse
import io
import json
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

import requests
from bs4 import BeautifulSoup
from PIL import Image

DATA_FILE = Path(__file__).parent / "large_dog_breeds.json"
IMAGES_DIR = Path(__file__).parent / "images"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )
}


def strip_query(url: str) -> str:
    """Remove query string from URL to get full-resolution image."""
    parts = urlsplit(url)
    return urlunsplit((parts.scheme, parts.netloc, parts.path, "", ""))


def fetch_with_retry(url: str, max_attempts: int = 3, stream: bool = False):
    """GET url with exponential backoff on 429/503."""
    for attempt in range(max_attempts):
        try:
            resp = requests.get(url, headers=HEADERS, timeout=20, stream=stream)
            if resp.status_code == 200:
                return resp
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


def get_image_url_from_page(url: str) -> str | None:
    """Fetch breed page and extract image URL from JSON-LD or og:image."""
    resp = fetch_with_retry(url)
    if not resp:
        return None
    soup = BeautifulSoup(resp.text, "lxml")

    # JSON-LD thumbnailUrl
    for tag in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(tag.string or "")
            if isinstance(data, dict):
                img = data.get("thumbnailUrl") or data.get("image")
                if img:
                    return img
            if isinstance(data, list):
                for item in data:
                    img = item.get("thumbnailUrl") or item.get("image")
                    if img:
                        return img
        except (json.JSONDecodeError, AttributeError):
            pass

    # og:image fallback
    og = soup.find("meta", property="og:image")
    if og and og.get("content"):
        return og["content"]

    return None


def download_breed_image(breed: dict, force: bool = False) -> tuple[str, bool, str]:
    """
    Worker: download and save breed image as JPEG.
    Returns (breed_name, success, message).
    """
    name = breed["name"]
    slug = breed.get("dogtime_slug", "")
    if not slug:
        return name, False, "no dogtime_slug"

    dest = IMAGES_DIR / f"{slug}.jpg"

    if dest.exists() and not force:
        return name, True, "skipped (already exists)"

    # Use pre-fetched URL from JSON if available, else fetch page
    img_url = breed.get("dogtime_image_url")
    if not img_url:
        source_url = breed.get("source_url")
        if not source_url:
            return name, False, "no source_url"
        img_url = get_image_url_from_page(source_url)
        if not img_url:
            return name, False, "could not extract image URL from page"

    # Strip query params for full-resolution
    clean_url = strip_query(img_url)

    resp = fetch_with_retry(clean_url, stream=True)
    if not resp:
        # Try original URL with query params if stripped version failed
        resp = fetch_with_retry(img_url, stream=True)
    if not resp:
        return name, False, f"download failed: {clean_url}"

    try:
        img_data = resp.content
        img = Image.open(io.BytesIO(img_data))
        # Convert to RGB (handles PNG with alpha, palette modes, etc.)
        if img.mode not in ("RGB", "L"):
            img = img.convert("RGB")
        img.save(dest, "JPEG", quality=90, optimize=True)
        return name, True, f"saved {dest.name} ({img.size[0]}×{img.size[1]})"
    except Exception as exc:
        return name, False, f"image processing error: {exc}"


def main():
    parser = argparse.ArgumentParser(description="Download breed images from DogTime.com")
    parser.add_argument("--force", action="store_true", help="Re-download existing images")
    parser.add_argument("--breed", help="Download a single breed by name")
    parser.add_argument("--workers", type=int, default=6, help="ThreadPoolExecutor max workers")
    args = parser.parse_args()

    IMAGES_DIR.mkdir(exist_ok=True)

    breeds = json.loads(DATA_FILE.read_text())

    if args.breed:
        targets = [b for b in breeds if b["name"].lower() == args.breed.lower()]
        if not targets:
            print(f"Breed '{args.breed}' not found in JSON.")
            return
    else:
        targets = breeds

    print(f"Downloading images for {len(targets)} breed(s) with {args.workers} worker(s)…\n")

    ok = 0
    skipped = 0
    failed = 0

    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        future_to_breed = {
            executor.submit(download_breed_image, b, args.force): b["name"]
            for b in targets
        }
        for future in as_completed(future_to_breed):
            name, success, msg = future.result()
            if success:
                if "skipped" in msg:
                    skipped += 1
                    print(f"  [skip]  {name:35s} {msg}")
                else:
                    ok += 1
                    print(f"  [ok]    {name:35s} {msg}")
            else:
                failed += 1
                print(f"  [fail]  {name:35s} {msg}")

    print(f"\n{'─'*50}")
    print(f"Downloaded: {ok}  |  Skipped: {skipped}  |  Failed: {failed}")
    if failed:
        print("Re-run with --force to retry failed downloads.")


if __name__ == "__main__":
    main()
