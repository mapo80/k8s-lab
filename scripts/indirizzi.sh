#!/usr/bin/env bash
# Stampa gli indirizzi di Headlamp e dell'applicazione di questo Codespace.
# Si possono aprire con Ctrl+clic. Li trovate anche nella scheda PORTS.
DOMINIO="${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-app.github.dev}"
if [ -n "${CODESPACE_NAME:-}" ]; then
    HEADLAMP="https://${CODESPACE_NAME}-30090.${DOMINIO}"
    APP="https://${CODESPACE_NAME}-30080.${DOMINIO}"
else
    HEADLAMP="http://localhost:30090"
    APP="http://localhost:30080"
fi
echo "Headlamp:      $HEADLAMP"
# l'app c'è solo dopo il primo deploy: lo lancia la pipeline, nel Laboratorio 2
if kubectl get deployment web -n impianti > /dev/null 2>&1; then
    echo "Applicazione:  $APP"
else
    echo "Applicazione:  non ancora installata. La installa la pipeline: Actions → CI/CD → Run workflow"
fi
