#!/usr/bin/env bash
# Przypina backend (ca-backend) do min-replicas=1 — replika JVM chodzi 24/7, więc znika zimny start
# (długi ekran „Sprawdzanie autentyfikacji…" po bezczynności). Kosztuje kredyt non-stop (~$10-12/mies.
# w trybie idle). Odwrotność: azure-backend-sleep (powrót do scale-to-zero).
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

if [ "$CUR" = "1" ]; then
  echo "Backend już jest always-on (min=1) — nic do zrobienia."
else
  echo "==> Ustawiam $APP na always-on (min-replicas=1)..."
  az containerapp update -n "$APP" -g "$RG" --min-replicas 1 --only-show-errors >/dev/null
  echo "==> Gotowe."
fi

az containerapp show -n "$APP" -g "$RG" --query "properties.template.scale" -o json

cat <<'EOF'

Backend chodzi teraz non-stop — pierwsze żądanie po bezczynności NIE czeka już na rozruch JVM.
Koszt: kontener JVM rozliczany 24/7 w trybie idle (~$10-12/mies.).
Powrót do oszczędzania: 'make azure-backend-sleep' (scale-to-zero).
Pełne uśpienie (oszczędzanie kredytu): 'make azure-backend-sleep' RAZEM z 'make azure-stop' (zatrzymuje bazę).
EOF
