#!/usr/bin/env bash
# Start the production server in the background on $1 (default 3100).
cd "$(dirname "$0")/.." && NEXT_TELEMETRY_DISABLED=1 LEADS_LOCAL_FILE=1 nohup npx next start -p "${1:-3100}" > "${LOG:-/dev/null}" 2>&1 &
