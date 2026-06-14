#!/usr/bin/env bash
# Validation gate for the ticket-autofix fix loop.
# Runs the project's canonical build/test gates with the PINNED JDK 21 and,
# when Rancher Desktop is running, the Testcontainers DOCKER_HOST.
#
# It targets the CURRENT git working tree (so it validates an agent's worktree,
# not the script's own repo). Run it from inside the tree you want to validate.
#
# Usage:
#   validate.sh repro <TestFilter>       # run a reproducing test; a FAILING test => "REPRODUCED" (exit 0), passing => exit 3
#   validate.sh quick [TestFilter]       # JDK21 test-compile (+ optional -Dtest=<filter> run); no Docker needed
#   validate.sh full                     # full backend suite: ./mvnw clean test (auto-degrades if Rancher is down)
#   validate.sh frontend                 # vite production build (build:docker) + eslint
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Validate the tree we are standing in (an agent's worktree); fall back to the
# script's own repo when not inside a git tree.
REPO="$(git rev-parse --show-toplevel 2>/dev/null || (cd "$SCRIPT_DIR/../../.." && pwd))"
BACKEND="$REPO/backend"
FRONTEND="$REPO/frontend"

# The repo pins java=21.0.6-tem via .sdkmanrc. The system default is JDK 25, and
# `/usr/libexec/java_home -v 21` wrongly resolves to 25 on this machine (breaks Lombok).
JAVA21="$HOME/.sdkman/candidates/java/21.0.6-tem"
DOCKER_SOCK="$HOME/.rd/docker.sock"   # Rancher Desktop socket

require_jdk21() {
  if [[ ! -x "$JAVA21/bin/java" ]]; then
    echo "ERROR: pinned JDK 21 not found at $JAVA21." >&2
    echo "       Install it: sdk install java 21.0.6-tem  (do NOT use /usr/libexec/java_home -v 21 — it returns JDK 25 here)." >&2
    exit 1
  fi
}

docker_up() { [[ -S "$DOCKER_SOCK" ]] && DOCKER_HOST="unix://$DOCKER_SOCK" docker version >/dev/null 2>&1; }

cmd="${1:-quick}"; shift || true

case "$cmd" in
  repro)
    require_jdk21
    filter="${1:-}"
    [[ -n "$filter" ]] || { echo "ERROR: repro needs a test filter, e.g. validate.sh repro MyTest#case" >&2; exit 2; }
    echo "==> [repro] test-compile (JDK 21)"
    ( cd "$BACKEND" && JAVA_HOME="$JAVA21" ./mvnw -q test-compile )
    echo "==> [repro] running candidate reproducing test: -Dtest=$filter (a FAILING test confirms the defect)"
    if ( cd "$BACKEND" && JAVA_HOME="$JAVA21" ./mvnw -q test -Dtest="$filter" ); then
      echo "==> [repro] NOT REPRODUCED — the test PASSED, so current code already behaves correctly (likely NOT a defect)."
      exit 3
    else
      echo "==> [repro] REPRODUCED — the test FAILED as expected; the defect is real. (This non-zero Maven result is the success signal here.)"
      exit 0
    fi
    ;;
  quick)
    require_jdk21
    filter="${1:-}"
    echo "==> [quick] test-compile (JDK 21)"
    ( cd "$BACKEND" && JAVA_HOME="$JAVA21" ./mvnw -q test-compile )
    if [[ -n "$filter" ]]; then
      echo "==> [quick] running targeted test(s): -Dtest=$filter (must PASS)"
      ( cd "$BACKEND" && JAVA_HOME="$JAVA21" ./mvnw -q test -Dtest="$filter" )
    fi
    echo "==> [quick] OK"
    ;;
  full)
    require_jdk21
    if docker_up; then
      echo "==> [full] Rancher Desktop is up — running the full backend suite: ./mvnw clean test"
      ( cd "$BACKEND" && DOCKER_HOST="unix://$DOCKER_SOCK" JAVA_HOME="$JAVA21" ./mvnw -q clean test )
      echo "==> [full] OK (full suite incl. Testcontainers @DataJpaTest / @SpringBootTest)"
    else
      echo "WARNING: Rancher Desktop / Docker socket not available at $DOCKER_SOCK." >&2
      echo "         Running the Docker-FREE gate only (test-compile). The Testcontainers @DataJpaTest /" >&2
      echo "         @SpringBootTest tests are DEFERRED to CI, which runs the full suite on the PR." >&2
      ( cd "$BACKEND" && JAVA_HOME="$JAVA21" ./mvnw -q test-compile )
      echo "==> [full] PARTIAL OK (compile-only; DB/integration tests deferred to CI). Start Rancher Desktop for a complete local run." >&2
    fi
    ;;
  frontend)
    echo "==> [frontend] vite production build (build:docker — vite only, skips the ~145 preexisting tsc errors)"
    ( cd "$FRONTEND" && { [[ -d node_modules ]] || npm ci; } && npm run build:docker )
    echo "==> [frontend] eslint"
    ( cd "$FRONTEND" && npm run lint )
    echo "==> [frontend] OK"
    ;;
  *)
    echo "ERROR: unknown command '$cmd'. Use: repro <filter> | quick [filter] | full | frontend" >&2
    exit 1 ;;
esac
