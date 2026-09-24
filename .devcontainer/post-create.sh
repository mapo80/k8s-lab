#!/usr/bin/env bash
# Parte una volta sola, quando si crea il Codespace: installa k3d e k9s.
set -euo pipefail

K3D_VERSION=v5.9.0
K9S_VERSION=v0.51.0
ARCH=$(dpkg --print-architecture)   # amd64 nei Codespaces

# k3d: crea cluster k3s i cui nodi sono container Docker
sudo curl -fsSL -o /usr/local/bin/k3d \
    "https://github.com/k3d-io/k3d/releases/download/$K3D_VERSION/k3d-linux-$ARCH"
sudo chmod +x /usr/local/bin/k3d

# k9s: interfaccia a terminale per il cluster
curl -fsSL "https://github.com/derailed/k9s/releases/download/$K9S_VERSION/k9s_Linux_$ARCH.tar.gz" \
    | sudo tar -xz -C /usr/local/bin k9s

# envsubst per mettere il nome delle immagini nei manifest
sudo apt-get update -qq && sudo apt-get install -y -qq gettext-base >/dev/null

helm repo add headlamp https://kubernetes-sigs.github.io/headlamp/ >/dev/null
echo "Strumenti installati: $(k3d version | head -1), k9s $K9S_VERSION"
