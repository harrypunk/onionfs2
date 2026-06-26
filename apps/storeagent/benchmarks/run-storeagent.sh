#!/usr/bin/env bash
# Start the storeagent against the Downloads test folder.
# Run this from the project root: /home/j9/work/onionfs2

set -e

REPO_ROOT="/home/j9/work/onionfs2"
CONFIG="$REPO_ROOT/apps/storeagent/benchmarks/storeagent-config.json"

cd "$REPO_ROOT"
CONFIG_PATH="$CONFIG" bun run apps/storeagent/src/index.ts
