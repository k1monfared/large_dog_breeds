# Large Dog Breeds

**Status**: 🟡 MVP | **Mode**: 🤖 Claude Code | **Updated**: 2026-02-26

**Live app**: [https://k1monfared.github.io/large_dog_breeds/](https://k1monfared.github.io/large_dog_breeds/)

---

A reference and comparison tool for 26 large dog breeds, built as a single-page app with no build step.

## What it does

**Table view** — compare all breeds side-by-side with sortable columns:
- Basic stats: weight, height, lifespan, coat, origin, purpose
- Care levels: exercise, grooming, shedding, trainability
- Compatibility: good with kids, good with other dogs
- **DogTime star ratings** — 25 individual traits plus one overall score per category, grouped into 5 sections (Adaptability, Friendliness, Health & Grooming, Trainability, Exercise). Each column is sortable.

**Card view** — visual grid with breed photos, key stats, and full rating breakdowns per card.

**Sidebar filters** — narrow the list by weight, height, lifespan, origin, purpose, exercise level, grooming, shedding, trainability, temperament, coat, and compatibility. Rating filters let you set minimum scores per trait ("show breeds with ≥ 4 for Kid-Friendly").

**Column visibility toggles** — show/hide entire rating category groups to focus on what matters.

**Search** — free-text search across name, origin, purpose, and temperament.

**Add Breed** — add any breed from DogTime directly from the browser (requires `server.py`; see below) or from the command line.

---

## Run locally

```bash
# With the add-breed API (recommended):
python server.py
# Then open http://localhost:8000

# Without API (read-only):
python -m http.server 8000
```

---

## Data pipeline

The app reads two JSON files at startup. Run these scripts to populate or refresh them:

```bash
# 1. Verify & correct breed data against DogTime (weight, height, lifespan, image URLs)
python verify_breeds.py

# 2. Download breed photos to images/
python download_images.py

# 3. Scrape DogTime star ratings (26 traits + 5 category overalls per breed)
python scrape_ratings.py --all --workers 6

# 4. Flatten all rating files into breed_ratings.json
python merge_ratings.py
```

All scripts accept `--breed 'Name'` to target a single breed and `--dry-run` to preview without writing.

---

## Adding breeds

**From the command line:**
```bash
python add_breed.py 'Samoyed'
python add_breed.py 'Border Collie' --dry-run
```

**From the browser** (requires `server.py`): click the **+ Add Breed** button in the top-right of the app, type the breed name, and click Add.

The script finds the breed's DogTime page, auto-extracts size ranges and image URL, scrapes star ratings, and appends the entry to `large_dog_breeds.json`. Fields that can't be scraped automatically (temperament, purpose, coat, etc.) are listed as needing manual follow-up.

The breed name must be specific enough to unambiguously identify the breed — "Retriever" is rejected, "Labrador Retriever" is accepted.

---

## Files

| File | Purpose |
|---|---|
| `index.html` | App entry point — loads React + Babel from CDN, fetches and compiles the JSX |
| `large_dog_breeds_app.jsx` | Full React app (no build step needed) |
| `large_dog_breeds.json` | 26 breed entries with stats, slugs, and source URLs |
| `breed_ratings.json` | DogTime star ratings for 23 breeds (31 traits each) |
| `images/` | Breed photos (one JPEG per breed, downloaded by `download_images.py`) |
| `server.py` | Local dev server with `/api/add-breed` endpoint |
| `add_breed.py` | CLI tool for adding new breeds |
| `verify_breeds.py` | Verifies and corrects size data from DogTime |
| `download_images.py` | Downloads breed photos |
| `scrape_ratings.py` | Scrapes star ratings from DogTime |
| `merge_ratings.py` | Merges per-breed rating files into one JSON |
