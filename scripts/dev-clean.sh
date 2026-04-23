#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# If something is listening on 3000, stop it (usually previous next dev).
PID="$(lsof -ti tcp:3000 -sTCP:LISTEN 2>/dev/null || true)"
if [[ -n "${PID}" ]]; then
  echo "Port 3000 in use by PID ${PID}. Stopping..."
  kill "${PID}" 2>/dev/null || true
  sleep 0.2
fi

# Remove stale Next dev lock if present.
rm -f ".next/dev/lock" 2>/dev/null || true

echo "Starting Next.js dev server on port 3000..."
exec npm run dev

