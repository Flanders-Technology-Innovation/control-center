#!/bin/sh
# Maintained by cyantula — do not edit by hand; cyantula overwrites this file.
# Runs when an agent starts a session in this repository. Everything it prints
# becomes context for that session.
set -eu

echo "This app runs on cyantula, your company's internal app platform."
echo "Platform rules: .spin/guidelines.md — how the app must behave (auth, data, config, cron)."
echo "Design rules:   DESIGN.md — how it must look and feel."
echo "Both are maintained by cyantula. Do not edit them; put project notes in CLAUDE.md."
echo

# Point at what this repository is actually missing, rather than repeating advice.
[ -f .env.example ] || echo "NOTE: no .env.example — cyantula reads it to ask the owner for configuration. Add one."
grep -rqs "healthz" --include='*.*' . \
  || echo "NOTE: no /healthz endpoint found — cyantula's uptime monitor needs one (200 healthy, 503 broken)."
grep -rqs "0\.0\.0\.0" --include='*.*' . \
  || echo "NOTE: the server must listen on 0.0.0.0 and read PORT from the environment, or cyantula cannot reach it."

exit 0
