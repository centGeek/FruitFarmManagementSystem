#!/usr/bin/env bash
# Stops the application on Azure to save credit.
# The main cost is the PostgreSQL database (runs 24/7) — we stop it.
# Container Apps (backend/frontend) have scale-to-zero, so they stop costing on their own when there is no traffic.
set -euo pipefail

SUB="61ad12b2-ac0f-49cb-af8b-049bff4a6d80"   # Azure for Students (Lodz University of Technology)
RG="rg-fruitfarm"

echo "==> Subscription: Azure for Students"
az account set --subscription "$SUB"

PG=$(az postgres flexible-server list -g "$RG" --query "[0].name" -o tsv 2>/dev/null)
if [ -z "${PG:-}" ]; then
  echo "ERROR: PostgreSQL server not found in group $RG." >&2
  exit 1
fi

STATE=$(az postgres flexible-server show -n "$PG" -g "$RG" --query state -o tsv 2>/dev/null)
echo "==> Database server: $PG (state: $STATE)"

if [ "$STATE" = "Stopped" ]; then
  echo "Database already stopped — nothing to do."
else
  echo "==> Stopping the database..."
  az postgres flexible-server stop -n "$PG" -g "$RG" --only-show-errors
  echo "==> Stopped. Cost drops to ~storage (~1-2 USD/month)."
fi

echo
echo "Application paused. To resume: skill 'azure-up'."
echo "Note: Azure auto-starts a stopped database after max 7 days — stop it again then."
