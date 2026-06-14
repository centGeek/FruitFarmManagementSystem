#!/usr/bin/env bash
# Resumes the application on Azure: starts the PostgreSQL database, waits until it is ready,
# warms up the backend (cold start scale-to-zero) and prints the addresses.
set -euo pipefail

SUB="61ad12b2-ac0f-49cb-af8b-049bff4a6d80"   # Azure for Students (Lodz University of Technology)
RG="rg-fruitfarm"

echo "==> Subscription: Azure for Students"
az account set --subscription "$SUB"

PG=$(az postgres flexible-server list -g "$RG" --query "[0].name" -o tsv 2>/dev/null)
if [ -z "${PG:-}" ]; then
  echo "ERROR: no PostgreSQL server found in group $RG." >&2
  exit 1
fi

STATE=$(az postgres flexible-server show -n "$PG" -g "$RG" --query state -o tsv 2>/dev/null)
echo "==> Database server: $PG (state: $STATE)"

if [ "$STATE" = "Ready" ]; then
  echo "Database is already running."
else
  echo "==> Starting the database (will take 1-3 min)..."
  az postgres flexible-server start -n "$PG" -g "$RG" --only-show-errors
  echo "==> Database started."
fi

# Application addresses
BE=$(az containerapp show -n ca-backend -g "$RG" --query "properties.configuration.ingress.fqdn" -o tsv 2>/dev/null)
FE=$(az containerapp show -n ca-frontend -g "$RG" --query "properties.configuration.ingress.fqdn" -o tsv 2>/dev/null)

echo "==> Warming up the backend (cold start scale-to-zero, ~30-60s)..."
for i in $(seq 1 40); do
  code=$(curl -s -o /dev/null -w '%{http_code}' "https://$BE/api/auth/verify" 2>/dev/null || echo 000)
  if [ "$code" = "401" ] || [ "$code" = "200" ]; then echo "    backend ready (HTTP $code)"; break; fi
  echo "    waiting... (attempt $i, HTTP $code)"
  sleep 5
done

echo
echo "Application resumed:"
echo "  Frontend: https://$FE"
echo "  Backend : https://$BE"
echo "  Login   : admin / test5432"
echo
echo "Remember to stop it after the demo (the 'azure-stop' skill) to save credit."
