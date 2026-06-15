# deployments/ — deterministyczne skrypty operacyjne

Skrypty `bash` robiące dokładnie jedną rzecz (bez udziału AI). Wcześniej żyły jako skille
`.claude/skills/azure-*` — przeniesione tutaj, bo są deterministyczne i powinny być infra-as-code
niezależną od narzędzia. Odpalaj przez `make <cel>` (zalecane) albo wprost `bash deployments/<plik>.sh`.

Kontekst: subskrypcja **Azure for Students**, resource group `rg-fruitfarm`, region `polandcentral`.

| Skrypt | `make` | Co robi |
|---|---|---|
| `dev-up.sh` | `make dev-up` | Lokalny stack: PostgreSQL (Docker) + backend (8091) + frontend (5173) w tle. |
| `azure-up.sh` | `make azure-up` | Startuje bazę PostgreSQL, czeka na `Ready`, rozgrzewa backend, wypisuje adresy + login `admin`/`test5432`. |
| `azure-stop.sh` | `make azure-stop` | Zatrzymuje bazę PostgreSQL (główny koszt 24/7). |
| `azure-backend-on.sh` | `make azure-backend-on` | `ca-backend` → `min-replicas=1` (always-on, brak zimnego startu, ~$10-12/mies. idle). |
| `azure-backend-sleep.sh` | `make azure-backend-sleep` | `ca-backend` → `min-replicas=0` (scale-to-zero, tanio, zimny start ~30-60 s). |
| `azure-deploy.sh` | `make azure-deploy` | Build amd64 → push ghcr → `containerapp update` na świeży tag (backend+frontend). `backend`/`frontend` = tylko jeden cel. |

## Koszt i zimny start (ważne)

- **Stan obecny:** `ca-frontend` i `ca-backend` są **always-on** (`min-replicas=1`) — brak zimnego startu
  (ekranu „Sprawdzanie autentyfikacji…"), ale backend zżera kredyt 24/7 (~$10-12/mies.).
- **Pełne oszczędzanie kredytu między demami:** `make azure-backend-sleep` **oraz** `make azure-stop`
  (sam `azure-stop` nie wystarczy, gdy backend jest always-on — kontener dalej kosztuje). Przed kolejnym
  pokazem: `make azure-up`.
- Front (nginx) zostaje always-on niezależnie — kosztuje grosze i daje natychmiastowe załadowanie SPA.

## azure-deploy — szczegóły

1. Niemutowalny tag z gita (`<sha>`; przy niezacommitowanych zmianach `<sha>-dirty-HHMMSS`).
2. Build `linux/amd64` i push na `ghcr.io/centgeek/ff-backend` + `ff-frontend` (tag + `latest`).
   Oba obrazy budują się **natywnie** (`--platform=$BUILDPLATFORM` w Dockerfile'ach) — bez emulacji QEMU.
3. Front używa **relatywnych ścieżek `/api`** — adres backendu nie jest wkompilowany; nginx proxuje `/api`
   do `BACKEND_ORIGIN` (env runtime), więc front i backend dzielą origin (brak CORS, ciasteczka `SameSite=Lax`).
4. `containerapp update` na nowy tag (wymusza świeżą rewizję) + env produkcyjne:
   `ca-backend`: `APP_COOKIE_SECURE=true`, `APP_COOKIE_SAME_SITE=Lax`, `SECURITY_BCRYPT_STRENGTH=12`,
   `JWT_SECRET_KEY=secretref:jwt-secret`. `ca-frontend`: `BACKEND_ORIGIN=https://<ca-backend-fqdn>`.
5. Sekret `jwt-secret` tworzy się jednorazowo przy pierwszym deployu backendu; istniejący NIE jest nadpisywany.

### Wymagania
- Docker + buildx, zalogowany do `ghcr.io` jako `centgeek` (skrypt sprawdza i podpowie komendę logowania).
- `az` zalogowany (subskrypcja ustawiana automatycznie przez skrypt).

### Po wdrożeniu
- Nowa rewizja wstaje ~30-60 s. Jeśli baza zatrzymana → `make azure-up` (deploy nie startuje bazy).
- Logi: `az containerapp logs show -n ca-backend -g rg-fruitfarm --tail 50`.

## Hardening (czynności jednorazowe, ręczne)

### 1. Prywatne paczki ghcr + poświadczenia rejestru w Container Apps
Domyślnie obrazy są publiczne (Container Apps pobierają bez logowania). Jeśli ustawisz paczki jako
**prywatne**, wepnij PAT (classic, `read:packages`) do **obu** aplikacji:
```bash
PAT='<PAT-z-read:packages>'
for APP in ca-backend ca-frontend; do
  az containerapp registry set -n "$APP" -g rg-fruitfarm --server ghcr.io --username centgeek --password "$PAT"
done
```
> `--username` to konto GitHub (`centgeek`), nie nazwa paczki. Jeśli paczka dziedziczy prywatność z repo,
> sam `read:packages` może nie wystarczyć — ustaw widoczność paczki niezależnie albo dodaj scope `repo`.
> Alternatywa o niższym koszcie utrzymania: user-assigned managed identity z rolą `AcrPull`.

### 2. OIDC dla ewentualnego workflow CI
W repo **nie ma** `deploy.yml` — deploy jest wyłącznie ręczny (ten skrypt / `make`). `.github/workflows/`
zawiera tylko `ci.yml` (build + testy). Gdyby kiedyś dodać auto-deploy z CI: użyj logowania OIDC
(federated credential ograniczony do `repo:OWNER/REPO:ref:refs/heads/main`, rola `Contributor` na
`rg-fruitfarm`, sekrety `AZURE_CLIENT_ID`/`AZURE_TENANT_ID`/`AZURE_SUBSCRIPTION_ID`) — bez długowiecznych sekretów.

### 3. (Opcjonalnie) Sonda gotowości na ca-backend
`containerapp update --set-env-vars` nie ustawia sond. Bez własnych sond Container Apps i tak dodaje
domyślne sondy TCP na porcie ingressu. Dla wolnego rozruchu JVM warto dołożyć sondę **Startup** (TCP 8091,
wysoki `failureThreshold`). Uwaga: sonda **HTTP** uznaje sukces tylko dla 200-399, a `/api/auth/verify`
bez ciasteczka zwraca 401 — dlatego do automatycznej sondy używaj **TCP**, nie HTTP.
> `containerapp update --yaml` **zastępuje całą** konfigurację — najpierw zrzuć pełny stan
> (`az containerapp show ... -o yaml > ca-backend.yaml`), dopisz blok `probes`, dopiero wtedy `--yaml`.
