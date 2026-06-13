---
name: azure-stop
description: Zatrzymaj aplikację Fruit Farm na Azure dla oszczędności kredytu — zatrzymuje serwer PostgreSQL (główny koszt). Container Apps i tak skalują do zera. Użyj, gdy użytkownik chce wstrzymać / wyłączyć / zatrzymać aplikację na Azure, albo nie demonstruje jej i chce oszczędzać kredyt.
---

# azure-stop — wstrzymanie aplikacji na Azure

Zatrzymuje wdrożenie na Azure (subskrypcja **Azure for Students**, resource group `rg-fruitfarm`, region polandcentral), żeby nie zżerać kredytu między demami.

## Co robi

Jedyny zasób kosztujący 24/7 to **PostgreSQL Flexible Server** — skrypt go zatrzymuje. Backend i frontend (Azure Container Apps) mają `min-replicas 0`, więc przy braku ruchu same skalują do zera i nie kosztują.

## Uruchomienie

```bash
bash .claude/skills/azure-stop/run.sh
```

Skrypt: ustawia właściwą subskrypcję, wykrywa nazwę serwera bazy w `rg-fruitfarm`, zatrzymuje go (jeśli już zatrzymany — nic nie robi).

## Uwagi

- Po zatrzymaniu koszt spada praktycznie do zera (sam storage ~1-2 USD/mies.).
- **Azure auto-startuje zatrzymaną bazę po max 7 dniach.** Jeśli nie używasz dłużej — uruchom skill ponownie po auto-restarcie.
- Wznowienie: skill **`azure-up`**.
- Pełne skasowanie wszystkiego (nieodwracalne): `az group delete -n rg-fruitfarm`.
