#!/usr/bin/env bash
# Parte da solo ogni volta che si apre il Codespace:
# accende il cluster Kubernetes, installa Headlamp e riavvia il runner.
set -euo pipefail
cd "$(dirname "$0")/.."

# Docker deve essere pronto prima di tutto il resto
for _ in $(seq 1 60); do docker info > /dev/null 2>&1 && break; sleep 2; done

if k3d cluster list lab > /dev/null 2>&1; then
    # il cluster esiste già (Codespace riaperto): lo si riaccende, con tutto quello che c'era dentro
    k3d cluster start lab --wait
else
    # primo avvio: si crea il cluster «lab».
    # 30080 = il frontend dell'app, 30090 = Headlamp
    k3d cluster create lab \
        --api-port 0.0.0.0:6443 \
        -p "30080:30080@server:0" \
        -p "30090:30090@server:0" \
        --k3s-arg "--disable=traefik@server:0" \
        --k3s-arg "--tls-san=127.0.0.1@server:0" \
        --wait
fi
kubectl config use-context k3d-lab > /dev/null

# Headlamp: l'interfaccia grafica del cluster, sulla porta 30090.
# Niente token: la porta del Codespace è privata, la apre solo il proprietario.
helm upgrade --install headlamp headlamp/headlamp \
    --namespace kube-system \
    --set service.type=NodePort \
    --set service.nodePort=30090 \
    --set config.unsafeUseServiceAccountToken=true \
    --wait > /dev/null

./scripts/avvia-runner.sh

echo
kubectl get nodes
echo
echo "✅ Il cluster è pronto."
./scripts/indirizzi.sh
