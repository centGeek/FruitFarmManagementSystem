---
name: azure-deploy
description: Wdróż nową wersję aplikacji Fruit Farm na Azure — buduje obrazy Dockera (linux/amd64), wypycha na GitHub Container Registry i aktualizuje Container Apps na świeży tag. Użyj, gdy użytkownik chce wdrożyć / wrzucić / zdeployować nową wersję backendu lub frontendu na Azure (w odróżnieniu od 'azure-up', które tylko budzi już wdrożoną wersję).
---

# azure-deploy — wdrożenie nowej wersji na Azure

Buduje aktualny kod, wypycha obrazy na ghcr i aktualizuje wdrożenie na Azure
(subskrypcja **Azure for Students**, resource group `rg-fruitfarm`, region polandcentral).

> Uwaga: to **nie** jest `azure-up`. `azure-up` tylko budzi to, co już wdrożone.
> Ten skill faktycznie wrzuca nową wersję kodu.

## Co robi

1. Liczy niemutowalny tag z gita (np. `1f236ab`; gdy są niezacommitowane zmiany → `-dirty-HHMMSS`).
2. Buduje obrazy pod **linux/amd64** (Mac jest arm64, Azure wymaga amd64) i wypycha na
   `ghcr.io/centgeek/ff-backend` i `ff-frontend` (tag z gita + `latest`).
3. Frontend buduje się ze **ścieżkami relatywnymi `/api`** (bez wkompilowanego adresu backendu).
   Adres backendu podaje się w runtime: nginx frontendu proxuje `/api` → `BACKEND_ORIGIN`,
   więc front i backend dzielą origin (brak CORS, ciasteczka `SameSite=Lax`).
4. Aktualizuje Container Apps na nowy tag — to wymusza świeżą rewizję (sam push `:latest` by nie wystarczył) —
   i przy okazji wpina env produkcyjne:
   - `ca-backend`: `APP_COOKIE_SECURE=true`, `APP_COOKIE_SAME_SITE=Lax`, `SECURITY_BCRYPT_STRENGTH=12`,
     `JWT_SECRET_KEY=secretref:jwt-secret` (sekret Container Apps, nie z repo).
   - `ca-frontend`: `BACKEND_ORIGIN=https://<ca-backend-fqdn>`.
5. **Sekret `jwt-secret`** tworzy się jednorazowo (świeży 64-hex) przy pierwszym deployu backendu;
   istniejący NIE jest nadpisywany (żeby nie unieważnić wydanych tokenów).

## Uruchomienie

```bash
bash .claude/skills/azure-deploy/run.sh            # backend + frontend
bash .claude/skills/azure-deploy/run.sh backend    # tylko backend
bash .claude/skills/azure-deploy/run.sh frontend   # tylko frontend
```

## Wymagania

- Docker + buildx, zalogowany do ghcr.io jako `centgeek` (skrypt sprawdza i podpowie komendę).
- `az` zalogowany (subskrypcja ustawiana automatycznie).

## Po wdrożeniu

- Nowa rewizja wstaje ~30-60s.
- Jeśli baza jest zatrzymana — uruchom skill `azure-up` (deploy nie startuje bazy).
- Logi: `az containerapp logs show -n ca-backend -g rg-fruitfarm --tail 50`.

## CI/CD (GitHub Actions)

Ten sam deploy działa automatycznie z `.github/workflows/deploy.yml` — na push do `main`
(ścieżki `backend/**`, `frontend/**`, sam workflow) lub ręcznie (`workflow_dispatch`, wybór celu).
Workflow ma parytet z `run.sh`: build amd64 → push ghcr (przez `GITHUB_TOKEN`) → `az login` (OIDC) →
`az containerapp update` z tymi samymi env i sekretem `jwt-secret`. Konfiguracja OIDC: patrz niżej.

## Hardening / pierwsze uruchomienie

Trzy jednorazowe czynności do wykonania **ręcznie** (skill ich nie wykonuje — to zmiany w chmurze i w ustawieniach repo). Po ich zrobieniu zwykły `run.sh` / CI działa już bez dodatkowej konfiguracji.

### 1. Prywatne paczki na ghcr + poświadczenia rejestru w Container Apps

Domyślnie obrazy `ff-backend`/`ff-frontend` są publiczne, więc Container Apps pobierają je bez logowania. Jeśli nie zależy Ci na prywatności obrazów, najprościej zostawić paczki publiczne i **pominąć cały ten krok** (zero poświadczeń do utrzymania). Niżej opisany scenariusz dotyczy ustawienia paczek jako **prywatne** w `ghcr.io` (Packages → dana paczka → *Package settings* → *Change visibility* → Private) — wtedy oba Container Apps muszą dostać poświadczenia, inaczej `image pull` zacznie się sypać.

Potrzebny jest **PAT (classic)** z uprawnieniem `read:packages` — do pulla wystarczy odczyt, nie nadawaj `write`. Uwaga na pułapkę z widocznością paczki: na ghcr widoczność paczki domyślnie **dziedziczy z repozytorium**. Jeśli paczka jest prywatna, bo **dziedziczy z prywatnego repo**, sam `read:packages` **nie wystarczy** — `image pull` padnie na `unauthorized`/`denied`. W takim wypadku albo dodaj do PAT-a również scope `repo`, albo (zalecane) na stronie paczki ustaw jej widoczność **niezależnie od repo** — wtedy `read:packages` w zupełności wystarcza i nie musisz nadawać szerokiego `repo`. Dla tokenów fine-grained wsparcie ghcr bywa zawodne — bezpieczniej trzymać się classic PAT.

Ten sam PAT wpinamy do **obu** aplikacji (`ca-backend` i `ca-frontend`):

```bash
PAT='<PAT-z-read:packages>'

for APP in ca-backend ca-frontend; do
  az containerapp registry set -n "$APP" -g rg-fruitfarm \
    --server ghcr.io \
    --username centgeek \
    --password "$PAT"
done
```

> `--username` to **nazwa konta GitHub** powiązana z PAT-em (tu: `centgeek`), a **nie** nazwa paczki/obrazu (`ff-backend`).

> Poświadczenia są przechowywane jako sekret rewizji — przy odnawianiu/rotacji PAT-a trzeba powtórzyć `registry set` dla obu aplikacji. Jeśli pominiesz jedną z nich, ta jedna utknie na starej rewizji z błędem pobierania obrazu (sprawdź `az containerapp revision list -n <app> -g rg-fruitfarm`). Alternatywa o niższym koszcie utrzymania, jeśli nie chcesz żonglować PAT-em: user-assigned managed identity z rolą `AcrPull` (`az containerapp registry set --identity ...`) zamiast PAT-a.

### 2. OIDC dla workflow CI (`.github/workflows/deploy.yml`)

CI loguje się do Azure przez **OIDC** (federated credential), bez długowiecznego sekretu. Jednorazowo tworzymy rejestrację aplikacji Azure AD, dopinamy do niej federated credential ograniczony do gałęzi `main`, nadajemy rolę `Contributor` na `rg-fruitfarm` i zapisujemy trzy GitHub secrets. Podstaw swoje `OWNER/REPO`:

```bash
OWNER='<owner>'           # np. centgeek
REPO='<repo>'             # nazwa repozytorium
SUB='61ad12b2-ac0f-49cb-af8b-049bff4a6d80'   # Azure for Students
TENANT=$(az account show --query tenantId -o tsv)

# 1. Rejestracja aplikacji Azure AD + service principal.
#    Idempotencja: jeśli ponawiasz blok po błędzie, najpierw poszukaj istniejącej
#    rejestracji — 'az ad app create' NIE jest idempotentne po display-name i przy
#    powtórzeniu zrobi DRUGĄ aplikację o tej samej nazwie (mylący AZURE_CLIENT_ID).
APP_ID=$(az ad app list --display-name "ff-github-deploy" --query "[0].appId" -o tsv)
[ -z "$APP_ID" ] && APP_ID=$(az ad app create --display-name "ff-github-deploy" --query appId -o tsv)

# Service principal; '|| true' bo powtórne uruchomienie zwróci 'already exists'.
# Łapiemy object id SP — użyjemy go w kroku 3 zamiast appId.
SP_OID=$(az ad sp create --id "$APP_ID" --query id -o tsv 2>/dev/null || \
         az ad sp show --id "$APP_ID" --query id -o tsv)

# 2. Federated credential ograniczony do pushy na gałąź main
az ad app federated-credential create --id "$APP_ID" --parameters "{
  \"name\": \"github-main\",
  \"issuer\": \"https://token.actions.githubusercontent.com\",
  \"subject\": \"repo:${OWNER}/${REPO}:ref:refs/heads/main\",
  \"audiences\": [\"api://AzureADTokenExchange\"]
}"

# 3. Rola Contributor na samej grupie zasobów rg-fruitfarm.
#    Używamy --assignee-object-id (object id SP, nie appId) + --assignee-principal-type:
#    to omija zapytanie do Microsoft Graph (rozwiązanie appId->objectId) i jest odporne
#    na lag replikacji świeżo utworzonego SP. Z samym --assignee "$APP_ID" first-timer
#    często łapie błąd 'Principal <id> does not exist in the directory' tuż po utworzeniu SP.
az role assignment create \
  --assignee-object-id "$SP_OID" \
  --assignee-principal-type ServicePrincipal \
  --role Contributor \
  --scope "/subscriptions/${SUB}/resourceGroups/rg-fruitfarm"

# 4. Sekrety do GitHuba (wymaga zalogowanego gh CLI)
gh secret set AZURE_CLIENT_ID       --body "$APP_ID"   --repo "${OWNER}/${REPO}"
gh secret set AZURE_TENANT_ID       --body "$TENANT"   --repo "${OWNER}/${REPO}"
gh secret set AZURE_SUBSCRIPTION_ID --body "$SUB"      --repo "${OWNER}/${REPO}"
```

> Gdyby krok 3 mimo to zwrócił `Principal ... does not exist` — to tylko propagacja SP w katalogu; odczekaj kilkanaście sekund i ponów samą komendę `az role assignment create`.

> `subject` musi się **dokładnie** zgadzać z tym, co wysyła GitHub. Dla pushy na `main` jest to `repo:OWNER/REPO:ref:refs/heads/main`. Workflow uruchamiany z innego kontekstu (PR, tag) ma inny `subject` i wymaga osobnego federated credential. **Uwaga szczególna na GitHub Environments:** jeśli job w `deploy.yml` używa `environment: <nazwa>`, GitHub wysyła `subject` w postaci `repo:OWNER/REPO:environment:<nazwa>` — pojedynczy credential z `ref:refs/heads/main` wtedy **nie pasuje** i login do Azure padnie z `AADSTS70021: No matching federated identity record found`. W takim wypadku utwórz federated credential z `subject` `repo:OWNER/REPO:environment:<NAZWA>` (zamiast lub dodatkowo). W `deploy.yml` daj `permissions: id-token: write` oraz `azure/login@v2` z `client-id`/`tenant-id`/`subscription-id` z tych sekretów (bez `AZURE_CREDENTIALS`).

### 3. (Opcjonalnie) Sonda gotowości/żywotności na `ca-backend`

`az containerapp update --set-env-vars` **nie** ustawia sond — żeby je dodać, trzeba podać pełen YAML rewizji. Jest to opcjonalne: bez własnych sond, gdy ingress jest włączony, Container Apps automatycznie dodaje domyślne sondy TCP (Startup/Liveness/Readiness) na porcie docelowym ingressu, a w razie zimnego startu i tak działa rozgrzewka `curl` ze skilla `azure-up` (zostaje jako fallback).

Uwaga na semantykę sond HTTP w Container Apps: sonda HTTP uznaje za sukces tylko **kod 200–399**. `GET /api/auth/verify` bez ciasteczka zwraca **401**, co dla sondy HTTP jest **porażką** — więc do automatycznej sondy się nie nadaje (401 świetnie sprawdza się natomiast jako *ręczny* test „backend żyje", i właśnie tak używa go warmup w `azure-up`). Dla automatycznej sondy używamy więc **TCP** na porcie ingressu (8091) — potwierdza, że aplikacja nasłuchuje.

Backend to Spring Boot na JVM ze scale-to-zero, więc zimny start (rozruch JVM) potrafi trwać wyraźnie dłużej niż kilka sekund. Dlatego dokładamy osobną sondę **Startup** (TCP 8091, wysoki `failureThreshold`), która chroni wolny rozruch — dopiero po jej powodzeniu uruchamiają się Liveness/Readiness. Dzięki temu liveness nie zabije repliki w pętli, zanim aplikacja zdąży wstać:

```yaml
# probes.yaml — fragment template.containers[].probes dla ca-backend
properties:
  template:
    containers:
      - name: ca-backend
        probes:
          # Chroni wolny rozruch JVM (scale-to-zero): ~5 min tolerancji startu
          # (periodSeconds 10 * failureThreshold 30). Dopiero po sukcesie
          # startują liveness/readiness.
          - type: Startup
            tcpSocket:
              port: 8091
            periodSeconds: 10
            failureThreshold: 30
          - type: Liveness
            tcpSocket:
              port: 8091
            periodSeconds: 10
            failureThreshold: 3
          - type: Readiness
            tcpSocket:
              port: 8091
            periodSeconds: 5
            failureThreshold: 6
```

```bash
az containerapp update -n ca-backend -g rg-fruitfarm --yaml probes.yaml
```

> **Ostrożnie:** `az containerapp update --yaml` **zastępuje CAŁĄ konfigurację** aplikacji wartościami z pliku — pola **nieobecne** w YAML zostają wyzerowane do wartości domyślnych (CLI traktuje to jako pełne podstawienie, nie merge pojedynczych pól). Minimalny plik tylko z `probes` cicho skasowałby tag obrazu i produkcyjne env wpinane przez `run.sh` (`JWT_SECRET_KEY=secretref:jwt-secret`, `APP_COOKIE_SECURE`, `APP_COOKIE_SAME_SITE`, `SECURITY_BCRYPT_STRENGTH`, a na froncie `BACKEND_ORIGIN`). Dlatego **ZAWSZE** najpierw zrzuć pełny stan (`az containerapp show -n ca-backend -g rg-fruitfarm -o yaml > ca-backend.yaml`), dopisz blok `probes` w `properties.template.containers[]`, i dopiero ten **kompletny** plik podaj do `--yaml`.
