#!/usr/bin/env bash
set -euo pipefail

npm install
bash scripts/healthcheck.sh
