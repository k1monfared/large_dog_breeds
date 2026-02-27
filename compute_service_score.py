#!/usr/bin/env python3
"""
compute_service_score.py
Computes a data-driven service-dog suitability score for each breed.

Workflow:
  1. Load breed_ratings.json (flat trait dicts keyed by dogtime_slug)
  2. Build 12-trait matrix, drop rows with missing values
  3. Compute full 12×12 Pearson correlation matrix
  4. Group correlated traits (|r| > 0.7) into combined signals
  5. Apply weighted formula → raw score → normalize 0-100
  6. Write service_dog_score into large_dog_breeds.json
  7. Write service_score_analysis.json for analysis.html
"""

import json
import math
import sys
from pathlib import Path

# ── Paths ────────────────────────────────────────────────────────────────────
ROOT           = Path(__file__).parent
RATINGS_FILE   = ROOT / "breed_ratings.json"
BREEDS_FILE    = ROOT / "large_dog_breeds.json"
ANALYSIS_FILE  = ROOT / "service_score_analysis.json"

# ── 12 candidate traits ───────────────────────────────────────────────────────
POSITIVE_TRAITS = [
    "Easy To Train",
    "Intelligence",
    "General Health",
    "Sensitivity Level",
    "Friendly Toward Strangers",
    "Dog Friendly",
    "Tolerates Being Alone",
]
NEGATIVE_TRAITS = [
    "Tendency To Bark Or Howl",
    "Wanderlust Potential",
    "Prey Drive",
    "Potential For Mouthiness",
    "Drooling Potential",
]
ALL_TRAITS = POSITIVE_TRAITS + NEGATIVE_TRAITS

# ── Predefined groups (domain knowledge, confirmed by correlation data) ───────
# Each group: (name, [traits], weight, direction)
GROUPS = [
    ("Cognitive",       ["Easy To Train", "Intelligence"],              3.0, "positive"),
    ("Public Demeanor", ["Friendly Toward Strangers", "Dog Friendly"],  2.0, "positive"),
    ("Distraction",     ["Prey Drive", "Wanderlust Potential"],         2.0, "negative"),
]
# Standalone traits after grouping
STANDALONES = [
    ("General Health",          2.0, "positive"),
    ("Sensitivity Level",       1.5, "positive"),
    ("Tolerates Being Alone",   1.0, "positive"),
    ("Tendency To Bark Or Howl",2.0, "negative"),
    ("Potential For Mouthiness",0.5, "negative"),
    ("Drooling Potential",      0.5, "negative"),
]

# Traits consumed by groups (excluded from standalone computation)
GROUPED_TRAITS = set(t for _, traits, _, _ in GROUPS for t in traits)

# ── Min / max raw score for normalization ─────────────────────────────────────
# Each signal is on [1, 5]. Positives add +weight×val; negatives subtract weight×val.
def _extreme_raw(positive_val, negative_val):
    """Best case: positive traits high, negative traits low (and vice-versa)."""
    total = 0.0
    for _, _, w, direction in GROUPS:
        total += w * positive_val if direction == "positive" else -w * negative_val
    for _, w, direction in STANDALONES:
        total += w * positive_val if direction == "positive" else -w * negative_val
    return total

RAW_MAX = _extreme_raw(positive_val=5, negative_val=1)   # all best: +47.5 − 5   = +42.5
RAW_MIN = _extreme_raw(positive_val=1, negative_val=5)   # all worst: +9.5 − 25  = −15.5

# ── Pearson correlation helper (pure stdlib) ──────────────────────────────────
def pearson(xs, ys):
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


def compute_correlation_matrix(matrix, traits):
    """matrix: list of rows (one per breed), each row = list of 12 floats."""
    n = len(traits)
    cols = [[row[j] for row in matrix] for j in range(n)]
    result = []
    for i in range(n):
        row = []
        for j in range(n):
            r = pearson(cols[i], cols[j])
            row.append(round(r, 3) if not math.isnan(r) else None)
        result.append(row)
    return result


# ── Score computation ─────────────────────────────────────────────────────────
def compute_score(trait_vals):
    """trait_vals: dict  trait_name → float (1-5)."""
    raw = 0.0
    # Groups: average the traits in the group
    for _, traits, weight, direction in GROUPS:
        group_vals = [trait_vals[t] for t in traits if t in trait_vals]
        if not group_vals:
            return None
        avg = sum(group_vals) / len(group_vals)
        raw += weight * avg if direction == "positive" else -weight * avg
    # Standalones
    for trait, weight, direction in STANDALONES:
        v = trait_vals.get(trait)
        if v is None:
            return None
        raw += weight * v if direction == "positive" else -weight * v
    # Normalize
    score = (raw - RAW_MIN) / (RAW_MAX - RAW_MIN) * 100
    return round(score, 1)


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    # Load ratings
    with open(RATINGS_FILE) as f:
        ratings = json.load(f)

    # Build trait matrix (drop breeds missing any of the 12 traits)
    matrix_rows  = []
    matrix_slugs = []
    missing_slugs = []

    for slug, traits in ratings.items():
        row = []
        ok = True
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
            missing_slugs.append(slug)

    print(f"Breeds with all 12 traits: {len(matrix_rows)}")
    print(f"Breeds missing at least one trait: {len(missing_slugs)}: {missing_slugs}")

    # Correlation matrix
    corr_matrix = compute_correlation_matrix(matrix_rows, ALL_TRAITS)

    # Print correlation matrix
    print("\n── Pearson Correlation Matrix ──────────────────────────────────────────")
    short = [t.split()[0][:8] for t in ALL_TRAITS]
    header = "         " + "  ".join(f"{s:>8}" for s in short)
    print(header)
    for i, row in enumerate(corr_matrix):
        vals = "  ".join(f"{(v if v is not None else float('nan')):8.3f}" for v in row)
        print(f"{short[i]:>8} {vals}")

    # Identify correlated pairs (|r| > 0.7, i < j)
    print("\n── Pairs with |r| > 0.7 ───────────────────────────────────────────────")
    correlated_pairs = []
    for i in range(len(ALL_TRAITS)):
        for j in range(i + 1, len(ALL_TRAITS)):
            r = corr_matrix[i][j]
            if r is not None and abs(r) > 0.7:
                print(f"  r = {r:+.3f}  {ALL_TRAITS[i]}  ↔  {ALL_TRAITS[j]}")
                correlated_pairs.append((ALL_TRAITS[i], ALL_TRAITS[j], r))

    # Compute score for every breed that has all 12 traits
    scores_by_slug = {}
    for slug, row in zip(matrix_slugs, matrix_rows):
        trait_vals = dict(zip(ALL_TRAITS, row))
        scores_by_slug[slug] = compute_score(trait_vals)

    # Also try to score breeds that are missing only Overall traits (not the 12)
    for slug, traits in ratings.items():
        if slug in scores_by_slug:
            continue
        trait_vals = {t: float(traits[t]) for t in ALL_TRAITS if t in traits}
        s = compute_score(trait_vals)
        if s is not None:
            scores_by_slug[slug] = s

    # Update large_dog_breeds.json
    with open(BREEDS_FILE) as f:
        breeds = json.load(f)

    updated = 0
    for breed in breeds:
        slug  = breed.get("dogtime_slug", "")
        score = scores_by_slug.get(slug)
        breed["service_dog_score"] = score
        if score is not None:
            updated += 1

    with open(BREEDS_FILE, "w") as f:
        json.dump(breeds, f, indent=2)
    print(f"\nWrote service_dog_score to {BREEDS_FILE}  ({updated} scored, {len(breeds) - updated} null)")

    # Ranked scores list
    scored_list = sorted(
        [{"name": b["name"], "slug": b.get("dogtime_slug", ""), "score": b["service_dog_score"]}
         for b in breeds],
        key=lambda x: (x["score"] is None, -(x["score"] or 0))
    )

    # Print top / bottom
    print("\n── Top 10 ──────────────────────────────────────────────────────────────")
    for entry in scored_list[:10]:
        print(f"  {entry['score']:5.1f}  {entry['name']}")
    print("\n── Bottom 10 ───────────────────────────────────────────────────────────")
    for entry in [e for e in scored_list if e["score"] is not None][-10:]:
        print(f"  {entry['score']:5.1f}  {entry['name']}")

    # Build analysis JSON
    groups_out = []
    for name, traits, weight, direction in GROUPS:
        groups_out.append({
            "name": name,
            "traits": traits,
            "weight": weight,
            "direction": direction,
        })

    standalone_out = []
    for trait, weight, direction in STANDALONES:
        standalone_out.append({
            "trait": trait,
            "weight": weight,
            "direction": direction,
        })

    formula_note = (
        "Raw score = sum of (group_avg or trait_value) × weight × sign. "
        "Positive signals add to score; negative signals subtract. "
        f"Normalized: score = (raw − {RAW_MIN:.2f}) / {RAW_MAX - RAW_MIN:.2f} × 100. "
        "Breeds missing any of the 12 traits receive null."
    )

    analysis = {
        "traits": ALL_TRAITS,
        "correlation_matrix": corr_matrix,
        "correlated_pairs": [
            {"trait_a": a, "trait_b": b, "r": r}
            for a, b, r in correlated_pairs
        ],
        "groups": groups_out,
        "standalone": standalone_out,
        "raw_min": RAW_MIN,
        "raw_max": RAW_MAX,
        "formula_notes": formula_note,
        "scores": scored_list,
    }

    with open(ANALYSIS_FILE, "w") as f:
        json.dump(analysis, f, indent=2)
    print(f"\nWrote {ANALYSIS_FILE}")


if __name__ == "__main__":
    main()
