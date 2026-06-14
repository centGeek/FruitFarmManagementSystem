---
name: azure-stop
description: Stop the Fruit Farm app on Azure to save credit — stops the PostgreSQL server (the main cost). Container Apps scale to zero anyway. Use when the user wants to pause / shut down / stop the app on Azure, or is not demoing it and wants to save credit.
---

# azure-stop — pausing the app on Azure

Stops the Azure deployment (subscription **Azure for Students**, resource group `rg-fruitfarm`, region polandcentral) so it doesn't burn credit between demos.

## What it does

The only resource that costs money 24/7 is the **PostgreSQL Flexible Server** — the script stops it. The backend and frontend (Azure Container Apps) have `min-replicas 0`, so with no traffic they scale to zero on their own and cost nothing.

## Running

```bash
bash .claude/skills/azure-stop/run.sh
```

The script: sets the correct subscription, detects the database server name in `rg-fruitfarm`, stops it (if already stopped — does nothing).

## Notes

- After stopping, the cost drops to practically zero (storage alone ~1-2 USD/month).
- **Azure auto-starts a stopped database after at most 7 days.** If you don't use it for longer — run the skill again after the auto-restart.
- Resuming: the **`azure-up`** skill.
- Fully deleting everything (irreversible): `az group delete -n rg-fruitfarm`.
