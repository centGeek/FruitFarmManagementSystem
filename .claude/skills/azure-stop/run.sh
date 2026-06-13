#!/usr/bin/env bash
# Zatrzymuje aplikację na Azure dla oszczędności kredytu.
# Główny koszt to baza PostgreSQL (działa 24/7) — ją zatrzymujemy.
# Container Apps (backend/frontend) mają scale-to-zero, więc same przestają kosztować przy braku ruchu.
set -euo pipefail

SUB="61ad12b2-ac0f-49cb-af8b-049bff4a6d80"   # Azure for Students (Politechnika Łódzka)
RG="rg-fruitfarm"

echo "==> Subskrypcja: Azure for Students"
az account set --subscription "$SUB"

PG=$(az postgres flexible-server list -g "$RG" --query "[0].name" -o tsv 2>/dev/null)
if [ -z "${PG:-}" ]; then
  echo "BŁĄD: nie znaleziono serwera PostgreSQL w grupie $RG." >&2
  exit 1
fi

STATE=$(az postgres flexible-server show -n "$PG" -g "$RG" --query state -o tsv 2>/dev/null)
echo "==> Serwer bazy: $PG (stan: $STATE)"

if [ "$STATE" = "Stopped" ]; then
  echo "Baza już zatrzymana — nic do zrobienia."
else
  echo "==> Zatrzymuję bazę..."
  az postgres flexible-server stop -n "$PG" -g "$RG" --only-show-errors
  echo "==> Zatrzymano. Koszt spada do ~storage (~1-2 USD/mies.)."
fi

echo
echo "Aplikacja wstrzymana. Wznowienie: skill 'azure-up'."
echo "Uwaga: Azure auto-startuje zatrzymaną bazę po max 7 dniach — wtedy zatrzymaj ponownie."
