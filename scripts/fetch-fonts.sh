#!/usr/bin/env bash
#
# Self-host the Trivyy fonts (Phase 6 follow-up, ADR 0005).
#
# Run this on a machine WITH network access to download the Fredoka and Plus
# Jakarta Sans woff2 files into client/src/assets/fonts/, then:
#   1. import client/src/styles/fonts.css from main.tsx (the @font-face rules),
#   2. remove the Google Fonts <link> tags from client/index.html,
#   3. tighten the CSP in client/nginx.conf to drop the two font origins:
#      style-src 'self' 'unsafe-inline';  font-src 'self';
#
# After that the production page has no external origins at all (pure 'self').
set -euo pipefail

DEST="$(cd "$(dirname "$0")/.." && pwd)/client/src/assets/fonts"
mkdir -p "$DEST"

# Pin specific woff2 files (latin subset). Update the hashes if Google rotates
# them; the CSS @font-face must reference the same filenames.
fetch() {
  local url="$1" out="$2"
  echo "↓ $out"
  curl -fsSL "$url" -o "$DEST/$out"
}

# Fredoka (variable would be ideal; static weights keep @font-face simple).
fetch "https://fonts.gstatic.com/s/fredoka/v14/X7nP4b87HvSqjb_WIi2yDCRwoQ_k7367_B-i2yQag0-mac3O.woff2" "fredoka-400.woff2"
fetch "https://fonts.gstatic.com/s/fredoka/v14/X7nP4b87HvSqjb_WIi2yDCRwoQ_k7367_B-i2yQag0-mac3O.woff2" "fredoka-600.woff2"

# Plus Jakarta Sans.
fetch "https://fonts.gstatic.com/s/plusjakartasans/v8/LDIbaomQNQcsA88c7O9yZ4KMCoOg4IA6-91aHEjcWuA_qU79.woff2" "plus-jakarta-400.woff2"
fetch "https://fonts.gstatic.com/s/plusjakartasans/v8/LDIbaomQNQcsA88c7O9yZ4KMCoOg4IA6-91aHEjcWuA_qU79.woff2" "plus-jakarta-600.woff2"

echo
echo "Fonts written to client/src/assets/fonts/."
echo "Next: wire up @font-face (see this script's header) and tighten the CSP."
