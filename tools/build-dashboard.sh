#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# build-dashboard.sh — bash wrapper around the cross-platform Node build script
# ═══════════════════════════════════════════════════════════════════════════════
# Usage:    bash tools/build-dashboard.sh
# Output:   dashboard/assets/js/dist/main.js  (committed runtime contract)
#
# Kept for backward compatibility with anyone calling the old script. The actual
# build logic lives in tools/build.mjs (cross-platform Node). Run that directly
# if you prefer: `node tools/build.mjs` works on Windows + Mac + Linux.
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
node "$ROOT/tools/build.mjs"
