#!/bin/bash
# run-tests.sh — vollständiger Testlauf für swissdentalindustry.
# Startet den Dev-Server falls nötig, führt vitest (+ optional Playwright) aus
# und räumt wieder auf.
#
#   bash run-tests.sh          # Unit + Integration + DB + Prod-Smoke
#   bash run-tests.sh --e2e    # zusätzlich die Browser-Tests
#   TEST_PROD_URL= bash run-tests.sh   # ohne Prod-Smoke

set -u

API_BASE="${TEST_API_BASE:-http://localhost:3000}"
RUN_E2E=0
[ "${1:-}" = "--e2e" ] && RUN_E2E=1

echo "Tests für swissdentalindustry (dev: $API_BASE, prod: ${TEST_PROD_URL-Standard-Deployment})"

DEV_PID=""
if ! curl -sf "$API_BASE/admin/login" > /dev/null 2>&1; then
  echo "Dev-Server läuft nicht — starte im Hintergrund…"
  npm run dev > /tmp/sdi-dev.log 2>&1 &
  DEV_PID=$!
  for _ in $(seq 1 30); do
    curl -sf "$API_BASE/admin/login" > /dev/null 2>&1 && { echo "Dev-Server bereit."; break; }
    sleep 1
  done
fi

npm run test
EXIT_CODE=$?

if [ $RUN_E2E -eq 1 ] && [ $EXIT_CODE -eq 0 ]; then
  npx playwright test
  EXIT_CODE=$?
fi

if [ -n "$DEV_PID" ]; then
  echo "Stoppe Dev-Server (pid $DEV_PID)…"
  kill "$DEV_PID" 2>/dev/null
  wait "$DEV_PID" 2>/dev/null
fi

if [ $EXIT_CODE -eq 0 ]; then
  echo "Alle Tests bestanden"
else
  echo "Tests fehlgeschlagen — siehe Ausgabe oben"
fi

exit $EXIT_CODE
