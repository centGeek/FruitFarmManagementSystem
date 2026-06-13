# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Fruit orchard ("sad") management system, built as an engineering thesis. Two independent layers that must run in parallel:
- `backend/` — Spring Boot 3.5 (Java 21) REST API on port **8091**, PostgreSQL via Docker.
- `frontend/` — React 19 + TypeScript + Vite SPA on port **5173**, styled with Tailwind.

Most user-facing strings, comments, and log messages are in **Polish** — match this when editing UI text.

## Commands

### Backend (run from `backend/`)
```bash
docker-compose -f compose.yaml up -d   # start PostgreSQL (required first; Docker must be running)
mvn clean package install              # build + fetch deps
./mvnw spring-boot:run                 # run the app (or run FruitFarmManagementApplication in IDE)
```
Note: `spring-boot-docker-compose` is on the runtime classpath, so booting the app also brings the DB container up automatically. There is **no test suite** (`src/test/` does not exist) despite test deps in `pom.xml`.

### Frontend (run from `frontend/`)
```bash
npm install
npm run dev       # Vite dev server at http://localhost:5173
npm run build     # tsc -b && vite build
npm run lint      # eslint
```

## Backend architecture

Standard layered Spring Boot, package root `fruit.farm.management`:

`controller` → `service` → `repository` → `repository.jpa` → DB, with `dto` ↔ `entity` translated by static `mapper` classes (e.g. `UserMapper.mapFromEntity(...)`).

Key conventions:
- **Two-tier repositories.** Each domain has a hand-written `@Repository` class (e.g. `WorkEntryRepository`) that wraps a Spring Data `JpaRepository` interface in `repository/jpa/` (e.g. `WorkEntryJpaRepository`). Custom JPQL lives on the JPA interface via `@Query`; the wrapper class adds orchestration/cross-repository logic. Add data access by extending both layers, not by injecting `JpaRepository` directly into services.
- **DI via Lombok** `@AllArgsConstructor` / `@RequiredArgsConstructor` on the class — no explicit constructors. Lombok is also the annotation processor (see `pom.xml`).
- **Mappers are static utility classes**, called directly (`UserMapper.mapFromEntity(...)`), not injected beans.
- **DTO validation** uses `jakarta.validation` annotations (`@NotBlank`, `@Size`) with Polish messages.
- Exceptions in `exception/` are surfaced through `controller/GlobalExceptionHandler`.
- DB schema is owned by **Flyway** migrations in `src/main/resources/db/migration/` (`V1__...sql` … `V13__...sql`). JPA `ddl-auto` is `none` — never rely on Hibernate to create tables. Add schema changes as a new `V14__...sql` file; do not edit existing migrations.

### Auth / security
- **JWT in httpOnly cookies**, stateless sessions (`SessionCreationPolicy.STATELESS`).
- `AuthController` (`/api/auth/**`, public) issues `accessToken` (1h) + `refreshToken` (7d) cookies on login/register. `/api/auth/verify` and `/api/auth/refresh` support the frontend session flow.
- `JwtAuthenticationFilter` reads the `accessToken` cookie on every non-`/api/auth/` request, validates via `JwtService`, and populates `SecurityContextHolder` with authorities. Authorities are role **display names** (`"Gardener"`, `"Employee"` — see `RoleType`), not enum constants.
- Route authorization is declared in `SecurityConfig.securityFilterChain`. The JWT secret and bcrypt strength are in `application.yml` (committed — fine for this thesis project, not production).
- CORS (`CorsConfig`) allows any `localhost`/`127.0.0.1` port with credentials.

## Frontend architecture

Routing is centralized in `src/App.tsx`. Auth state (`isLoggedIn`, `userRole`) lives there: on mount it calls `/api/auth/verify`, and a `ProtectedRoute` wrapper gates routes by role. Most feature routes require the `"Gardener"` role.

**Feature folders use a strict three-file triad** under `src/components/<feature>/`:
- `<Feature>.tsx` — the page component; consumes the hook and renders sub-components.
- `<Feature>Hooks.tsx` — a `use<Feature>` hook holding all state, effects, and data-fetching/handlers.
- `<Feature>Components.tsx` — presentational sub-components (modals, cards, forms), often `React.memo`'d.

Follow this split when adding or editing a feature — keep logic in the Hooks file and markup in Components.

Shared utilities in `src/utils/`:
- `apiConfigs.tsx` — exports `BACKEND_URL` (`http://localhost:8091`) and `getAuthHeaders()`. All API calls go through `BACKEND_URL`.
- `authFetch.tsx` — wrapper around `fetch` that always sends `credentials: 'include'` and, on a **403**, transparently calls `/api/auth/refresh` once (with subscriber queueing for concurrent requests) then retries. Use `authFetch` for authenticated calls; plain `fetch` only for the public auth endpoints.
- `BasicMap.tsx` / `LocationSearch.tsx` — Leaflet map helpers; the orchard map feature uses `react-leaflet` + `leaflet-draw` to draw sector polygons.

External integration: the weather feature calls the **Open-Meteo** API directly from the browser (no backend proxy).

## Domain model

Core entities: `User` (gardeners own employees via a self-referential `gardener` relation), `Role`, `Sector` (orchard plot with `Coordinate` polygon corners and a `PlantType`), `WorkEntry` (an employee's daily work — hours or kg picked), `WorkDetails` (pay config: hourly vs per-kg), `AdvancePay`, `Expense`, `Profit`, `WeatherNotification`, `Notification`. Salaries are computed by `DailySalaryCalculator` from `WorkDetails` (hourly pay × duration, or per-kg pay × kilograms). The ERD is at `backend/erd-diagram.puml` / `.png`.
