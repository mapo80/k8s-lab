#!/usr/bin/env bash
# Riavvia il runner quando riapri il Codespace (lo chiama .devcontainer/post-start.sh).
cd "$HOME/actions-runner" 2>/dev/null || exit 0      # runner non ancora registrato
pgrep -f Runner.Listener > /dev/null && exit 0       # sta già girando
nohup ./run.sh > runner.log 2>&1 &
echo "Runner riavviato."
