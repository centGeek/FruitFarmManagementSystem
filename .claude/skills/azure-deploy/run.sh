#!/usr/bin/env bash
# Builds Docker images (linux/amd64), pushes them to GitHub Container Registry
# and updates Azure Container Apps to the new tag (forces a fresh revision).
#
# Usage:
#   run.sh            # deploy backend and frontend
#   run.sh backend    # backend only
#   run.sh frontend   # frontend only
set -euo pipefail

SUB="61ad12b2-ac0f-49cb-af8b-049bff4a6d80"   # Azure for Students (Lodz University of Technology)
RG="rg-fruitfarm"
BE_IMG="ghcr.io/centgeek/ff-backend"
FE_IMG="ghcr.io/centgeek/ff-frontend"

# Repo directory = 3 levels up from this script (.claude/skills/azure-deploy/run.sh)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$SCRIPT_DIR/../../.." && pwd)"

TARGET="${1:-both}"
case "$TARGET" in
  backend|frontend|both) ;;
  *) echo "ERROR: unknown target '$TARGET'. Use: backend | frontend | both." >&2; exit 1 ;;
esac

# --- Preflight ---
command -v docker >/dev/null || { echo "ERROR: docker not found." >&2; exit 1; }
docker buildx version >/dev/null 2>&1 || { echo "ERROR: docker buildx not found." >&2; exit 1; }
if ! grep -q 'ghcr.io' "${HOME}/.docker/config.json" 2>/dev/null; then
  echo "ERROR: not logged in to ghcr.io. Log in:" >&2
  echo "  echo \$GHCR_TOKEN | docker login ghcr.io -u centgeek --password-stdin" >&2
  exit 1
fi

# Immutable tag from git (+ marker when there are uncommitted changes)
SHA="$(git -C "$REPO" rev-parse --short HEAD 2>/dev/null || echo nogit)"
if ! git -C "$REPO" diff --quiet 2>/dev/null || ! git -C "$REPO" diff --cached --quiet 2>/dev/null; then
  SHA="${SHA}-dirty-$(date +%H%M%S)"
fi
TAG="$SHA"

echo "==> Subscription: Azure for Students"
az account set --subscription "$SUB"

# Backend FQDN — passed to ca-frontend at runtime as BACKEND_ORIGIN (nginx proxies /api there);
# NOT compiled into the frontend bundle, which uses relative /api paths.
BE_FQDN=$(az containerapp show -n ca-backend -g "$RG" --query "properties.configuration.ingress.fqdn" -o tsv 2>/dev/null)
[ -n "${BE_FQDN:-}" ] || { echo "ERROR: ca-backend not found in $RG." >&2; exit 1; }

echo "==> Image tag: $TAG"
echo "==> Deploy target: $TARGET"

# --- Build & push: backend ---
if [ "$TARGET" = "backend" ] || [ "$TARGET" = "both" ]; then
  echo "==> Building backend (linux/amd64) and pushing to ghcr..."
  docker buildx build --platform linux/amd64 \
    -t "$BE_IMG:$TAG" -t "$BE_IMG:latest" \
    --push "$REPO/backend"
fi

# --- Build & push: frontend ---
if [ "$TARGET" = "frontend" ] || [ "$TARGET" = "both" ]; then
  # Frontend uses RELATIVE /api paths (BACKEND_URL=""), so the backend address
  # is NOT compiled in — nginx proxies /api to BACKEND_ORIGIN (set at runtime below).
  echo "==> Building frontend (linux/amd64, relative /api paths)..."
  docker buildx build --platform linux/amd64 \
    -t "$FE_IMG:$TAG" -t "$FE_IMG:latest" \
    --push "$REPO/frontend"
fi

# --- Updating Container Apps to the new tag (forces a new revision) ---
if [ "$TARGET" = "backend" ] || [ "$TARGET" = "both" ]; then
  # JWT secret — create once if it does not exist (fresh 64-hex). We do NOT overwrite an existing one,
  # because that would invalidate already-issued tokens.
  HAS_SECRET=$(az containerapp secret list -n ca-backend -g "$RG" --query "[?name=='jwt-secret'] | length(@)" -o tsv 2>/dev/null || echo 0)
  if [ "${HAS_SECRET:-0}" = "0" ]; then
    echo "==> Creating jwt-secret secret (one-time)..."
    az containerapp secret set -n ca-backend -g "$RG" --secrets "jwt-secret=$(openssl rand -hex 32)" --only-show-errors >/dev/null
  fi

  echo "==> Updating ca-backend → $BE_IMG:$TAG (+ production env)"
  # Production env attached together with the image (single revision):
  #  - cross-... cookies are not needed (reverse-proxy → same origin), but prod is over HTTPS,
  #    so Secure=true; SameSite=Lax is enough for same-origin.
  #  - we skip CORS_ALLOWED_ORIGINS — with the proxy, CORS does not occur.
  #  - JWT_SECRET_KEY from the Container Apps secret (not from the repo).
  az containerapp update -n ca-backend -g "$RG" --image "$BE_IMG:$TAG" \
    --set-env-vars \
      APP_COOKIE_SECURE=true \
      APP_COOKIE_SAME_SITE=Lax \
      SECURITY_BCRYPT_STRENGTH=12 \
      JWT_SECRET_KEY=secretref:jwt-secret \
    --only-show-errors >/dev/null
fi
if [ "$TARGET" = "frontend" ] || [ "$TARGET" = "both" ]; then
  echo "==> Updating ca-frontend → $FE_IMG:$TAG (BACKEND_ORIGIN=https://$BE_FQDN)"
  # BACKEND_ORIGIN configured at RUNTIME (not a build-arg) — nginx proxies /api here.
  az containerapp update -n ca-frontend -g "$RG" --image "$FE_IMG:$TAG" \
    --set-env-vars "BACKEND_ORIGIN=https://$BE_FQDN" \
    --only-show-errors >/dev/null
fi

FE_FQDN=$(az containerapp show -n ca-frontend -g "$RG" --query "properties.configuration.ingress.fqdn" -o tsv 2>/dev/null)

echo
echo "Deploy finished (tag: $TAG):"
echo "  Frontend: https://$FE_FQDN"
echo "  Backend : https://$BE_FQDN"
echo
echo "New revision comes up in ~30-60s. If the database is stopped, run the 'azure-up' skill."
echo "Backend logs: az containerapp logs show -n ca-backend -g $RG --tail 50"
