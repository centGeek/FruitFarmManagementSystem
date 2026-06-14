# Fruit Farm Management System

A management system for a fruit orchard, built as an engineering thesis. It lets
the orchard owner (the **gardener**) run the entire operational and financial side
of the farm from one place: from mapping plots, through scheduling work and settling
worker pay, to profit analysis and weather alerts.

---

## Use case — what is it for?

Picture an orchard owner who hires seasonal workers for harvesting and tree care.
Day to day, they need to:

- know **where** each variety grows (which sectors, which species),
- **schedule and settle work** — who, when, how many hours or kilograms picked,
- compute **wages** (hourly rate or piece-rate per kg) and pay out **advances**,
- track **expenses** (fertilizer, equipment, fuel) and **revenue** from fruit sales,
- **analyze profitability** of individual sectors and varieties,
- react to the **weather** — e.g. a frost warning that threatens the blossom.

The system ties all of these processes into a single web application. The gardener
logs in, draws their sectors on a map, adds workers, sets their pay rates, plans
work in a weekly calendar, and the system automatically computes daily wages.
Expenses and revenue are tied to sectors, which makes it possible to see which part
of the orchard actually earns money. On top of that, the app monitors the weather
forecast for the orchard's location and sends notifications about risks (frost,
heavy rain, strong wind).

### Main roles
- **Gardener (`Gardener`)** — the orchard owner; has access to all features,
  manages workers, sectors, and finances.
- **Employee (`Employee`)** — reports to a gardener (self-referential relation in the `User` model);
  their work and pay are managed by the gardener.

---

## What the app can do (features)

| Module | Description |
|---|---|
| **Orchard map** | Interactive Leaflet map — draw sectors as polygons (min. 4 corners), assign species and variety. Multiple layers (OSM, satellite, topo). |
| **Workers** | Add, edit, archive workers; contact details and pay configuration. |
| **Work schedule** | Weekly calendar with work entries (hours or kg picked). Automatic daily-wage computation, mark as approved/paid, bulk settlements. |
| **Wages & advances** | Hourly or piece-rate (per kg) pay. Granting and settling advances. |
| **Expenses** | Operational cost log with filtering by year/month/sector and payment status. |
| **Revenue** | Fruit-sale log (kg, amount), filtering, payment-received status. |
| **Analytics** | Charts (recharts) — profit by sector and variety, margins, year-over-year comparisons, labor cost per sector. |
| **Weather** | Current weather + configurable alerts (frost, low/high temp, rain, wind) for 1–7 days ahead. Data from Open-Meteo. |
| **Notifications** | Log of system events (user, sector, profit, expense). |
| **Support / tickets** | Reporting issues and suggestions (bug / feature / suggestion / other) with statuses OPEN → IN_PROGRESS → CLOSED. |
| **Gardener profile** | Personal data, orchard location (for weather) with map search, password change. |

---

## Architecture — what the app is built from

Two independent layers run in parallel:

```
┌──────────────────────────┐        ┌──────────────────────────┐        ┌──────────────┐
│  Frontend (React + Vite) │  HTTP  │  Backend (Spring Boot)   │  JDBC  │  PostgreSQL  │
│  SPA, port 5173          │ ─────► │  REST API, port 8091     │ ─────► │  (Docker)    │
│  httpOnly cookies (JWT)  │ ◄───── │  JWT, Flyway, JPA        │ ◄───── │              │
└──────────────────────────┘        └──────────────────────────┘        └──────────────┘
            │
            └──► Open-Meteo API (weather, called directly from the browser)
```

### Backend — `backend/`
- **Java 21**, **Spring Boot 3.5.3**, **Maven**.
- REST API on port **8091**, **PostgreSQL** database in Docker.
- Layers: `controller` → `service` → `repository` → `repository.jpa` → DB,
  with `dto` ↔ `entity` translation via static `mapper` classes.
- **Two-tier repositories**: a hand-written `@Repository` wraps a Spring Data `JpaRepository` interface.
- **Flyway** — database schema managed by migrations `V1`…`V19` (JPA `ddl-auto = none`).
- **Lombok** for dependency injection (`@AllArgsConstructor` / `@RequiredArgsConstructor`).
- **DTO validation** via `jakarta.validation` (messages in Polish).

Key dependencies: `spring-boot-starter-web`, `spring-boot-starter-data-jpa`,
`spring-boot-starter-security`, `jjwt` 0.12.3 (JWT), `flyway-core` 11.10.1,
`postgresql` (JDBC), `spring-boot-docker-compose`.

#### Security / authorization
- **JWT in httpOnly cookies**, stateless sessions (`STATELESS`).
- `AuthController` (`/api/auth/**`, public) issues `accessToken` + `refreshToken`.
  Endpoints `/api/auth/verify` and `/api/auth/refresh` support the frontend session flow.
- `JwtAuthenticationFilter` reads the `accessToken` cookie on every request
  (except `/api/auth/`), validates it via `JwtService`, and sets authorities in `SecurityContextHolder`.
- Authorities are role **display names** (`"Gardener"`, `"Employee"`).
- CORS allows any `localhost`/`127.0.0.1` port with credentials.

### Frontend — `frontend/`
- **React 19** + **TypeScript** + **Vite**, port **5173**.
- Styling: **Tailwind CSS**, icons via **lucide-react**.
- Routing centralized in `src/App.tsx`; auth state (`isLoggedIn`, `userRole`)
  verified on startup via `/api/auth/verify`; `ProtectedRoute` gates routes by role
  (most require `"Gardener"`).
- **Feature structure — file triad** in `src/components/<feature>/`:
  `<Feature>.tsx` (page) · `<Feature>Hooks.tsx` (state, effects, fetch) · `<Feature>Components.tsx` (presentation).
- Maps: **leaflet** + **react-leaflet** + **leaflet-draw** (drawing sector polygons).
- Charts: **recharts**. Calendar: **react-big-calendar**. Dates: **date-fns**.
- `authFetch` — a `fetch` wrapper with `credentials: 'include'` that, on a **403**,
  transparently refreshes the token once (`/api/auth/refresh`) and retries the request.
- **Weather**: Open-Meteo is called directly from the browser (no backend proxy).

---

## Domain model

Core entities (package `fruit.farm.management`):

- **User** — a gardener owns employees via the self-referential `gardener` relation.
- **Role** — the user's role (`Gardener` / `Employee`).
- **Sector** — an orchard plot: polygon of corners (`Coordinate`) + `PlantType` (species) and variety.
- **WorkEntry** — an employee's daily work entry (hours or kg picked), with computed wage.
- **WorkDetails** — pay configuration: hourly vs piece-rate (per kg).
- **AdvancePay** — advances against wages, with settlement status.
- **Expense** / **Profit** — expenses and revenue, tied to a user and a sector.
- **Notification** — event log (USER / SECTOR / PROFIT / EXPENSE).
- **WeatherNotification** — weather-alert rules (type, threshold, days ahead 1–7).
- **Ticket** — a support ticket (description, category, status OPEN/IN_PROGRESS/CLOSED).

Wages are computed by `DailySalaryCalculator` from `WorkDetails`:
hourly pay × time, or per-kg pay × kilograms. ERD: `backend/erd-diagram.puml` / `.png`.

### REST endpoint overview

| Area | Base path |
|---|---|
| Authentication | `/api/auth` (login, register, logout, refresh, verify) |
| Workers | `/api/users` |
| Gardener profile | `/api/gardener` |
| Sectors | `/api/sectors` |
| Work entries | `/api/work-entries` |
| Pay configuration | `/api/work-details` |
| Expenses | `/api/expenses` |
| Revenue | `/api/profits` |
| Advances | `/api/advances` |
| Notifications | `/api/notification` |
| Weather alerts | `/api/weather-notifications` |
| Support tickets | `/api/tickets` |

---

## Running locally

> Requirements: **JDK 21**, **Maven**, **Node.js**, **Docker** (running).

### Backend (from `backend/`)
```bash
docker-compose -f compose.yaml up -d   # start PostgreSQL (required first)
mvn clean package install              # build + fetch dependencies
./mvnw spring-boot:run                 # run the API on :8091
```
`spring-boot-docker-compose` is on the runtime classpath — starting the app brings
the database container up by itself. The backend test suite lives in `src/test/` (unit,
web, repository with Testcontainers, integration) and runs in CI on every push/PR via
`.github/workflows/backend-tests.yml` (`./mvnw clean test` on JDK 21).

### Frontend (from `frontend/`)
```bash
npm install
npm run dev       # Vite dev server at http://localhost:5173
npm run build     # tsc -b && vite build
npm run lint      # eslint
```

### Standalone commands (`make`)

The recurring operations are wrapped in a root `Makefile`, so they can be run
directly from a terminal — no IDE or extra tooling required:

```bash
make help              # list all targets
make dev-up            # PostgreSQL + backend (:8091) + frontend (:5173), in the background
make dev-down          # stop the local stack (backend, frontend, DB container)
```

These wrap the scripts in `.claude/skills/*/run.sh`; you can also call those scripts
directly (e.g. `bash .claude/skills/dev-up/run.sh`).

---

## Deployment — Azure

The app is deployed to **Azure for Students** (resource group `rg-fruitfarm`, region
`polandcentral`):

- **PostgreSQL Flexible Server** — the database (the only resource billed 24/7).
- **Azure Container Apps** — `ca-backend` and `ca-frontend`, both with `min-replicas 0`
  (scale-to-zero, so they cost nothing while idle).
- Docker images live on **GitHub Container Registry**: `ghcr.io/centgeek/ff-backend`
  and `ghcr.io/centgeek/ff-frontend`.

### Requirements

- **Azure CLI** (`az`) logged in — the scripts select the subscription automatically.
- **Docker + buildx**, logged in to `ghcr.io` as `centgeek`
  (`echo $GHCR_TOKEN | docker login ghcr.io -u centgeek --password-stdin`).
- Images are built for **linux/amd64** (a Mac is arm64, Azure needs amd64) — buildx handles this.

### Commands

```bash
make azure-up                 # resume: start the DB, wait until Ready, warm up the backend
make azure-stop               # pause: stop the DB (Container Apps scale to zero on their own)

make azure-deploy             # build + push + roll out backend AND frontend on a fresh tag
make azure-deploy-backend     # backend only
make azure-deploy-frontend    # frontend only
```

How deploy works: it computes an immutable image tag from git (e.g. `1f236ab`, or
`-dirty-HHMMSS` when there are uncommitted changes), builds and pushes the images, then
runs `az containerapp update` to the new tag — which forces a fresh revision (pushing
`:latest` alone would not). The frontend image is backend-agnostic: it uses relative
`/api` paths and nginx reverse-proxies them to the backend. The backend FQDN is injected
at **runtime** as the `BACKEND_ORIGIN` env var on `ca-frontend` — it is never compiled
into the bundle, so the same image works in every environment.

After deploy a new revision comes up in ~30–60s. If the database is stopped, run
`make azure-up` first (deploy does not start the DB). Backend logs:
`az containerapp logs show -n ca-backend -g rg-fruitfarm --tail 50`.

### Cost note

Stopping the DB drops the cost to roughly storage only (~1–2 USD/month). **Azure
auto-starts a stopped Flexible Server after at most 7 days** — re-run `make azure-stop`
after such an auto-restart. Full teardown (irreversible): `az group delete -n rg-fruitfarm`.

> Production config: front and backend share **one origin** — the browser only ever talks
> to `ca-frontend`, and nginx forwards `/api` server-side to `ca-backend` (`BACKEND_ORIGIN`).
> So there is **no CORS** and the JWT cookies work under `SameSite=Lax`. The deploy sets
> `APP_COOKIE_SECURE=true`, `APP_COOKIE_SAME_SITE=Lax`, `SECURITY_BCRYPT_STRENGTH=12`, and a
> generated `JWT_SECRET_KEY` (a `jwt-secret` Container App secret created once and never
> overwritten, so already-issued tokens stay valid) on `ca-backend`. The datasource
> credentials (`SPRING_DATASOURCE_*`) are **not** set by the deploy script — they were
> configured on `ca-backend` once at provisioning time and persist across revisions.

---

## Notes

- Most UI text, messages, and logs are in **Polish** — keep this convention when editing.
- The JWT secret and bcrypt parameters live in `application.yml` (committed — fine for an engineering thesis, not for production).
- Add database schema changes as a new `V20__...sql` migration; do not edit existing migrations.
</content>
