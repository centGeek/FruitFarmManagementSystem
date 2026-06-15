#!/usr/bin/env bash
# Ustawia backend (ca-backend) z powrotem na scale-to-zero (min-replicas=0) — po ~5 min bezczynności
# replika gaśnie i przestaje kosztować. Pierwsze żądanie po przerwie płaci zimny start JVM (~30-60 s).
# Odwrotność: azure-backend-on (always-on). Pełne oszczędzanie: uruchom razem z azure-stop.
set -euo pipefail

SUB="61ad12b2-ac0f-49cb-af8b-049bff4a6d80"   # Azure for Students (Politechnika Łódzka)
RG="rg-fruitfarm"
APP="ca-backend"

echo "==> Subskrypcja: Azure for Students"
az account set --subscription "$SUB"

CUR=$(az containerapp show -n "$APP" -g "$RG" --query "properties.template.scale.minReplicas" -o tsv 2>/dev/null)
if [ -z "${CUR:-}" ]; then
  echo "BŁĄD: nie znaleziono $APP w grupie $RG." >&2
  exit 1
fi
echo "==> $APP: min-replicas teraz = $CUR"

if [ "$CUR" = "0" ]; then
  echo "Backend już jest scale-to-zero (min=0) — nic do zrobienia."
else
  echo "==> Ustawiam $APP na scale-to-zero (min-replicas=0)..."
  az containerapp update -n "$APP" -g "$RG" --min-replicas 0 --only-show-errors >/dev/null
  echo "==> Gotowe."
fi

az containerapp show -n "$APP" -g "$RG" --query "properties.template.scale" -o json

cat <<'EOF'

Backend będzie gasł po ~5 min bezczynności i przestanie kosztować.
Cena: pierwsze żądanie po przerwie = zimny start JVM (~30-60 s, ekran „Sprawdzanie autentyfikacji…").
Pełne oszczędzanie kredytu: uruchom też 'make azure-stop' (zatrzymuje bazę). Przed demem: 'make azure-up'.
Powrót do braku zimnego startu: 'make azure-backend-on'.
EOF
