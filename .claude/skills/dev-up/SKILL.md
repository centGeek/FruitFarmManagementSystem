---
name: dev-up
description: Run the entire Fruit Farm Management System stack locally - Docker PostgreSQL, Spring Boot backend (port 8091) and Vite frontend (port 5173) in the correct order. Use when the user asks to run, start, or launch the application / project / stack.
---

# dev-up — running the stack

Runs the project in the correct order: **Docker/PostgreSQL → backend (8091) → frontend (5173)**.
The backend and frontend must run in parallel.

## Quick start

Run the helper script (starts everything, backend and frontend in the background, logs to `backend/.dev-logs/`):

```bash
bash .claude/skills/dev-up/run.sh
```

The script checks the prerequisites itself and reports the URLs and log paths. After startup, verify health:

```bash
curl -fsS http://localhost:8091/actuator/health 2>/dev/null || curl -fsS http://localhost:8091/ -o /dev/null && echo "backend OK"
curl -fsS http://localhost:5173 -o /dev/null && echo "frontend OK"
```

## Order and details (when doing this manually)

1. **Docker must be running.** Check: `docker info`. If it isn't running — ask the user to start Docker Desktop (it can't be started automatically).
2. **Java 21.** The repo pins the version in `.sdkmanrc` (`21.0.6-tem`). If SDKMAN is used: `cd backend && sdk env`.
3. **PostgreSQL:** from the `backend/` directory → `docker-compose -f compose.yaml up -d`.
   - Note: `spring-boot-docker-compose` is on the runtime classpath, so starting the backend also brings up the DB container. A separate `up -d` is still useful to have the DB ready earlier.
4. **Backend** (from `backend/`): `./mvnw spring-boot:run` on port **8091**.
   - `backend/mvnw` may lack the executable bit — in that case use `sh mvnw spring-boot:run` or `mvn spring-boot:run`.
   - The first build downloads dependencies; it may take a while.
5. **Frontend** (from `frontend/`): `npm install` (if `node_modules` is missing), then `npm run dev` → **http://localhost:5173**.

## Diagnostics

- Logs (when started via the script) live in `backend/.dev-logs/backend.log` and `frontend.log`.
- Port in use? Check: `lsof -i :8091` / `lsof -i :5173`.
- Backend won't start because of the DB: make sure the Postgres container is running (`docker ps`).
