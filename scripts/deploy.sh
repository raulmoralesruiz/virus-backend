#!/usr/bin/env bash
# Deploy de virus-backend (Node/Express + socket.io) → TrueNAS (red local)
#
# Uso:
#   pnpm run deploy         # build + sync a TrueNAS
#   pnpm run deploy:dry     # dry-run: muestra lo que se transferiría, sin tocar nada
#   NO_BUILD=1 pnpm run deploy   # sync sin reconstruir (dist/ ya existe)
#
# Config (una sola vez): copia .deployrc.example a .deployrc y rellena:
#   DEPLOY_HOST  IP u hostname de TrueNAS en la LAN (ej. 192.168.x.x)
#   DEPLOY_USER  usuario SSH con escritura en la ruta destino
#   DEPLOY_PATH  (opcional, por defecto /mnt/data-nas/www/virus/backend —
#                el contenedor Docker `virus-backend` (node:20-alpine, puerto
#                3000) monta ESO como /app y arranca `npm install && node
#                dist/server.js`)
#
# ⚠️ El --delete queda acotado a la subcarpeta dist/ del destino: el volumen
#    backend/ contiene también node_modules/ (creado por npm install dentro
#    del contenedor), que NO debe borrarse.

set -euo pipefail
cd "$(dirname "$0")/.."

# --- config ----------------------------------------------------------------
if [[ -f .deployrc ]]; then
  # shellcheck disable=SC1091
  source .deployrc
fi

DEPLOY_HOST="${DEPLOY_HOST:-}"
DEPLOY_USER="${DEPLOY_USER:-$USER}"
DEPLOY_PATH="${DEPLOY_PATH:-/mnt/data-nas/www/virus/backend}"

if [[ -z "$DEPLOY_HOST" ]]; then
  echo "error: DEPLOY_HOST no definido." >&2
  echo "  cp .deployrc.example .deployrc  # y rellena host/usuario" >&2
  exit 1
fi

DRY_RUN="${DRY_RUN:-0}"
NO_BUILD="${NO_BUILD:-0}"

# --- build -----------------------------------------------------------------
if [[ "$NO_BUILD" == "1" ]]; then
  echo "→ omitiendo build (NO_BUILD=1)"
else
  echo "→ pnpm run build"
  pnpm run build
fi

if [[ ! -d dist ]]; then
  echo "error: dist/ no existe. Ejecuta pnpm run build primero." >&2
  exit 1
fi

# --- conectividad SSH (fail fast con mensaje útil) --------------------------
if ! ssh -o BatchMode=yes -o ConnectTimeout=5 -o StrictHostKeyChecking=accept-new \
      "${DEPLOY_USER}@${DEPLOY_HOST}" true 2>/dev/null; then
  echo "error: no hay acceso SSH sin contraseña a ${DEPLOY_USER}@${DEPLOY_HOST}." >&2
  echo "  Una sola vez:  ssh-copy-id ${DEPLOY_USER}@${DEPLOY_HOST}" >&2
  exit 1
fi

# --- rsync -----------------------------------------------------------------
RSYNC=(rsync -az --stats --mkpath --delete)
[[ "$DRY_RUN" == "1" ]] && RSYNC+=(--dry-run)

echo "→ rsync dist/ → ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/dist/"
"${RSYNC[@]}" dist/ "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/dist/"

echo "→ rsync package.json → ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/"
if [[ "$DRY_RUN" == "1" ]]; then
  echo "  (dry-run: no se transfirió)"
else
  rsync -az --stats --mkpath package.json "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/"
fi

if [[ "$DRY_RUN" == "1" ]]; then
  echo "✓ dry-run completo (no se transfirió nada)"
else
  echo "✓ deploy completado"
fi
