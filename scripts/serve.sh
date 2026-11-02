#!/usr/bin/env bash
# Start the production server in the background on $1 (default 3100) with the local test env.
cd "$(dirname "$0")/.." && set -a && . scripts/test.env && set +a && nohup npx next start -p "${1:-3100}" > "${LOG:-/dev/null}" 2>&1 &
