---
name: usterki-autofix
description: Daily defect-fixing loop for user-reported usterki (tickets) — scans the running app as Admin, opens one local tracked issue per new OPEN ticket, then runs a multi-agent loop that verifies each report by testing the code, fixes legitimate ones in an isolated git worktree, adversarially reviews and improves the fix until clean, and opens a PR. After you merge it deploys via azure-deploy and closes the ticket. Use when the user wants to triage and auto-fix newly reported usterki / bug tickets (as opposed to azure-deploy, which only ships an already-prepared version).
---

# usterki-autofix — triage and auto-fix newly reported usterki

Runs the full loop the team described: **new usterka → new issue → AI verifies the report by testing the code → if the reporter is right, fix → adversarially improve until there is nothing left to fix → PR → (after merge) deploy and close the ticket.** Each new usterka becomes exactly one tracked issue and one fix branch/PR; reports that turn out not to be real defects are flagged with a Polish explanation, never silently closed.

This skill ships three helpers in its own folder:
- `run.sh` — deterministic glue (admin login + ticket API, local issue files, branch push + PR, deploy/close).
- `fix-loop.workflow.js` — the multi-agent verify → implement → review → improve loop (run via the **Workflow** tool).
- `validate.sh` — the canonical build/test gates (pinned JDK 21, Testcontainers `DOCKER_HOST`, frontend build/lint).

## What it does

1. **Scan** (`run.sh scan`) — logs in as Admin (`nickname=admin / password=test5432`), pages `GET /api/tickets/all?status=OPEN`, and creates `usterki/USTERKA-<id>.md` for every OPEN ticket that does not already have one. The presence of that file is the dedup cursor, so **new usterka = new issue**, no duplicates (IN_PROGRESS/CLOSED tickets are skipped). Prints the new usterki as a JSON array.
2. **Fix loop** (Workflow `fix-loop.workflow.js`) — each usterka runs through two stages independently (parallel, isolated via **git worktrees** so the loop never touches your working tree):
   - **Verify** the report by *testing the code*: write the smallest reproducing test and run it (`validate.sh repro`). A failing test = the bug is real; a passing test ⇒ likely not a bug. If it is dismissed, an independent second-opinion agent re-checks and can re-open it.
   - If the reporter is right, **fix** it on branch `usterka/<id>` (in the worktree): implement, validate (repro passes + suite green), then a built-in self-improve loop, and commit.
   - **Adversarial review + improve until clean**: a parallel panel of independent reviewers (correctness / completeness / simplicity) asks "can it be improved?"; any actionable item is applied in a worktree and re-validated; the loop terminates only on a **clean review round** (or, at the `maxRounds` cap, flags the fix `improvementsOutstanding` rather than pretending it is done).
3. **Open a PR per fix** (`run.sh open-pr`) — pushes the branch over the `github-private` SSH alias and either opens the PR (if `GH_TOKEN` is set) or prints the compare URL to open in one click. CI (`.github/workflows/ci.yml`) runs the **full** suite on the PR. The ticket is set `IN_PROGRESS` and the reporter gets a Polish admin comment with the status + PR link.
4. **Deploy after merge** (`run.sh finalize`) — once you review and merge, deploys the new `main` via `azure-deploy` and sets the merged tickets to `CLOSED` with a Polish "naprawione i wdrożone" comment.

> The loop intentionally **stops at "PR open"** for a human merge — that is the safety gate for a live app. Deploying is a deliberate follow-up step, not part of the unattended daily run.

## Requirements

- The app running locally and reachable at `http://localhost:8091` — start it with the **dev-up** skill (Docker/Rancher Desktop → PostgreSQL → backend :8091 → frontend :5173). `run.sh scan` fails with guidance if it is not up.
- `jq`, `curl`, `git` on PATH. Pinned **JDK 21** at `~/.sdkman/candidates/java/21.0.6-tem` (the system default 25 breaks Lombok). Rancher Desktop running for the full Testcontainers suite — if it is down, `validate.sh` degrades to a compile gate and CI runs the full suite on the PR.
- Push works via the `github-private` SSH alias (origin = `git@github-private:centGeek/FruitFarmManagementSystem.git`). `gh` is logged in to a different account that cannot see this repo, so the skill does **not** use the gh API. Optional: set `GH_TOKEN` to a `centGeek` PAT (repo scope) to auto-open PRs via the REST API; otherwise it prints the compare URL.
- Deploy + `finalize` need the **azure-deploy** prerequisites (Docker buildx, ghcr login as `centgeek`, `az` logged in). Run **azure-up** first if the Azure DB is stopped.

## Running

When invoked (`/usterki-autofix`), follow these steps. Let `REPO` be the repository root (the parent of `backend/`).

1. **Scan for new usterki:**
   ```bash
   bash .claude/skills/usterki-autofix/run.sh scan
   ```
   This prints a JSON array. If it is `[]`, report "no new usterki today" and stop. Otherwise parse it — each element is `{id, description, category, createdAt, reporter, nickname}`.

2. **Run the fix loop** via the **Workflow** tool with the shipped script, passing the scanned usterki as `args`:
   ```
   Workflow({
     scriptPath: "<REPO>/.claude/skills/usterki-autofix/fix-loop.workflow.js",
     args: {
       repo: "<REPO>",
       validateScript: "<REPO>/.claude/skills/usterki-autofix/validate.sh",
       usterki: <the JSON array from step 1>,
       maxRounds: 4
     }
   })
   ```
   It returns one result per usterka: `status` is `fixed` (with `branch`, `summary`, `reproTest`, `improveRounds`, `validation`), `invalid` (with `classification` + Polish `explanationPl`), or `error`.

3. **For each `fixed` result**, in this order:
   ```bash
   bash .claude/skills/usterki-autofix/run.sh ticket  <id> IN_PROGRESS
   bash .claude/skills/usterki-autofix/run.sh open-pr <id> usterka/<id> "Fix usterka #<id>: <short title>"
   bash .claude/skills/usterki-autofix/run.sh comment <id> "Zgłoszenie w trakcie naprawy. PR: <prUrl>. Po wdrożeniu damy znać."   # reporter-facing message stays Polish; <prUrl> printed by open-pr
   ```
   (`open-pr` prints the PR/compare URL and updates the usterka file to `status: fixed` with the branch + PR link.) If the result has `improvementsOutstanding: true` or `reviewIncomplete: true`, say so plainly in the PR title/body and in your summary — do **not** present it as fully polished — so the human reviewer knows to look harder before merging.

4. **For each `invalid` result**, append the reasoning to `usterki/USTERKA-<id>.md` (set `status: invalid`), comment back to the reporter in Polish, and **leave the ticket OPEN** for a human to decide:
   ```bash
   bash .claude/skills/usterki-autofix/run.sh comment <id> "<explanationPl from the workflow result — the courteous Polish message shown to the reporter>"
   ```

5. **Summarize** to the user: how many usterki were scanned/created, which got PRs (with links), which were dismissed (with reasons), and the next action — **review + merge the green PRs, then run `finalize` to deploy and close the tickets**.

## After merge — deploy and close

Once the PR(s) are reviewed and merged into `main` (CI green), deploy the new version and close the corresponding tickets:
```bash
# pull merged main first, run azure-up if the Azure DB is stopped
bash .claude/skills/usterki-autofix/run.sh finalize           # all usterki currently marked 'fixed'
bash .claude/skills/usterki-autofix/run.sh finalize 42 47      # or specific ticket ids
```
This runs `azure-deploy both`, then sets those tickets to `CLOSED` with a Polish "naprawione i wdrożone" comment and marks the usterka files `deployed`.

## Scheduling it daily

The daily run must happen on this machine (it scans the local app, builds, and pushes), so schedule a headless invocation rather than a cloud routine. Example macOS cron entry (run `dev-up` beforehand or ensure the stack is up):
```cron
# 08:00 every day — prepare PRs for new usterki (review + merge + finalize stay manual)
0 8 * * *  cd /Users/lukasz.centkowski/Desktop/student/FruitFarmManagementSystem/backend && claude -p "/usterki-autofix" >> "$HOME/.usterki-autofix.log" 2>&1
```
Or, inside an open Claude Code session: `/loop 24h /usterki-autofix`. Either way the loop stops at "PR open" so a human merges and runs `finalize`.

## Notes

- **Isolated git worktrees** — every fix/improve agent works in its own private checkout, so the loop **never touches your working tree** (your uncommitted WIP and untracked files are safe) and usterki can be fixed in parallel without colliding; the read-only review panel reads each branch via `git diff main...usterka/<id>`.
- **Reports that are not defects are not auto-closed** — they get a Polish explanation and stay OPEN for a human, so a real complaint is never lost. A dismissal is double-checked by an independent second opinion that can re-open it.
- **Honest "done"** — a fix is only called clean when an independent review round finds nothing actionable; if the improve cap is hit or reviewers fail, the result is flagged (`improvementsOutstanding` / `reviewIncomplete`) and surfaced on the PR.
- **Never edits existing Flyway migrations** — schema changes go in a new `V20+` file (enforced in every agent prompt).
- **Commit identity** is forced per-commit to `Lukasz Centkowski <centkowski.lukasz03@gmail.com>` (same as the `commit` skill); global git config is never touched.
- **`usterki/` is gitignored** (local tracking only) so fix branches stay code-only; `run.sh scan` adds the ignore entry if missing.
