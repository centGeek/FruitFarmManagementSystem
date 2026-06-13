#!/usr/bin/env bash
# Wznawia aplikację na Azure: startuje bazę PostgreSQL, czeka aż będzie gotowa,
# rozgrzewa backend (cold start scale-to-zero) i wypisuje adresy.
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

if [ "$STATE" = "Ready" ]; then
  echo "Baza już działa."
else
  echo "==> Startuję bazę (potrwa 1-3 min)..."
  az postgres flexible-server start -n "$PG" -g "$RG" --only-show-errors
  echo "==> Baza wystartowana."
fi

# Adresy aplikacji
BE=$(az containerapp show -n ca-backend -g "$RG" --query "properties.configuration.ingress.fqdn" -o tsv 2>/dev/null)
FE=$(az containerapp show -n ca-frontend -g "$RG" --query "properties.configuration.ingress.fqdn" -o tsv 2>/dev/null)

echo "==> Rozgrzewam backend (cold start scale-to-zero, ~30-60s)..."
for i in $(seq 1 40); do
  code=$(curl -s -o /dev/null -w '%{http_code}' "https://$BE/api/auth/verify" 2>/dev/null || echo 000)
  if [ "$code" = "401" ] || [ "$code" = "200" ]; then echo "    backend gotowy (HTTP $code)"; break; fi
  echo "    czekam... (próba $i, HTTP $code)"
  sleep 5
done

echo
echo "Aplikacja wznowiona:"
echo "  Frontend: https://$FE"
echo "  Backend : https://$BE"
echo "  Login   : admin / test5432"
echo
echo "Pamiętaj zatrzymać po demie (skill 'azure-stop'), żeby oszczędzać kredyt."
