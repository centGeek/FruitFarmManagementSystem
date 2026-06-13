---
name: azure-up
description: Wznów aplikację Fruit Farm na Azure — startuje serwer PostgreSQL, czeka aż będzie gotowy, rozgrzewa backend (cold start) i wypisuje adresy oraz dane logowania. Użyj, gdy użytkownik chce wznowić / uruchomić / włączyć aplikację na Azure przed demonstracją.
---

# azure-up — wznowienie aplikacji na Azure

Wznawia wdrożenie na Azure (subskrypcja **Azure for Students**, resource group `rg-fruitfarm`, region polandcentral) po wcześniejszym zatrzymaniu skillem `azure-stop`.

## Co robi

1. Startuje **PostgreSQL Flexible Server** (jeśli zatrzymany) i czeka aż będzie `Ready`.
2. Rozgrzewa backend (Container App ze `scale-to-zero` — pierwszy request budzi kontener, ~30-60s).
3. Wypisuje adresy frontendu/backendu i dane logowania.

## Uruchomienie

```bash
bash .claude/skills/azure-up/run.sh
```

## Po wznowieniu

- Frontend i backend dostępne pod adresami `*.polandcentral.azurecontainerapps.io` (skrypt je wypisze).
- Login: `admin` / `test5432`.
- **Po skończonym demie zatrzymaj** skillem `azure-stop`, żeby nie zużywać kredytu.

## Uwagi

- Start bazy trwa 1-3 min — to normalne dla Flexible Server.
- Jeśli backend długo nie odpowiada: sprawdź logi `az containerapp logs show -n ca-backend -g rg-fruitfarm --tail 50`.
