#!/usr/bin/env bash
set -euo pipefail

echo "== repo =="
basename "$(git rev-parse --show-toplevel)"

echo
echo "== branch =="
git status --short --branch

echo
echo "== recent commits =="
git log --oneline -5

echo
echo "== runtime =="
node --version
npm --version

echo
echo "== package scripts =="
node - <<'NODE'
const fs = require("fs");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const scripts = pkg.scripts || {};
for (const [name, cmd] of Object.entries(scripts)) {
  console.log(`${name}: ${cmd}`);
}
NODE

echo
echo "== verify =="
npm run verify
