# Fruit Farm Management System — samodzielne komendy.
# Cienkie opakowania na deterministyczne skrypty z deployments/*.sh — działają BEZ Claude'a.
# Użycie: `make <cel>` z katalogu repo. Lista celów: `make help`.

DEPLOY := deployments

.DEFAULT_GOAL := help
.PHONY: help dev-up dev-down \
        azure-up azure-stop azure-backend-on azure-backend-sleep \
        azure-deploy azure-deploy-backend azure-deploy-frontend

help: ## Pokaż dostępne komendy
	@grep -E '^[a-zA-Z0-9_-]+:.*## ' $(MAKEFILE_LIST) | \
		awk 'BEGIN{FS=":.*## "}{printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2}'

# --- Lokalny stack ---------------------------------------------------------

dev-up: ## Uruchom lokalnie: PostgreSQL + backend (8091) + frontend (5173)
	bash $(DEPLOY)/dev-up.sh

dev-down: ## Zatrzymaj lokalny stack (backend, frontend, kontener DB)
	@kill $$(cat backend/.dev-logs/backend.pid backend/.dev-logs/frontend.pid 2>/dev/null) 2>/dev/null || true
	@cd backend && docker-compose -f compose.yaml down
	@echo "[dev-down] Zatrzymano lokalny stack."

# --- Azure: start / stop ---------------------------------------------------

azure-up: ## Wznów aplikację na Azure (start bazy + rozgrzanie backendu)
	bash $(DEPLOY)/azure-up.sh

azure-stop: ## Zatrzymaj aplikację na Azure (oszczędność kredytu)
	bash $(DEPLOY)/azure-stop.sh

# --- Azure: tryb backendu (zimny start vs always-on) -----------------------

azure-backend-on: ## Backend always-on (min=1, bez zimnego startu, ~$10-12/mies.)
	bash $(DEPLOY)/azure-backend-on.sh

azure-backend-sleep: ## Backend scale-to-zero (min=0, tanio, zimny start ~30-60s)
	bash $(DEPLOY)/azure-backend-sleep.sh

# --- Azure: deploy nowej wersji --------------------------------------------

azure-deploy: ## Zbuduj i wdróż na Azure backend + frontend
	bash $(DEPLOY)/azure-deploy.sh

azure-deploy-backend: ## Zbuduj i wdróż na Azure tylko backend
	bash $(DEPLOY)/azure-deploy.sh backend

azure-deploy-frontend: ## Zbuduj i wdróż na Azure tylko frontend
	bash $(DEPLOY)/azure-deploy.sh frontend
