#!/usr/bin/env bash
# Build the app and publish dist/ to the gh-pages branch (GitHub Pages).
# Usage: npm run deploy
set -euo pipefail

cd "$(dirname "$0")/.."
REMOTE_URL="$(git remote get-url origin)"

npm run build

cd dist
touch .nojekyll
git init -q -b gh-pages
git add -A
git -c user.name="HazIT Deploy" -c user.email="deploy@hazit.local" \
  commit -q -m "Deploy $(date -u +%FT%TZ)"
git push -f -q "$REMOTE_URL" gh-pages
rm -rf .git
echo "Deployed to gh-pages."
