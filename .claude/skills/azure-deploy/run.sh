#!/usr/bin/env bash
# Buduje obrazy Dockera (linux/amd64), wypycha na GitHub Container Registry
# i aktualizuje Azure Container Apps na nowy tag (wymusza świeżą rewizję).
#
# Użycie:
#   run.sh            # deploy backendu i frontendu
#   run.sh backend    # tylko backend
#   run.sh frontend   # tylko frontend
set -euo pipefail

SUB="61ad12b2-ac0f-49cb-af8b-049bff4a6d80"   # Azure for Students (Politechnika Łódzka)
RG="rg-fruitfarm"
BE_IMG="ghcr.io/centgeek/ff-backend"
FE_IMG="ghcr.io/centgeek/ff-frontend"

# Katalog repo = 3 poziomy w górę od tego skryptu (.claude/skills/azure-deploy/run.sh)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$SCRIPT_DIR/../../.." && pwd)"

TARGET="${1:-both}"
case "$TARGET" in
  backend|frontend|both) ;;
  *) echo "BŁĄD: nieznany cel '$TARGET'. Użyj: backend | frontend | both." >&2; exit 1 ;;
esac

# --- Preflight ---
command -v docker >/dev/null || { echo "BŁĄD: brak dockera." >&2; exit 1; }
docker buildx version >/dev/null 2>&1 || { echo "BŁĄD: brak docker buildx." >&2; exit 1; }
if ! grep -q 'ghcr.io' "${HOME}/.docker/config.json" 2>/dev/null; then
  echo "BŁĄD: brak logowania do ghcr.io. Zaloguj się:" >&2
  echo "  echo \$GHCR_TOKEN | docker login ghcr.io -u centgeek --password-stdin" >&2
  exit 1
fi

# Niemutowalny tag z gita (+ znacznik gdy są niezacommitowane zmiany)
SHA="$(git -C "$REPO" rev-parse --short HEAD 2>/dev/null || echo nogit)"
if ! git -C "$REPO" diff --quiet 2>/dev/null || ! git -C "$REPO" diff --cached --quiet 2>/dev/null; then
  SHA="${SHA}-dirty-$(date +%H%M%S)"
fi
TAG="$SHA"

echo "==> Subskrypcja: Azure for Students"
az account set --subscription "$SUB"

# Adres backendu — wkompilowywany do frontendu (Vite robi to na etapie buildu)
BE_FQDN=$(az containerapp show -n ca-backend -g "$RG" --query "properties.configuration.ingress.fqdn" -o tsv 2>/dev/null)
[ -n "${BE_FQDN:-}" ] || { echo "BŁĄD: nie znaleziono ca-backend w $RG." >&2; exit 1; }

echo "==> Tag obrazów: $TAG"
echo "==> Cel deployu: $TARGET"

# --- Build & push: backend ---
if [ "$TARGET" = "backend" ] || [ "$TARGET" = "both" ]; then
  echo "==> Buduję backend (linux/amd64) i wypycham na ghcr..."
  docker buildx build --platform linux/amd64 \
    -t "$BE_IMG:$TAG" -t "$BE_IMG:latest" \
    --push "$REPO/backend"
fi

# --- Build & push: frontend ---
if [ "$TARGET" = "frontend" ] || [ "$TARGET" = "both" ]; then
  # Frontend używa RELATYWNYCH ścieżek /api (BACKEND_URL=""), więc adresu backendu
  # NIE wkompilowujemy — nginx proxuje /api do BACKEND_ORIGIN (ustawiane w runtime niżej).
  echo "==> Buduję frontend (linux/amd64, ścieżki relatywne /api)..."
  docker buildx build --platform linux/amd64 \
    -t "$FE_IMG:$TAG" -t "$FE_IMG:latest" \
    --push "$REPO/frontend"
fi

# --- Aktualizacja Container Apps na nowy tag (wymusza nową rewizję) ---
if [ "$TARGET" = "backend" ] || [ "$TARGET" = "both" ]; then
  # Sekret JWT — utwórz raz, jeśli go nie ma (świeży 64-hex). Istniejącego NIE nadpisujemy,
  # bo to unieważniłoby już wydane tokeny.
  HAS_SECRET=$(az containerapp secret list -n ca-backend -g "$RG" --query "[?name=='jwt-secret'] | length(@)" -o tsv 2>/dev/null || echo 0)
  if [ "${HAS_SECRET:-0}" = "0" ]; then
    echo "==> Tworzę sekret jwt-secret (jednorazowo)..."
    az containerapp secret set -n ca-backend -g "$RG" --secrets "jwt-secret=$(openssl rand -hex 32)" --only-show-errors >/dev/null
  fi

  echo "==> Aktualizuję ca-backend → $BE_IMG:$TAG (+ env produkcyjne)"
  # Env produkcyjne wpinane razem z obrazem (jedna rewizja):
  #  - ciastka cross-... nie są potrzebne (reverse-proxy → ten sam origin), ale prod jest po HTTPS,
  #    więc Secure=true; SameSite=Lax wystarcza dla same-origin.
  #  - CORS_ALLOWED_ORIGINS pomijamy — przy proxy CORS nie zachodzi.
  #  - JWT_SECRET_KEY z sekretu Container Apps (nie z repo).
  az containerapp update -n ca-backend -g "$RG" --image "$BE_IMG:$TAG" \
    --set-env-vars \
      APP_COOKIE_SECURE=true \
      APP_COOKIE_SAME_SITE=Lax \
      SECURITY_BCRYPT_STRENGTH=12 \
      JWT_SECRET_KEY=secretref:jwt-secret \
    --only-show-errors >/dev/null
fi
if [ "$TARGET" = "frontend" ] || [ "$TARGET" = "both" ]; then
  echo "==> Aktualizuję ca-frontend → $FE_IMG:$TAG (BACKEND_ORIGIN=https://$BE_FQDN)"
  # BACKEND_ORIGIN konfigurowane w RUNTIME (nie build-arg) — nginx proxuje /api tutaj.
  az containerapp update -n ca-frontend -g "$RG" --image "$FE_IMG:$TAG" \
    --set-env-vars "BACKEND_ORIGIN=https://$BE_FQDN" \
    --only-show-errors >/dev/null
fi

FE_FQDN=$(az containerapp show -n ca-frontend -g "$RG" --query "properties.configuration.ingress.fqdn" -o tsv 2>/dev/null)

echo
echo "Deploy zakończony (tag: $TAG):"
echo "  Frontend: https://$FE_FQDN"
echo "  Backend : https://$BE_FQDN"
echo
echo "Nowa rewizja wstaje ~30-60s. Jeśli baza jest zatrzymana, uruchom skill 'azure-up'."
echo "Logi backendu: az containerapp logs show -n ca-backend -g $RG --tail 50"
