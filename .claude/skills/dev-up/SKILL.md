---
name: dev-up
description: Uruchom cały stack Fruit Farm Management System lokalnie - Docker PostgreSQL, backend Spring Boot (port 8091) i frontend Vite (port 5173) w poprawnej kolejności. Użyj, gdy użytkownik prosi o uruchomienie, wystartowanie lub odpalenie aplikacji / projektu / stacku.
---

# dev-up — uruchomienie stacku

Uruchamia projekt w poprawnej kolejności: **Docker/PostgreSQL → backend (8091) → frontend (5173)**.
Backend i frontend muszą działać równolegle.

## Szybki start

Uruchom skrypt pomocniczy (startuje wszystko, backend i frontend w tle, loguje do `backend/.dev-logs/`):

```bash
bash .claude/skills/dev-up/run.sh
```

Skrypt sam sprawdza warunki wstępne i raportuje URL-e oraz ścieżki logów. Po starcie zweryfikuj zdrowie:

```bash
curl -fsS http://localhost:8091/actuator/health 2>/dev/null || curl -fsS http://localhost:8091/ -o /dev/null && echo "backend OK"
curl -fsS http://localhost:5173 -o /dev/null && echo "frontend OK"
```

## Kolejność i szczegóły (gdy robisz to ręcznie)

1. **Docker musi działać.** Sprawdź: `docker info`. Jeśli nie działa — poproś użytkownika o uruchomienie Docker Desktop (nie da się go wystartować automatycznie).
2. **Java 21.** Repo przypina wersję w `.sdkmanrc` (`21.0.6-tem`). Jeśli używany jest SDKMAN: `cd backend && sdk env`.
3. **PostgreSQL:** z katalogu `backend/` → `docker-compose -f compose.yaml up -d`.
   - Uwaga: `spring-boot-docker-compose` jest na classpath runtime, więc sam start backendu też podnosi kontener DB. Osobny `up -d` jest mimo to przydatny, by mieć DB gotową wcześniej.
4. **Backend** (z `backend/`): `./mvnw spring-boot:run` na porcie **8091**.
   - `backend/mvnw` może nie mieć bitu wykonywalności — wtedy użyj `sh mvnw spring-boot:run` albo `mvn spring-boot:run`.
   - Pierwszy build pobiera zależności; może potrwać.
5. **Frontend** (z `frontend/`): `npm install` (jeśli brak `node_modules`), potem `npm run dev` → **http://localhost:5173**.

## Diagnostyka

- Logi (przy uruchomieniu skryptem) leżą w `backend/.dev-logs/backend.log` i `frontend.log`.
- Port zajęty? Sprawdź: `lsof -i :8091` / `lsof -i :5173`.
- Backend nie wstaje przez DB: upewnij się, że kontener Postgres działa (`docker ps`).
