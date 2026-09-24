#!/usr/bin/env bash
# Stampa gli indirizzi di Headlamp e dell'applicazione di questo Codespace.
# Si possono aprire con Ctrl+clic. Li trovate anche nella scheda PORTS.
DOMINIO="${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-app.github.dev}"
if [ -z "${CODESPACE_NAME:-}" ]; then
    echo "Non siete in un Codespace: Headlamp è su http://localhost:30090, l'app su http://localhost:30080"
    exit 0
fi
echo "Headlamp:      https://${CODESPACE_NAME}-30090.${DOMINIO}"
echo "Applicazione:  https://${CODESPACE_NAME}-30080.${DOMINIO}   (dopo il primo deploy)"
