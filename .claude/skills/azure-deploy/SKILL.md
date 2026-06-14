---
name: azure-deploy
description: Deploy a new version of the Fruit Farm app to Azure — builds Docker images (linux/amd64), pushes them to GitHub Container Registry and updates Container Apps to a fresh tag. Use when the user wants to deploy / ship / release a new version of the backend or frontend to Azure (as opposed to 'azure-up', which only wakes an already-deployed version).
---

# azure-deploy — deploying a new version to Azure

Builds the current code, pushes images to ghcr and updates the deployment on Azure
(subscription **Azure for Students**, resource group `rg-fruitfarm`, region polandcentral).

> Note: this is **not** `azure-up`. `azure-up` only wakes what is already deployed.
> This skill actually ships a new version of the code.

## What it does

1. Computes an immutable tag from git (e.g. `1f236ab`; when there are uncommitted changes → `-dirty-HHMMSS`).
2. Builds images for **linux/amd64** (Mac is arm64, Azure requires amd64) and pushes them to
   `ghcr.io/centgeek/ff-backend` and `ff-frontend` (git tag + `latest`).
3. The frontend is built with **relative paths `/api`** (no backend address compiled in).
   The backend address is provided at runtime: the frontend's nginx proxies `/api` → `BACKEND_ORIGIN`,
   so the frontend and backend share an origin (no CORS, `SameSite=Lax` cookies).
4. Updates Container Apps to the new tag — this forces a fresh revision (pushing `:latest` alone would not be enough) —
   and at the same time wires in the production env:
   - `ca-backend`: `APP_COOKIE_SECURE=true`, `APP_COOKIE_SAME_SITE=Lax`, `SECURITY_BCRYPT_STRENGTH=12`,
     `JWT_SECRET_KEY=secretref:jwt-secret` (a Container Apps secret, not from the repo).
   - `ca-frontend`: `BACKEND_ORIGIN=https://<ca-backend-fqdn>`.
5. **The `jwt-secret` secret** is created once (a fresh 64-hex) on the first backend deploy;
   an existing one is NOT overwritten (so as not to invalidate already-issued tokens).

## Running

```bash
bash .claude/skills/azure-deploy/run.sh            # backend + frontend
bash .claude/skills/azure-deploy/run.sh backend    # backend only
bash .claude/skills/azure-deploy/run.sh frontend   # frontend only
```

## Requirements

- Docker + buildx, logged in to ghcr.io as `centgeek` (the script checks and suggests the command).
- `az` logged in (the subscription is set automatically).

## After deploying

- The new revision comes up in ~30-60s.
- If the database is stopped — run the `azure-up` skill (deploy does not start the database).
- Logs: `az containerapp logs show -n ca-backend -g rg-fruitfarm --tail 50`.

## CI/CD (GitHub Actions)

The same deploy runs automatically from `.github/workflows/deploy.yml` — on push to `main`
(paths `backend/**`, `frontend/**`, the workflow itself) or manually (`workflow_dispatch`, target selection).
The workflow is at parity with `run.sh`: build amd64 → push ghcr (via `GITHUB_TOKEN`) → `az login` (OIDC) →
`az containerapp update` with the same env and the `jwt-secret` secret. For OIDC configuration, see below.

## Hardening / first run

Three one-time tasks to perform **manually** (the skill does not do them — they are changes in the cloud and in the repo settings). Once done, a regular `run.sh` / CI works without any extra configuration.

### 1. Private packages on ghcr + registry credentials in Container Apps

By default the `ff-backend`/`ff-frontend` images are public, so Container Apps pulls them without logging in. If you do not care about image privacy, the simplest thing is to leave the packages public and **skip this whole step** (zero credentials to maintain). The scenario described below applies to setting the packages as **private** in `ghcr.io` (Packages → the package → *Package settings* → *Change visibility* → Private) — then both Container Apps must be given credentials, otherwise `image pull` will start failing.

You need a **PAT (classic)** with the `read:packages` permission — read is enough for pulling, do not grant `write`. Watch out for the package-visibility trap: on ghcr a package's visibility by default **inherits from the repository**. If the package is private because it **inherits from a private repo**, `read:packages` alone is **not enough** — `image pull` will fail with `unauthorized`/`denied`. In that case either add the `repo` scope to the PAT as well, or (recommended) on the package page set its visibility **independently of the repo** — then `read:packages` is perfectly sufficient and you do not have to grant the broad `repo`. For fine-grained tokens ghcr support is sometimes unreliable — it is safer to stick with a classic PAT.

We wire the same PAT into **both** apps (`ca-backend` and `ca-frontend`):

```bash
PAT='<PAT-with-read:packages>'

for APP in ca-backend ca-frontend; do
  az containerapp registry set -n "$APP" -g rg-fruitfarm \
    --server ghcr.io \
    --username centgeek \
    --password "$PAT"
done
```

> `--username` is the **GitHub account name** associated with the PAT (here: `centgeek`), and **not** the package/image name (`ff-backend`).

> The credentials are stored as a revision secret — when renewing/rotating the PAT you must repeat `registry set` for both apps. If you skip one of them, that one will get stuck on the old revision with an image-pull error (check `az containerapp revision list -n <app> -g rg-fruitfarm`). A lower-maintenance alternative, if you do not want to juggle a PAT: a user-assigned managed identity with the `AcrPull` role (`az containerapp registry set --identity ...`) instead of a PAT.

### 2. OIDC for the CI workflow (`.github/workflows/deploy.yml`)

CI logs in to Azure via **OIDC** (a federated credential), without a long-lived secret. Once, we create an Azure AD app registration, attach a federated credential scoped to the `main` branch, grant the `Contributor` role on `rg-fruitfarm`, and save three GitHub secrets. Substitute your `OWNER/REPO`:

```bash
OWNER='<owner>'           # e.g. centgeek
REPO='<repo>'             # repository name
SUB='61ad12b2-ac0f-49cb-af8b-049bff4a6d80'   # Azure for Students
TENANT=$(az account show --query tenantId -o tsv)

# 1. Azure AD app registration + service principal.
#    Idempotency: if you re-run the block after an error, first look for an existing
#    registration — 'az ad app create' is NOT idempotent by display-name and on a
#    repeat will create a SECOND app with the same name (a misleading AZURE_CLIENT_ID).
APP_ID=$(az ad app list --display-name "ff-github-deploy" --query "[0].appId" -o tsv)
[ -z "$APP_ID" ] && APP_ID=$(az ad app create --display-name "ff-github-deploy" --query appId -o tsv)

# Service principal; '|| true' because a re-run returns 'already exists'.
# We capture the SP object id — we use it in step 3 instead of appId.
SP_OID=$(az ad sp create --id "$APP_ID" --query id -o tsv 2>/dev/null || \
         az ad sp show --id "$APP_ID" --query id -o tsv)

# 2. Federated credential scoped to pushes on the main branch
az ad app federated-credential create --id "$APP_ID" --parameters "{
  \"name\": \"github-main\",
  \"issuer\": \"https://token.actions.githubusercontent.com\",
  \"subject\": \"repo:${OWNER}/${REPO}:ref:refs/heads/main\",
  \"audiences\": [\"api://AzureADTokenExchange\"]
}"

# 3. Contributor role on the rg-fruitfarm resource group only.
#    We use --assignee-object-id (the SP object id, not appId) + --assignee-principal-type:
#    this bypasses the Microsoft Graph lookup (appId->objectId resolution) and is resilient
#    to the replication lag of a freshly created SP. With just --assignee "$APP_ID" a first-timer
#    often hits 'Principal <id> does not exist in the directory' right after creating the SP.
az role assignment create \
  --assignee-object-id "$SP_OID" \
  --assignee-principal-type ServicePrincipal \
  --role Contributor \
  --scope "/subscriptions/${SUB}/resourceGroups/rg-fruitfarm"

# 4. Secrets to GitHub (requires a logged-in gh CLI)
gh secret set AZURE_CLIENT_ID       --body "$APP_ID"   --repo "${OWNER}/${REPO}"
gh secret set AZURE_TENANT_ID       --body "$TENANT"   --repo "${OWNER}/${REPO}"
gh secret set AZURE_SUBSCRIPTION_ID --body "$SUB"      --repo "${OWNER}/${REPO}"
```

> If step 3 still returns `Principal ... does not exist` — that is just SP propagation in the directory; wait a dozen or so seconds and re-run the `az role assignment create` command alone.

> The `subject` must match **exactly** what GitHub sends. For pushes to `main` it is `repo:OWNER/REPO:ref:refs/heads/main`. A workflow triggered from a different context (PR, tag) has a different `subject` and requires a separate federated credential. **Pay special attention to GitHub Environments:** if the job in `deploy.yml` uses `environment: <name>`, GitHub sends the `subject` in the form `repo:OWNER/REPO:environment:<name>` — a single credential with `ref:refs/heads/main` then **does not match** and the Azure login fails with `AADSTS70021: No matching federated identity record found`. In that case create a federated credential with the `subject` `repo:OWNER/REPO:environment:<NAME>` (instead of or in addition to). In `deploy.yml` set `permissions: id-token: write` and `azure/login@v2` with `client-id`/`tenant-id`/`subscription-id` from those secrets (without `AZURE_CREDENTIALS`).

### 3. (Optional) Readiness/liveness probe on `ca-backend`

`az containerapp update --set-env-vars` does **not** set probes — to add them you have to provide the full revision YAML. This is optional: without your own probes, when ingress is enabled, Container Apps automatically adds default TCP probes (Startup/Liveness/Readiness) on the ingress target port, and in case of a cold start the `curl` warmup from the `azure-up` skill works anyway (it remains as a fallback).

Watch out for the semantics of HTTP probes in Container Apps: an HTTP probe counts as a success only for **codes 200–399**. `GET /api/auth/verify` without a cookie returns **401**, which for an HTTP probe is a **failure** — so it is not suitable for an automatic probe (401 works great, on the other hand, as a *manual* "the backend is alive" test, and that is exactly how the warmup in `azure-up` uses it). For the automatic probe we therefore use **TCP** on the ingress port (8091) — it confirms that the app is listening.

The backend is Spring Boot on the JVM with scale-to-zero, so a cold start (JVM startup) can take noticeably longer than a few seconds. That is why we add a separate **Startup** probe (TCP 8091, high `failureThreshold`), which protects the slow startup — Liveness/Readiness only start once it succeeds. Thanks to this, liveness will not kill the replica in a loop before the app has a chance to come up:

```yaml
# probes.yaml — fragment of template.containers[].probes for ca-backend
properties:
  template:
    containers:
      - name: ca-backend
        probes:
          # Protects the slow JVM startup (scale-to-zero): ~5 min of startup tolerance
          # (periodSeconds 10 * failureThreshold 30). Only after it succeeds do
          # liveness/readiness start.
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

> **Careful:** `az containerapp update --yaml` **replaces the ENTIRE configuration** of the app with the values from the file — fields **absent** from the YAML are reset to their default values (the CLI treats this as a full replacement, not a merge of individual fields). A minimal file with only `probes` would silently wipe the image tag and the production env wired in by `run.sh` (`JWT_SECRET_KEY=secretref:jwt-secret`, `APP_COOKIE_SECURE`, `APP_COOKIE_SAME_SITE`, `SECURITY_BCRYPT_STRENGTH`, and on the frontend `BACKEND_ORIGIN`). That is why you should **ALWAYS** first dump the full state (`az containerapp show -n ca-backend -g rg-fruitfarm -o yaml > ca-backend.yaml`), add the `probes` block under `properties.template.containers[]`, and only then pass that **complete** file to `--yaml`.
