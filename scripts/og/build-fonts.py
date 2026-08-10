#!/usr/bin/env python3
"""
Convert the site's variable woff2 fonts into static ttf instances for Satori.

Satori (used by scripts/og/generate.mjs) can't read woff2 and can't pick a
weight off a variable axis, so the OG generator needs plain ttf files pinned
to the weights the cards actually use.

Run this only when the type system changes:

    pip install fonttools brotli
    python3 scripts/og/build-fonts.py

Output lands in scripts/og/fonts/ and is committed – the deploy runs on a
clean checkout with no Python available.
"""

from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public" / "fonts"
OUT = Path(__file__).resolve().parent / "fonts"

# (variable source, [(output name, weight)])
JOBS = [
    (
        "CabinetGrotesk-Variable.woff2",
        [("CabinetGrotesk-Medium.ttf", 500), ("CabinetGrotesk-Bold.ttf", 700)],
    ),
    (
        "GeneralSans-Variable.woff2",
        [("GeneralSans-Regular.ttf", 400), ("GeneralSans-Medium.ttf", 500)],
    ),
]


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    for source, targets in JOBS:
        for name, weight in targets:
            font = TTFont(SRC / source)
            static = instancer.instantiateVariableFont(
                font, {"wght": weight}, inplace=False, updateFontNames=False
            )
            static.flavor = None  # drop woff2 compression
            static.save(OUT / name)
            print(f"{source} @ wght={weight} -> {name}")


if __name__ == "__main__":
    main()
