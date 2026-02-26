# Large Dog Breeds

**Status**: 🟡 MVP | **Mode**: 🤖 Claude Code | **Updated**: 2026-02-25

## Run locally

```bash
python -m http.server 8000
```

Then open **http://localhost:8000** in your browser.

## Data tools

```bash
# Verify breed data against DogTime.com (writes corrections to JSON)
python verify_breeds.py

# Download breed photos to images/
python download_images.py
```

Both scripts accept `--breed 'Name'` to target a single breed, and `--dry-run` to preview changes without writing.
