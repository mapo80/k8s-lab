#!/usr/bin/env bash
# Installa (o aggiorna) l'applicazione nel cluster.
# Lo usa il job «deploy» della pipeline. Si può lanciare anche a mano: ./scripts/deploy.sh
set -euo pipefail
cd "$(dirname "$0")/.."

# 1. Il nome delle immagini: ghcr.io/<utente>/<repository>/api e /web (tutto minuscolo)
REPO=$(echo "$GITHUB_REPOSITORY" | tr '[:upper:]' '[:lower:]')
TAG="${TAG:-latest}"
export IMMAGINE_API="${IMMAGINE_API:-ghcr.io/$REPO/api:$TAG}"
export IMMAGINE_WEB="${IMMAGINE_WEB:-ghcr.io/$REPO/web:$TAG}"
echo "Immagini: $IMMAGINE_API e $IMMAGINE_WEB"

# 2. Il namespace
kubectl apply -f k8s/namespace.yaml

# 3. Le credenziali per scaricare le immagini da GHCR (la pipeline passa il suo GITHUB_TOKEN)
if [ -n "${GHCR_TOKEN:-}" ]; then
    kubectl create secret docker-registry ghcr -n impianti \
        --docker-server=ghcr.io --docker-username="$GHCR_USER" --docker-password="$GHCR_TOKEN" \
        --dry-run=client -o yaml | kubectl apply -f -
fi

# 4. Database, backend e frontend (envsubst mette il nome delle immagini nei file)
kubectl apply -f k8s/db.yaml
envsubst '$IMMAGINE_API' < k8s/app.yaml | kubectl apply -f -
envsubst '$IMMAGINE_WEB' < k8s/web.yaml | kubectl apply -f -

# 5. Si aspetta che i pod nuovi siano pronti: se non lo diventano, il deploy fallisce
kubectl rollout status deployment/db  -n impianti --timeout=5m
kubectl rollout status deployment/app -n impianti --timeout=5m
kubectl rollout status deployment/web -n impianti --timeout=5m
kubectl get pods -n impianti
