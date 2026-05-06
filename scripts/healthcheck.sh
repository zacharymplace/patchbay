#!/usr/bin/env bash
set -euo pipefail

echo "## Repo"
pwd

echo
echo "## Git"
git status --short --branch
git remote -v || true

echo
echo "## Runtime"
node -v
npm -v

echo
echo "## Checks"
npm run check
npm run sim
npm run sim:variants
npm run sim:player-plan
