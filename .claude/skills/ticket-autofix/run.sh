#!/usr/bin/env bash
# ticket-autofix plumbing: talk to the running app as Admin, manage the local
# usterka tracking files, push fix branches + open PRs, and deploy after merge.
# The multi-agent verify/fix/improve loop itself lives in fix-loop.workflow.js;
# this script only does the deterministic GitHub/HTTP/git glue around it.
#
# Subcommands:
#   run.sh scan                            # login, fetch all tickets, create usterki/USTERKA-<id>.md for NEW ones, print the new ones as a JSON array
#   run.sh ticket <id> <STATUS>            # PATCH ticket status: OPEN | IN_PROGRESS | CLOSED
#   run.sh comment <id> <text...>          # PATCH the admin comment on a ticket (Polish — it is shown back to the reporter)
#   run.sh open-pr <id> <branch> [title]   # push <branch> via github-private, open a PR (GH_TOKEN) or print the compare URL; update the usterka file
#   run.sh finalize [id...]                # deploy via azure-deploy, then CLOSE the given (or all 'fixed') tickets
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$SCRIPT_DIR/../../.." && pwd)"   # 3 levels up from .claude/skills/ticket-autofix/run.sh

BASE_URL="${USTERKI_BASE_URL:-http://localhost:8091}"
ADMIN_NICK="${USTERKI_ADMIN_NICKNAME:-admin}"
ADMIN_PASS="${USTERKI_ADMIN_PASSWORD:-test5432}"
GH_OWNER="centGeek"
GH_REPO="FruitFarmManagementSystem"
GH_WEB="https://github.com/$GH_OWNER/$GH_REPO"
USTERKI_DIR="$REPO/usterki"

JAR="$(mktemp -t ticket-cookies.XXXXXX)"
trap 'rm -f "$JAR"' EXIT

need() { command -v "$1" >/dev/null || { echo "ERROR: '$1' is required but not installed." >&2; exit 1; }; }
need curl; need jq; need git

login() {
  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' -c "$JAR" -X POST "$BASE_URL/api/auth/login" \
    -H 'Content-Type: application/json' \
    -d "$(jq -nc --arg n "$ADMIN_NICK" --arg p "$ADMIN_PASS" '{nickname:$n,password:$p}')")
  if [[ "$code" != "200" ]]; then
    echo "ERROR: admin login to $BASE_URL failed (HTTP $code)." >&2
    echo "       Is the app running? Start it with the dev-up skill, and check the admin credentials" >&2
    echo "       (defaults nickname=admin / password=test5432; override with USTERKI_ADMIN_NICKNAME / USTERKI_ADMIN_PASSWORD)." >&2
    exit 1
  fi
}

api_get()   { curl -s -b "$JAR" "$BASE_URL$1"; }
api_patch() { curl -s -o /dev/null -w '%{http_code}' -b "$JAR" -X PATCH -H 'Content-Type: application/json' -d "$2" "$BASE_URL$1"; }

ensure_gitignored() {
  local gi="$REPO/.gitignore"
  if ! grep -qxF 'usterki/' "$gi" 2>/dev/null; then
    printf '\n# ticket-autofix local tracking files (not committed)\nusterki/\n' >> "$gi"
  fi
}

write_usterka_file() {
  local file="$1" row="$2"
  local id desc cat created reporter nick now
  id=$(echo "$row" | jq -r '.id')
  desc=$(echo "$row" | jq -r '.description // ""')
  cat=$(echo "$row" | jq -r '.category // "OTHER"')
  created=$(echo "$row" | jq -r '.createdAt // ""')
  reporter=$(echo "$row" | jq -r '(((.userDto.name // "") + " " + (.userDto.surname // "")) | gsub("(^ +)|( +$)";""))')
  nick=$(echo "$row" | jq -r '.userDto.nickname // "?"')
  now=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  {
    echo "---"
    echo "ticketId: $id"
    echo "reporter: $nick"
    echo "category: $cat"
    echo "createdAt: $created"
    echo "status: open"      # open | fixed | invalid | deployed
    echo "branch:"
    echo "prUrl:"
    echo "---"
    echo
    echo "# Usterka #$id — $cat"
    echo
    echo "**Reporter:** ${reporter:-?} ($nick)"
    echo "**Reported at:** $created"
    echo
    echo "## Reported description (verbatim)"
    echo
    echo "$desc"
    echo
    echo "## Worklog"
    echo
    echo "- $now — detected by ticket-autofix scan; status: open"
  } > "$file"
}

set_front_matter() {
  # set_front_matter <file> <key> <value> — value is treated literally
  local f="$1" key="$2" val="$3" esc
  [[ -f "$f" ]] || return 0
  # escape sed replacement metacharacters (\, the | delimiter, and &)
  esc=$(printf '%s' "$val" | sed -e 's/[\\&|]/\\&/g')
  sed -i.bak "s|^${key}:.*|${key}: ${esc}|" "$f" && rm -f "$f.bak"
}

cmd_scan() {
  mkdir -p "$USTERKI_DIR"
  ensure_gitignored
  login
  local tmp_all tmp_new page total resp
  tmp_all=$(mktemp); tmp_new=$(mktemp)
  trap 'rm -f "$JAR" "$tmp_all" "$tmp_new"' EXIT
  : > "$tmp_all"
  page=0; total=1
  # Only actionable OPEN tickets become new issues (IN_PROGRESS = already being
  # worked, CLOSED = already resolved). Dedup is still by file existence.
  while (( page < total )); do
    resp=$(api_get "/api/tickets/all?status=OPEN&page=$page&size=100")
    total=$(echo "$resp" | jq -r '(.totalPages // 1)')
    echo "$resp" | jq -c '.content[]?' >> "$tmp_all"
    page=$((page+1))
  done
  : > "$tmp_new"
  while IFS= read -r row; do
    [[ -z "$row" ]] && continue
    local id file
    id=$(echo "$row" | jq -r '.id')
    file="$USTERKI_DIR/USTERKA-$id.md"
    if [[ ! -f "$file" ]]; then
      write_usterka_file "$file" "$row"
      echo "$row" | jq -c '{id, description, category, createdAt,
        reporter: (((.userDto.name // "") + " " + (.userDto.surname // "")) | gsub("(^ +)|( +$)";"")),
        nickname: (.userDto.nickname // "?")}' >> "$tmp_new"
    fi
  done < "$tmp_all"
  jq -s '.' "$tmp_new"
}

cmd_open_pr() {
  [[ $# -ge 2 ]] || { echo "usage: open-pr <id> <branch> [title]" >&2; exit 2; }
  local id="$1" branch="$2" title="${3:-Fix usterka #$id}"
  git -C "$REPO" push -u origin "$branch"
  local pr_url=""
  if [[ -n "${GH_TOKEN:-}" ]]; then
    pr_url=$(curl -s -X POST "https://api.github.com/repos/$GH_OWNER/$GH_REPO/pulls" \
      -H "Authorization: Bearer $GH_TOKEN" -H "Accept: application/vnd.github+json" \
      -d "$(jq -nc --arg t "$title" --arg h "$branch" \
            --arg b "Automated fix for usterka #$id (local tracking: usterki/USTERKA-$id.md). Verified by a reproducing test; validated locally and by CI." \
            '{title:$t,head:$h,base:"main",body:$b}')" \
      | jq -r '.html_url // empty')
  fi
  if [[ -z "$pr_url" ]]; then
    pr_url="$GH_WEB/compare/main...$branch?expand=1"
    echo "==> No GH_TOKEN set — open the PR yourself: $pr_url" >&2
  else
    echo "==> PR opened: $pr_url" >&2
  fi
  local f="$USTERKI_DIR/USTERKA-$id.md"
  set_front_matter "$f" status fixed
  set_front_matter "$f" branch "$branch"
  set_front_matter "$f" prUrl "$pr_url"
  echo "$pr_url"
}

cmd_finalize() {
  local ids=("$@")
  if [[ ${#ids[@]} -eq 0 ]]; then
    local f
    for f in "$USTERKI_DIR"/USTERKA-*.md; do
      [[ -e "$f" ]] || continue
      if grep -q '^status: fixed' "$f"; then
        ids+=("$(basename "$f" | sed 's/^USTERKA-//; s/\.md$//')")
      fi
    done
  fi
  if [[ ${#ids[@]} -eq 0 ]]; then echo "No 'fixed' usterki to finalize."; exit 0; fi
  echo "==> Finalizing usterki: ${ids[*]}"

  # azure-deploy tags from the CHECKED-OUT HEAD, so make sure we are on an
  # up-to-date main (i.e. the merged PRs) before shipping — but never mutate the
  # user's possibly-dirty tree; just verify and tell them what to do.
  local branch behind
  branch=$(git -C "$REPO" rev-parse --abbrev-ref HEAD)
  if [[ "$branch" != "main" ]]; then
    echo "ERROR: HEAD is on '$branch', not 'main'. Check out main (with the merged PRs) before finalizing." >&2; exit 1
  fi
  git -C "$REPO" fetch -q origin main || true
  behind=$(git -C "$REPO" rev-list --count HEAD..origin/main 2>/dev/null || echo 0)
  if [[ "$behind" != "0" ]]; then
    echo "ERROR: local main is $behind commit(s) behind origin/main. Pull the merged PR(s) first (git pull --ff-only), then re-run finalize." >&2; exit 1
  fi

  echo "==> Deploying current main to Azure (azure-deploy both)…"
  if ! bash "$REPO/.claude/skills/azure-deploy/run.sh" both; then
    echo "ERROR: azure-deploy failed — NOT closing any tickets. If the Azure DB is stopped run the azure-up skill, then re-run finalize." >&2
    exit 1
  fi

  login
  local id scode ccode
  for id in "${ids[@]}"; do
    scode=$(api_patch "/api/tickets/$id/status" '{"status":"CLOSED"}')
    ccode=$(api_patch "/api/tickets/$id/comment" "$(jq -nc '{comment:"Usterka naprawiona i wdrozona w najnowszej wersji aplikacji. Dziekujemy za zgloszenie."}')")
    if [[ "$scode" =~ ^2 && "$ccode" =~ ^2 ]]; then
      set_front_matter "$USTERKI_DIR/USTERKA-$id.md" status deployed
      echo "ticket $id -> CLOSED + commented + marked deployed"
    else
      echo "WARNING: ticket $id write-back failed (status HTTP $scode, comment HTTP $ccode) — left as 'fixed' for a retry." >&2
    fi
  done
}

main() {
  local cmd="${1:-}"; shift || true
  case "$cmd" in
    scan)     cmd_scan ;;
    ticket)   [[ $# -ge 2 ]] || { echo "usage: ticket <id> <OPEN|IN_PROGRESS|CLOSED>" >&2; exit 2; }
              login; local code; code=$(api_patch "/api/tickets/$1/status" "$(jq -nc --arg s "$2" '{status:$s}')")
              [[ "$code" =~ ^2 ]] || { echo "ERROR: ticket $1 status PATCH -> HTTP $code" >&2; exit 1; }
              echo "ticket $1 -> $2 (HTTP $code)" ;;
    comment)  [[ $# -ge 2 ]] || { echo "usage: comment <id> <text...>" >&2; exit 2; }
              local id="$1" code; shift; login; code=$(api_patch "/api/tickets/$id/comment" "$(jq -nc --arg c "$*" '{comment:$c}')")
              [[ "$code" =~ ^2 ]] || { echo "ERROR: ticket $id comment PATCH -> HTTP $code" >&2; exit 1; }
              echo "ticket $id commented (HTTP $code)" ;;
    open-pr)  cmd_open_pr "$@" ;;
    finalize) cmd_finalize "$@" ;;
    *) echo "ERROR: unknown subcommand '$cmd'. Use: scan | ticket <id> <STATUS> | comment <id> <text> | open-pr <id> <branch> [title] | finalize [id...]" >&2; exit 1 ;;
  esac
}

main "$@"
