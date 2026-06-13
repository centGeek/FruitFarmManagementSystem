# Fruit Farm Management System — samodzielne komendy.
# Cienkie opakowania na skrypty z .claude/skills/*/run.sh — działają BEZ Claude'a.
# Użycie: `make <cel>` z katalogu repo. Lista celów: `make help`.

SKILLS := .claude/skills

.DEFAULT_GOAL := help
.PHONY: help dev-up dev-down \
        azure-up azure-stop \
        azure-deploy azure-deploy-backend azure-deploy-frontend

help: ## Pokaż dostępne komendy
	@grep -E '^[a-zA-Z0-9_-]+:.*## ' $(MAKEFILE_LIST) | \
		awk 'BEGIN{FS=":.*## "}{printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2}'

# --- Lokalny stack ---------------------------------------------------------

dev-up: ## Uruchom lokalnie: PostgreSQL + backend (8091) + frontend (5173)
	bash $(SKILLS)/dev-up/run.sh

dev-down: ## Zatrzymaj lokalny stack (backend, frontend, kontener DB)
	@kill $$(cat backend/.dev-logs/backend.pid backend/.dev-logs/frontend.pid 2>/dev/null) 2>/dev/null || true
	@cd backend && docker-compose -f compose.yaml down
	@echo "[dev-down] Zatrzymano lokalny stack."

# --- Azure: start / stop ---------------------------------------------------

azure-up: ## Wznów aplikację na Azure (start bazy + rozgrzanie backendu)
	bash $(SKILLS)/azure-up/run.sh

azure-stop: ## Zatrzymaj aplikację na Azure (oszczędność kredytu)
	bash $(SKILLS)/azure-stop/run.sh

# --- Azure: deploy nowej wersji --------------------------------------------

azure-deploy: ## Zbuduj i wdróż na Azure backend + frontend
	bash $(SKILLS)/azure-deploy/run.sh

azure-deploy-backend: ## Zbuduj i wdróż na Azure tylko backend
	bash $(SKILLS)/azure-deploy/run.sh backend

azure-deploy-frontend: ## Zbuduj i wdróż na Azure tylko frontend
	bash $(SKILLS)/azure-deploy/run.sh frontend
