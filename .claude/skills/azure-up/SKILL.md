---
name: azure-up
description: Resume the Fruit Farm app on Azure — starts the PostgreSQL server, waits until it is ready, warms up the backend (cold start) and prints the URLs and login credentials. Use when the user wants to resume / start / bring up the app on Azure before a demo.
---

# azure-up — resuming the app on Azure

Resumes the Azure deployment (**Azure for Students** subscription, resource group `rg-fruitfarm`, polandcentral region) after it was previously stopped with the `azure-stop` skill.

## What it does

1. Starts the **PostgreSQL Flexible Server** (if stopped) and waits until it is `Ready`.
2. Warms up the backend (Container App with `scale-to-zero` — the first request wakes the container, ~30-60s).
3. Prints the frontend/backend URLs and login credentials.

## Running

```bash
bash .claude/skills/azure-up/run.sh
```

## After resuming

- Frontend and backend available at `*.polandcentral.azurecontainerapps.io` (the script prints them).
- Login: `admin` / `test5432`.
- **When the demo is done, stop it** with the `azure-stop` skill so you don't burn through credit.

## Notes

- Starting the database takes 1-3 min — this is normal for Flexible Server.
- If the backend takes a long time to respond: check the logs with `az containerapp logs show -n ca-backend -g rg-fruitfarm --tail 50`.
