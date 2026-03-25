#!/usr/bin/env python3
"""
generate_visualizations.py — produce analysis charts for the README.

Reads large_dog_breeds.json, breed_ratings.json, and service_score_analysis.json
to generate a set of PNG charts in the charts/ directory.

Usage:
    python generate_visualizations.py
"""

import json
import math
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.ticker as ticker
import numpy as np

ROOT = Path(__file__).parent
CHARTS_DIR = ROOT / "charts"
CHARTS_DIR.mkdir(exist_ok=True)

# ── Load data ────────────────────────────────────────────────────────────────
breeds = json.loads((ROOT / "large_dog_breeds.json").read_text())
ratings = json.loads((ROOT / "breed_ratings.json").read_text())
analysis = json.loads((ROOT / "service_score_analysis.json").read_text())

# Build lookup: slug -> breed dict
slug_to_breed = {b.get("dogtime_slug", ""): b for b in breeds}

# ── Style defaults ───────────────────────────────────────────────────────────
plt.rcParams.update({
    "figure.facecolor": "#f8f8f8",
    "axes.facecolor": "#ffffff",
    "axes.edgecolor": "#cccccc",
    "axes.grid": True,
    "grid.alpha": 0.3,
    "grid.color": "#999999",
    "font.family": "sans-serif",
    "font.size": 10,
    "axes.titlesize": 14,
    "axes.labelsize": 11,
})

ACCENT = "#2c7bb6"
ACCENT2 = "#d7191c"
ACCENT3 = "#fdae61"
PALETTE = ["#2c7bb6", "#d7191c", "#fdae61", "#1a9641", "#abd9e9",
           "#7570b3", "#e7298a", "#66a61e", "#e6ab02", "#a6761d"]


# ══════════════════════════════════════════════════════════════════════════════
# CHART 1: Weight vs Height scatter with breed labels
# ══════════════════════════════════════════════════════════════════════════════
def chart_weight_vs_height():
    fig, ax = plt.subplots(figsize=(14, 9))
    xs, ys, names, colors = [], [], [], []
    for b in breeds:
        w = b["weight_lbs"]
        h = b["height_in"]
        avg_w = (w["min"] + w["max"]) / 2
        avg_h = (h["min"] + h["max"]) / 2
        xs.append(avg_w)
        ys.append(avg_h)
        names.append(b["name"])
        colors.append(b.get("color", ACCENT))

    ax.scatter(xs, ys, c=colors, s=80, alpha=0.85, edgecolors="white", linewidths=0.5, zorder=3)

    # Label only non-overlapping names (show all but offset if close)
    from matplotlib.offsetbox import AnnotationBbox, TextArea
    for i, name in enumerate(names):
        ax.annotate(name, (xs[i], ys[i]),
                    textcoords="offset points", xytext=(6, 4),
                    fontsize=6.5, alpha=0.8, color="#333333")

    ax.set_xlabel("Average Weight (lbs)")
    ax.set_ylabel("Average Height (inches)")
    ax.set_title("Large Dog Breeds: Weight vs. Height", fontweight="bold")
    fig.tight_layout()
    fig.savefig(CHARTS_DIR / "weight_vs_height.png", dpi=150)
    plt.close(fig)
    print("  Saved weight_vs_height.png")


# ══════════════════════════════════════════════════════════════════════════════
# CHART 2: Lifespan range chart (horizontal bar)
# ══════════════════════════════════════════════════════════════════════════════
def chart_lifespan_ranges():
    sorted_breeds = sorted(breeds, key=lambda b: (b["lifespan_yrs"]["min"] + b["lifespan_yrs"]["max"]) / 2)
    names = [b["name"] for b in sorted_breeds]
    mins = [b["lifespan_yrs"]["min"] for b in sorted_breeds]
    maxs = [b["lifespan_yrs"]["max"] for b in sorted_breeds]
    ranges = [mx - mn for mn, mx in zip(mins, maxs)]

    fig, ax = plt.subplots(figsize=(12, max(16, len(names) * 0.28)))
    y_pos = range(len(names))
    ax.barh(y_pos, ranges, left=mins, height=0.7, color=ACCENT, alpha=0.8, edgecolor="white", linewidth=0.3)

    # Add midpoint markers
    mids = [(mn + mx) / 2 for mn, mx in zip(mins, maxs)]
    ax.scatter(mids, y_pos, color=ACCENT2, s=15, zorder=5, marker="d")

    ax.set_yticks(y_pos)
    ax.set_yticklabels(names, fontsize=7.5)
    ax.set_xlabel("Lifespan (years)")
    ax.set_title("Lifespan Ranges by Breed", fontweight="bold")
    ax.set_xlim(0, max(maxs) + 1)
    fig.tight_layout()
    fig.savefig(CHARTS_DIR / "lifespan_ranges.png", dpi=150)
    plt.close(fig)
    print("  Saved lifespan_ranges.png")


# ══════════════════════════════════════════════════════════════════════════════
# CHART 3: Service Dog Suitability Score distribution
# ══════════════════════════════════════════════════════════════════════════════
def chart_service_scores():
    scored = [(b["name"], b["service_dog_score"]) for b in breeds if b.get("service_dog_score") is not None]
    scored.sort(key=lambda x: x[1], reverse=True)

    names = [s[0] for s in scored]
    scores = [s[1] for s in scored]

    fig, ax = plt.subplots(figsize=(14, max(16, len(names) * 0.28)))
    colors_bar = [ACCENT if s >= 4 else (ACCENT3 if s == 3 else ACCENT2) for s in scores]
    y_pos = range(len(names))
    ax.barh(y_pos, scores, color=colors_bar, alpha=0.85, edgecolor="white", linewidth=0.3)
    ax.set_yticks(y_pos)
    ax.set_yticklabels(names, fontsize=7.5)
    ax.set_xlabel("Service Dog Suitability Score (1-5)")
    ax.set_title("Service Dog Suitability Score by Breed", fontweight="bold")
    ax.set_xlim(0, 5.5)
    ax.invert_yaxis()

    # Add score labels
    for i, s in enumerate(scores):
        ax.text(s + 0.08, i, str(s), va="center", fontsize=7, color="#555555")

    fig.tight_layout()
    fig.savefig(CHARTS_DIR / "service_dog_scores.png", dpi=150)
    plt.close(fig)
    print("  Saved service_dog_scores.png")


# ══════════════════════════════════════════════════════════════════════════════
# CHART 4: Top-10 / Bottom-10 service score comparison
# ══════════════════════════════════════════════════════════════════════════════
def chart_top_bottom_service():
    scored = [(b["name"], b["service_dog_score"]) for b in breeds if b.get("service_dog_score") is not None]
    scored.sort(key=lambda x: x[1], reverse=True)
    top = scored[:10]
    bottom = scored[-10:]

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6), sharey=False)

    # Top 10
    ax1.barh(range(len(top)), [s[1] for s in top], color=ACCENT, alpha=0.85, edgecolor="white")
    ax1.set_yticks(range(len(top)))
    ax1.set_yticklabels([s[0] for s in top], fontsize=9)
    ax1.set_xlim(0, 5.5)
    ax1.set_title("Top 10 Service Dog Scores", fontweight="bold")
    ax1.invert_yaxis()
    for i, s in enumerate(top):
        ax1.text(s[1] + 0.08, i, str(s[1]), va="center", fontsize=9, color="#555555")

    # Bottom 10
    ax2.barh(range(len(bottom)), [s[1] for s in bottom], color=ACCENT2, alpha=0.75, edgecolor="white")
    ax2.set_yticks(range(len(bottom)))
    ax2.set_yticklabels([s[0] for s in bottom], fontsize=9)
    ax2.set_xlim(0, 5.5)
    ax2.set_title("Bottom 10 Service Dog Scores", fontweight="bold")
    ax2.invert_yaxis()
    for i, s in enumerate(bottom):
        ax2.text(s[1] + 0.08, i, str(s[1]), va="center", fontsize=9, color="#555555")

    fig.tight_layout()
    fig.savefig(CHARTS_DIR / "top_bottom_service.png", dpi=150)
    plt.close(fig)
    print("  Saved top_bottom_service.png")


# ══════════════════════════════════════════════════════════════════════════════
# CHART 5: Trait heatmap — selected traits across all breeds
# ══════════════════════════════════════════════════════════════════════════════
def chart_trait_heatmap():
    key_traits = [
        "Easy To Train", "Intelligence", "Dog Friendly",
        "Friendly Toward Strangers", "General Health",
        "Sensitivity Level", "Prey Drive", "Tendency To Bark Or Howl",
        "Tolerates Being Alone", "Drooling Potential",
        "Kid-Friendly", "Exercise Needs",
    ]

    # Collect data for breeds that have all traits
    data_rows = []
    breed_names = []
    for b in breeds:
        slug = b.get("dogtime_slug", "")
        if slug not in ratings:
            continue
        r = ratings[slug]
        row = []
        complete = True
        for t in key_traits:
            v = r.get(t)
            if v is None:
                complete = False
                break
            row.append(v)
        if complete:
            data_rows.append(row)
            breed_names.append(b["name"])

    if not data_rows:
        print("  [skip] trait heatmap — no complete data")
        return

    matrix = np.array(data_rows)
    fig, ax = plt.subplots(figsize=(14, max(16, len(breed_names) * 0.28)))
    im = ax.imshow(matrix, aspect="auto", cmap="RdYlGn", vmin=1, vmax=5, interpolation="nearest")

    ax.set_xticks(range(len(key_traits)))
    ax.set_xticklabels(key_traits, rotation=45, ha="right", fontsize=8)
    ax.set_yticks(range(len(breed_names)))
    ax.set_yticklabels(breed_names, fontsize=7)
    ax.set_title("Breed Trait Ratings Heatmap (1-5 scale)", fontweight="bold", pad=15)

    # Add text annotations
    for i in range(matrix.shape[0]):
        for j in range(matrix.shape[1]):
            val = int(matrix[i, j])
            color = "white" if val <= 2 else "black"
            ax.text(j, i, str(val), ha="center", va="center", fontsize=5.5, color=color)

    cbar = fig.colorbar(im, ax=ax, fraction=0.02, pad=0.02)
    cbar.set_label("Rating (1-5)")

    fig.tight_layout()
    fig.savefig(CHARTS_DIR / "trait_heatmap.png", dpi=150)
    plt.close(fig)
    print("  Saved trait_heatmap.png")


# ══════════════════════════════════════════════════════════════════════════════
# CHART 6: Breeds by country of origin
# ══════════════════════════════════════════════════════════════════════════════
def chart_origin_distribution():
    from collections import Counter
    origins = Counter()
    for b in breeds:
        o = b.get("origin", "Unknown")
        # Normalize multi-origin like "Belgium/France"
        if "/" in o:
            for part in o.split("/"):
                origins[part.strip()] += 0.5
        else:
            origins[o] += 1

    # Sort by count
    sorted_origins = sorted(origins.items(), key=lambda x: x[1], reverse=True)
    labels = [o[0] for o in sorted_origins if o[1] >= 1]
    counts = [o[1] for o in sorted_origins if o[1] >= 1]
    other = sum(o[1] for o in sorted_origins if o[1] < 1)
    if other > 0:
        labels.append("Other")
        counts.append(other)

    fig, ax = plt.subplots(figsize=(12, 7))
    bars = ax.barh(range(len(labels)), counts, color=PALETTE * 3, alpha=0.85, edgecolor="white")
    ax.set_yticks(range(len(labels)))
    ax.set_yticklabels(labels, fontsize=10)
    ax.set_xlabel("Number of Breeds")
    ax.set_title("Breeds by Country of Origin", fontweight="bold")
    ax.invert_yaxis()

    for i, c in enumerate(counts):
        ax.text(c + 0.15, i, f"{c:.0f}" if c == int(c) else f"{c:.1f}", va="center", fontsize=9, color="#555555")

    fig.tight_layout()
    fig.savefig(CHARTS_DIR / "origin_distribution.png", dpi=150)
    plt.close(fig)
    print("  Saved origin_distribution.png")


# ══════════════════════════════════════════════════════════════════════════════
# CHART 7: Correlation matrix (12 service-score traits)
# ══════════════════════════════════════════════════════════════════════════════
def chart_correlation_matrix():
    traits = analysis["traits"]
    corr = np.array(analysis["correlation_matrix"])
    # Replace None with NaN
    corr = np.where(corr == None, np.nan, corr).astype(float)

    short_names = [t.replace("Tendency To Bark Or Howl", "Bark/Howl")
                    .replace("Friendly Toward Strangers", "Stranger Friendly")
                    .replace("Potential For Mouthiness", "Mouthiness")
                    .replace("Tolerates Being Alone", "Alone Tolerance")
                    .replace("Wanderlust Potential", "Wanderlust")
                    .replace("Drooling Potential", "Drooling")
                    .replace("Sensitivity Level", "Sensitivity")
                    .replace("General Health", "Health")
                    .replace("Easy To Train", "Trainability")
                    .replace("Dog Friendly", "Dog Friendly")
                    .replace("Prey Drive", "Prey Drive")
                    .replace("Intelligence", "Intelligence")
                   for t in traits]

    fig, ax = plt.subplots(figsize=(10, 9))
    im = ax.imshow(corr, cmap="RdBu_r", vmin=-1, vmax=1, interpolation="nearest")

    ax.set_xticks(range(len(short_names)))
    ax.set_xticklabels(short_names, rotation=45, ha="right", fontsize=8.5)
    ax.set_yticks(range(len(short_names)))
    ax.set_yticklabels(short_names, fontsize=8.5)
    ax.set_title("Pearson Correlation Matrix (12 Service-Score Traits)", fontweight="bold", pad=15)

    for i in range(len(traits)):
        for j in range(len(traits)):
            val = corr[i, j]
            if not np.isnan(val):
                color = "white" if abs(val) > 0.5 else "black"
                ax.text(j, i, f"{val:.2f}", ha="center", va="center", fontsize=6.5, color=color)

    cbar = fig.colorbar(im, ax=ax, fraction=0.046, pad=0.04)
    cbar.set_label("Pearson r")

    fig.tight_layout()
    fig.savefig(CHARTS_DIR / "correlation_matrix.png", dpi=150)
    plt.close(fig)
    print("  Saved correlation_matrix.png")


# ══════════════════════════════════════════════════════════════════════════════
# CHART 8: Average category ratings comparison
# ══════════════════════════════════════════════════════════════════════════════
def chart_category_averages():
    categories = {
        "Adaptability - Overall": [],
        "All-around friendliness - Overall": [],
        "Health And Grooming Needs - Overall": [],
        "Trainability - Overall": [],
        "Exercise needs - Overall": [],
    }
    short_cat = {
        "Adaptability - Overall": "Adaptability",
        "All-around friendliness - Overall": "Friendliness",
        "Health And Grooming Needs - Overall": "Health & Grooming",
        "Trainability - Overall": "Trainability",
        "Exercise needs - Overall": "Exercise Needs",
    }

    for slug, r in ratings.items():
        for cat in categories:
            v = r.get(cat)
            if v is not None:
                categories[cat].append(v)

    cat_names = list(categories.keys())
    avgs = [np.mean(categories[c]) if categories[c] else 0 for c in cat_names]
    stds = [np.std(categories[c]) if categories[c] else 0 for c in cat_names]
    labels = [short_cat[c] for c in cat_names]

    fig, ax = plt.subplots(figsize=(10, 5))
    x = range(len(labels))
    bars = ax.bar(x, avgs, yerr=stds, color=PALETTE[:5], alpha=0.85,
                  edgecolor="white", capsize=5, error_kw={"lw": 1.2, "alpha": 0.6})
    ax.set_xticks(x)
    ax.set_xticklabels(labels, fontsize=11)
    ax.set_ylabel("Average Rating (1-5)")
    ax.set_title("Average Category Ratings Across All Breeds", fontweight="bold")
    ax.set_ylim(0, 5.5)

    for i, (avg, std) in enumerate(zip(avgs, stds)):
        ax.text(i, avg + std + 0.15, f"{avg:.2f}", ha="center", fontsize=10, fontweight="bold", color="#333333")

    fig.tight_layout()
    fig.savefig(CHARTS_DIR / "category_averages.png", dpi=150)
    plt.close(fig)
    print("  Saved category_averages.png")


# ══════════════════════════════════════════════════════════════════════════════
# CHART 9: Weight distribution histogram
# ══════════════════════════════════════════════════════════════════════════════
def chart_weight_distribution():
    avg_weights = [(b["weight_lbs"]["min"] + b["weight_lbs"]["max"]) / 2 for b in breeds]

    fig, ax = plt.subplots(figsize=(10, 5))
    n, bins, patches = ax.hist(avg_weights, bins=15, color=ACCENT, alpha=0.8, edgecolor="white", linewidth=0.8)
    ax.axvline(np.mean(avg_weights), color=ACCENT2, linestyle="--", linewidth=1.5,
               label=f"Mean: {np.mean(avg_weights):.0f} lbs")
    ax.axvline(np.median(avg_weights), color=ACCENT3, linestyle="--", linewidth=1.5,
               label=f"Median: {np.median(avg_weights):.0f} lbs")

    ax.set_xlabel("Average Weight (lbs)")
    ax.set_ylabel("Number of Breeds")
    ax.set_title("Weight Distribution Across Large Dog Breeds", fontweight="bold")
    ax.legend(fontsize=10)
    fig.tight_layout()
    fig.savefig(CHARTS_DIR / "weight_distribution.png", dpi=150)
    plt.close(fig)
    print("  Saved weight_distribution.png")


# ══════════════════════════════════════════════════════════════════════════════
# Run all charts
# ══════════════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    print("Generating visualizations...\n")
    chart_weight_vs_height()
    chart_lifespan_ranges()
    chart_service_scores()
    chart_top_bottom_service()
    chart_trait_heatmap()
    chart_origin_distribution()
    chart_correlation_matrix()
    chart_category_averages()
    chart_weight_distribution()
    print(f"\nDone! Charts saved to {CHARTS_DIR}/")
