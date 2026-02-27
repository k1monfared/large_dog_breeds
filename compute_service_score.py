#!/usr/bin/env python3
"""
compute_service_score.py
Two independently callable functions:

  run_correlation_analysis()
      Loads breed_ratings.json, builds the 12-trait × N-breed matrix,
      computes the full Pearson correlation matrix, determines which
      predefined groups are data-confirmed (all within-group pairs |r| ≥ threshold),
      and writes service_score_analysis.json.

  update_service_scores()
      Reads service_score_analysis.json for the confirmed formula,
      scores every breed, and writes service_dog_score into
      large_dog_breeds.json.

CLI usage:
  python compute_service_score.py               # run both in sequence
  python compute_service_score.py --analysis    # correlation analysis only
  python compute_service_score.py --scores      # update scores only (analysis must exist)
"""

import json
import math
import sys
from pathlib import Path

# ── Paths ─────────────────────────────────────────────────────────────────────
ROOT          = Path(__file__).parent
RATINGS_FILE  = ROOT / "breed_ratings.json"
BREEDS_FILE   = ROOT / "large_dog_breeds.json"
ANALYSIS_FILE = ROOT / "service_score_analysis.json"

# ── The 12 candidate traits ───────────────────────────────────────────────────
ALL_TRAITS = [
    "Easy To Train",
    "Intelligence",
    "General Health",
    "Sensitivity Level",
    "Friendly Toward Strangers",
    "Dog Friendly",
    "Tolerates Being Alone",
    "Tendency To Bark Or Howl",
    "Wanderlust Potential",
    "Prey Drive",
    "Potential For Mouthiness",
    "Drooling Potential",
]

# ── Predefined group candidates ───────────────────────────────────────────────
# A group is only activated when every within-group trait pair satisfies |r| ≥ CORR_THRESHOLD.
# If a group is not confirmed, each trait falls back to its standalone weight.
CORR_THRESHOLD = 0.70

PREDEFINED_GROUPS = [
    {
        "name":             "Cognitive",
        "traits":           ["Easy To Train", "Intelligence"],
        "direction":        "positive",
        "group_weight":     3.0,   # weight when traits are merged
        "standalone_weights": {"Easy To Train": 2.0, "Intelligence": 1.5},
    },
    {
        "name":             "Public Demeanor",
        "traits":           ["Friendly Toward Strangers", "Dog Friendly"],
        "direction":        "positive",
        "group_weight":     2.0,
        "standalone_weights": {"Friendly Toward Strangers": 1.5, "Dog Friendly": 1.0},
    },
    {
        "name":             "Distraction",
        "traits":           ["Prey Drive", "Wanderlust Potential"],
        "direction":        "negative",
        "group_weight":     2.0,
        "standalone_weights": {"Prey Drive": 1.5, "Wanderlust Potential": 1.0},
    },
]

# Traits not in any predefined group are always standalone
ALWAYS_STANDALONE = [
    ("General Health",           2.0, "positive"),
    ("Sensitivity Level",        1.5, "positive"),
    ("Tolerates Being Alone",    1.0, "positive"),
    ("Tendency To Bark Or Howl", 2.0, "negative"),
    ("Potential For Mouthiness", 0.5, "negative"),
    ("Drooling Potential",       0.5, "negative"),
]


# ── Low-level helpers ─────────────────────────────────────────────────────────
def _pearson(xs, ys):
    n = len(xs)
    if n < 2:
        return float("nan")
    mx, my = sum(xs) / n, sum(ys) / n
    num   = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    den_x = math.sqrt(sum((x - mx) ** 2 for x in xs))
    den_y = math.sqrt(sum((y - my) ** 2 for y in ys))
    if den_x == 0 or den_y == 0:
        return float("nan")
    return num / (den_x * den_y)


def _correlation_matrix(matrix_rows, traits):
    """Returns list-of-lists Pearson r matrix."""
    cols = [[row[j] for row in matrix_rows] for j in range(len(traits))]
    idx  = {t: i for i, t in enumerate(traits)}
    result = []
    for i in range(len(traits)):
        row = []
        for j in range(len(traits)):
            r = _pearson(cols[i], cols[j])
            row.append(round(r, 3) if not math.isnan(r) else None)
        result.append(row)
    return result, idx


def _group_confirmed(group, corr_matrix, trait_idx):
    """True if every within-group pair has |r| ≥ CORR_THRESHOLD."""
    traits = group["traits"]
    for i in range(len(traits)):
        for j in range(i + 1, len(traits)):
            a, b = traits[i], traits[j]
            if a not in trait_idx or b not in trait_idx:
                return False
            r = corr_matrix[trait_idx[a]][trait_idx[b]]
            if r is None or abs(r) < CORR_THRESHOLD:
                return False
    return True


def _extreme_raw(confirmed_groups, standalone_list):
    """Compute theoretical min and max raw scores for normalization."""
    def contrib(w, direction, best):
        return w * best if direction == "positive" else -w * (6 - best)

    raw_max = 0.0
    raw_min = 0.0
    for g in confirmed_groups:
        raw_max += contrib(g["group_weight"], g["direction"], 5)
        raw_min += contrib(g["group_weight"], g["direction"], 1)
    for s in standalone_list:
        raw_max += contrib(s["weight"], s["direction"], 5)
        raw_min += contrib(s["weight"], s["direction"], 1)
    return raw_min, raw_max


# ─────────────────────────────────────────────────────────────────────────────
# PUBLIC FUNCTION 1: run_correlation_analysis
# ─────────────────────────────────────────────────────────────────────────────
def run_correlation_analysis(
    ratings_file: Path = RATINGS_FILE,
    analysis_file: Path = ANALYSIS_FILE,
    verbose: bool = True,
) -> dict:
    """
    Load all breed ratings, compute the 12×12 Pearson correlation matrix,
    decide which predefined groups are data-confirmed (|r| ≥ 0.70 for all
    within-group pairs), and write service_score_analysis.json.

    Returns the analysis dict.
    """
    with open(ratings_file) as f:
        ratings = json.load(f)

    # Build trait matrix — include every breed that has all 12 traits
    matrix_rows, matrix_slugs, skipped = [], [], []
    for slug, traits in ratings.items():
        row = []
        ok  = True
        for t in ALL_TRAITS:
            v = traits.get(t)
            if v is None:
                ok = False
                break
            row.append(float(v))
        if ok:
            matrix_rows.append(row)
            matrix_slugs.append(slug)
        else:
            skipped.append(slug)

    n_breeds = len(matrix_rows)
    if verbose:
        print(f"Correlation analysis: {n_breeds} breeds with all {len(ALL_TRAITS)} traits")
        if skipped:
            print(f"  Skipped (missing traits): {skipped}")

    corr_matrix, trait_idx = _correlation_matrix(matrix_rows, ALL_TRAITS)

    # Print matrix
    if verbose:
        short  = [t.split()[0][:8] for t in ALL_TRAITS]
        header = "         " + "  ".join(f"{s:>8}" for s in short)
        print("\n── Pearson Correlation Matrix ──")
        print(header)
        for i, row in enumerate(corr_matrix):
            vals = "  ".join(f"{(v if v is not None else float('nan')):8.3f}" for v in row)
            print(f"{short[i]:>8} {vals}")

    # Collect all correlated pairs (|r| ≥ threshold, upper triangle)
    all_corr_pairs = []
    for i in range(len(ALL_TRAITS)):
        for j in range(i + 1, len(ALL_TRAITS)):
            r = corr_matrix[i][j]
            if r is not None and abs(r) >= CORR_THRESHOLD:
                all_corr_pairs.append({
                    "trait_a": ALL_TRAITS[i],
                    "trait_b": ALL_TRAITS[j],
                    "r":       r,
                })

    if verbose:
        print(f"\n── Pairs with |r| ≥ {CORR_THRESHOLD} ──")
        if all_corr_pairs:
            for p in all_corr_pairs:
                print(f"  r = {p['r']:+.3f}  {p['trait_a']}  ↔  {p['trait_b']}")
        else:
            print(f"  (none — no traits are strongly correlated at this threshold)")

    # Determine which predefined groups are confirmed
    confirmed_groups  = []
    unconfirmed_traits = []   # traits whose group was NOT confirmed → become standalones

    for pg in PREDEFINED_GROUPS:
        if _group_confirmed(pg, corr_matrix, trait_idx):
            confirmed_groups.append({
                "name":        pg["name"],
                "traits":      pg["traits"],
                "weight":      pg["group_weight"],
                "direction":   pg["direction"],
                "confirmed":   True,
            })
            if verbose:
                print(f"  ✓ Group '{pg['name']}' confirmed (all pairs |r| ≥ {CORR_THRESHOLD})")
        else:
            # Check correlations within this group for the note
            pair_rs = []
            for i, ta in enumerate(pg["traits"]):
                for tb in pg["traits"][i+1:]:
                    if ta in trait_idx and tb in trait_idx:
                        pair_rs.append(corr_matrix[trait_idx[ta]][trait_idx[tb]])
            max_r = max((abs(r) for r in pair_rs if r is not None), default=0.0)
            if verbose:
                print(f"  ✗ Group '{pg['name']}' not confirmed "
                      f"(max within-group |r| = {max_r:.3f} < {CORR_THRESHOLD})"
                      " → traits treated as standalones")
            for trait in pg["traits"]:
                unconfirmed_traits.append({
                    "trait":     trait,
                    "weight":    pg["standalone_weights"][trait],
                    "direction": pg["direction"],
                })

    # Merge unconfirmed traits with always-standalone traits
    all_standalones = unconfirmed_traits + [
        {"trait": t, "weight": w, "direction": d}
        for t, w, d in ALWAYS_STANDALONE
    ]

    raw_min, raw_max = _extreme_raw(confirmed_groups, all_standalones)

    if verbose:
        print(f"\nFormula: {len(confirmed_groups)} merged group(s), "
              f"{len(all_standalones)} standalone trait(s)")
        print(f"Normalization: raw ∈ [{raw_min:.2f}, {raw_max:.2f}]  "
              f"→  score = (raw − {raw_min:.2f}) / {raw_max - raw_min:.2f} × 4 + 1  (1–5 scale)")

    formula_note = (
        f"Groups confirmed by data (|r| ≥ {CORR_THRESHOLD}): "
        f"{[g['name'] for g in confirmed_groups] or 'none'}. "
        f"Unconfirmed group traits become standalones. "
        f"Raw score range: [{raw_min:.2f}, {raw_max:.2f}]. "
        f"score = (raw − {raw_min:.2f}) / {raw_max - raw_min:.2f} × 4 + 1  (1–5 scale). "
        f"Breeds missing any of the {len(ALL_TRAITS)} traits receive null."
    )

    analysis = {
        "n_breeds_in_analysis":  n_breeds,
        "corr_threshold":        CORR_THRESHOLD,
        "traits":                ALL_TRAITS,
        "correlation_matrix":    corr_matrix,
        "correlated_pairs":      all_corr_pairs,
        "groups":                confirmed_groups,
        "standalone":            all_standalones,
        "raw_min":               raw_min,
        "raw_max":               raw_max,
        "formula_notes":         formula_note,
        "scores":                [],   # filled in by update_service_scores()
    }

    with open(analysis_file, "w") as f:
        json.dump(analysis, f, indent=2)
    if verbose:
        print(f"\nWrote {analysis_file}")

    return analysis


# ─────────────────────────────────────────────────────────────────────────────
# PUBLIC FUNCTION 2: update_service_scores
# ─────────────────────────────────────────────────────────────────────────────
def update_service_scores(
    breeds_file:   Path = BREEDS_FILE,
    ratings_file:  Path = RATINGS_FILE,
    analysis_file: Path = ANALYSIS_FILE,
    verbose:       bool = True,
) -> list:
    """
    Read the formula from service_score_analysis.json, compute a service-dog
    suitability score (0-100) for every breed that has all required traits,
    and write service_dog_score into large_dog_breeds.json.

    Returns the sorted scores list.
    """
    with open(analysis_file) as f:
        analysis = json.load(f)

    groups     = analysis["groups"]
    standalones = analysis["standalone"]
    raw_min    = analysis["raw_min"]
    raw_max    = analysis["raw_max"]
    raw_range  = raw_max - raw_min

    grouped_traits = {t for g in groups for t in g["traits"]}

    def score_breed(trait_vals):
        """trait_vals: {trait_name: float}.  Returns float or None."""
        raw = 0.0
        for g in groups:
            vals = [trait_vals[t] for t in g["traits"] if t in trait_vals]
            if len(vals) < len(g["traits"]):
                return None
            avg = sum(vals) / len(vals)
            raw += g["weight"] * avg if g["direction"] == "positive" else -g["weight"] * avg
        for s in standalones:
            v = trait_vals.get(s["trait"])
            if v is None:
                return None
            raw += s["weight"] * v if s["direction"] == "positive" else -s["weight"] * v
        return int(round((raw - raw_min) / raw_range * 4 + 1))

    # Score every breed in breed_ratings.json
    with open(ratings_file) as f:
        ratings = json.load(f)

    scores_by_slug = {}
    for slug, traits in ratings.items():
        trait_vals = {t: float(traits[t]) for t in ALL_TRAITS if t in traits}
        s = score_breed(trait_vals)
        if s is not None:
            scores_by_slug[slug] = s

    # Update large_dog_breeds.json
    with open(breeds_file) as f:
        breeds = json.load(f)

    n_scored = n_null = 0
    for breed in breeds:
        slug  = breed.get("dogtime_slug", "")
        score = scores_by_slug.get(slug)
        breed["service_dog_score"] = score
        if score is not None:
            n_scored += 1
        else:
            n_null += 1

    with open(breeds_file, "w") as f:
        json.dump(breeds, f, indent=2)

    if verbose:
        print(f"Updated service_dog_score in {breeds_file}")
        print(f"  Scored: {n_scored}  |  Null (no ratings): {n_null}")

    # Build sorted scores list for analysis JSON
    scored_list = sorted(
        [{"name": b["name"], "slug": b.get("dogtime_slug", ""), "score": b["service_dog_score"]}
         for b in breeds],
        key=lambda x: (x["score"] is None, -(x["score"] or 0)),
    )

    # Print top / bottom
    if verbose:
        scored_only = [e for e in scored_list if e["score"] is not None]
        print("\n── Top 10 ──────────────────────────────")
        for e in scored_only[:10]:
            print(f"  {e['score']:3d}  {e['name']}")
        print("\n── Bottom 10 ───────────────────────────")
        for e in scored_only[-10:]:
            print(f"  {e['score']:3d}  {e['name']}")
        null_names = [e["name"] for e in scored_list if e["score"] is None]
        if null_names:
            print(f"\n── No score (missing ratings) ──────────")
            for nm in null_names:
                print(f"  {nm}")

    # Write updated scores back into analysis JSON
    analysis["scores"] = scored_list
    with open(analysis_file, "w") as f:
        json.dump(analysis, f, indent=2)
    if verbose:
        print(f"\nUpdated scores in {analysis_file}")

    return scored_list


# ─────────────────────────────────────────────────────────────────────────────
# CLI entry point
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    args = set(sys.argv[1:])
    run_analysis = "--scores" not in args   # default: run analysis
    run_scores   = "--analysis" not in args  # default: run scores

    if run_analysis:
        run_correlation_analysis()
    if run_scores:
        update_service_scores()
