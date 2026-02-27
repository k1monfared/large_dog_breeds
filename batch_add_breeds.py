#!/usr/bin/env python3
"""Batch-add 50 large breeds sequentially using add_breed_entry()."""
import sys
from add_breed import add_breed_entry

BREEDS = [
    "Tibetan Mastiff",
    "Neapolitan Mastiff",
    "Komondor",
    "Kuvasz",
    "Old English Sheepdog",
    "Scottish Deerhound",
    "Borzoi",
    "Afghan Hound",
    "Greyhound",
    "Giant Schnauzer",
    "Standard Poodle",
    "Siberian Husky",
    "Samoyed",
    "Belgian Malinois",
    "Bouvier des Flandres",
    "Briard",
    "Flat-Coated Retriever",
    "Chesapeake Bay Retriever",
    "Gordon Setter",
    "Irish Setter",
    "English Setter",
    "Vizsla",
    "German Shorthaired Pointer",
    "Spinone Italiano",
    "Catahoula Leopard Dog",
    "Bluetick Coonhound",
    "Redbone Coonhound",
    "Otterhound",
    "Collie",
    "Belgian Tervuren",
    "Beauceron",
    "Saluki",
    "Chow Chow",
    "Chinook",
    "Irish Water Spaniel",
    "Dogo Argentino",
    "Belgian Laekenois",
    "Belgian Sheepdog",
    "Presa Canario",
    "American Bulldog",
    "Dalmatian",
    "Norwegian Elkhound",
    "Plott Hound",
    "Black and Tan Coonhound",
    "Treeing Walker Coonhound",
    "Ibizan Hound",
    "Azawakh",
    "Sloughi",
    "Dutch Shepherd",
    "Entlebucher Mountain Dog",
]

ok_count = 0
fail_count = 0
skip_count = 0

for breed in BREEDS:
    print(f"\n{'='*60}")
    print(f"Adding: {breed}")
    print('='*60)
    result = add_breed_entry(breed)
    if result["ok"]:
        ok_count += 1
        if result.get("placeholders"):
            print(f"  Placeholders to fill: {result['placeholders']}")
    elif "duplicate" in result.get("error", "").lower() or "already" in result.get("error", "").lower():
        skip_count += 1
        print(f"  SKIP (duplicate): {result['error']}")
    else:
        fail_count += 1
        print(f"  FAIL: {result['error']}")

print(f"\n{'='*60}")
print(f"DONE — added: {ok_count}, skipped (dup): {skip_count}, failed: {fail_count}")
