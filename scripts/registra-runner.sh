#!/usr/bin/env bash
# Collega questo Codespace al tuo repository come «runner»:
# così il job «deploy» della pipeline gira qui, dove c'è il cluster.
# Si lancia una volta sola: ./scripts/registra-runner.sh
set -euo pipefail

echo
echo "1. Apri questa pagina (Ctrl+clic):"
echo "   https://github.com/$GITHUB_REPOSITORY/settings/actions/runners/new"
echo "2. Nella sezione «Configure» trovi la riga:  ./config.sh --url ... --token XXXXXXXX"
echo "3. Copia solo il token (quello dopo --token) e incollalo qui sotto."
echo
read -rp "Token: " TOKEN

cd "$HOME"
mkdir -p actions-runner && cd actions-runner
if [ ! -f config.sh ]; then
    echo "Scarico il runner..."
    curl -fsSL https://github.com/actions/runner/releases/download/v2.337.0/actions-runner-linux-x64-2.337.0.tar.gz | tar -xz
    sudo ./bin/installdependencies.sh > /dev/null
fi
./config.sh --unattended --replace --url "https://github.com/$GITHUB_REPOSITORY" --token "$TOKEN" --name codespace --labels k8s-lab

nohup ./run.sh > runner.log 2>&1 &
echo
echo "Fatto! Il runner «codespace» è attivo. Controlla su GitHub: Settings → Actions → Runners."
