export const meta = {
  name: 'usterki-fix-loop',
  description: 'Per usterka: verify the report by testing the code, fix it in an isolated worktree, then adversarially review and improve until there is nothing left to fix',
  phases: [
    { title: 'Fix' },      // verify + implement + internal improve, in an isolated worktree
    { title: 'Review' },   // independent adversarial review panel (read-only)
    { title: 'Improve' },  // apply review feedback, re-validate
  ],
}

// ---- inputs (passed as `args` by the usterki-autofix skill) ----
const REPO = args.repo
const VALIDATE = args.validateScript || (REPO + '/.claude/skills/usterki-autofix/validate.sh')
const USTERKI = args.usterki || []
const MAX_ROUNDS = args.maxRounds || 4

// Per-commit identity (matches the `commit` skill — never touches global git config).
const IDENT = 'git -c user.name="Lukasz Centkowski" -c user.email="centkowski.lukasz03@gmail.com"'
const COAUTHOR = 'Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>'

const CONV = `Match the codebase conventions (see ${REPO}/CLAUDE.md): two-tier repositories (wrapper @Repository over a JpaRepository), static mapper utility classes, Lombok constructor DI, Bean Validation with Polish messages, Flyway owns the schema (add a NEW V20+ migration for schema changes, NEVER edit an existing migration; ddl-auto=none), Polish for user-facing strings, English for code/tests. Tests follow ${REPO}/.claude/skills/add-tests/SKILL.md (naming methodUnderTest_whenCondition_expectedOutcome, AssertJ, @WebMvcTest/@DataJpaTest/@SpringBootTest slices, authorities are role display names "Admin"/"Gardener"/"Employee", anonymous -> 403).`

// ---------------------------------------------------------------- schemas
const LIFECYCLE_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['status', 'classification', 'worklog'],
  properties: {
    status: { type: 'string', enum: ['fixed', 'invalid', 'error'] },
    classification: { type: 'string', enum: ['bug', 'works-as-intended', 'cannot-reproduce', 'feature-request', 'too-vague'] },
    confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
    branch: { type: 'string', description: 'usterka/<id> when status=fixed, else ""' },
    reproTest: { type: 'string', description: 'fully-qualified test ClassName or ClassName#method, or ""' },
    summary: { type: 'string', description: 'English: what changed and why it resolves the usterka (when fixed)' },
    filesChanged: { type: 'array', items: { type: 'string' } },
    validation: { type: 'string', description: 'which gates ran (repro/quick/full/frontend) and their result' },
    explanationPl: { type: 'string', description: 'Polish explanation for the reporter, used only when status=invalid' },
    worklog: { type: 'string', description: 'terse English log of what you did and the evidence found' },
  },
}
const VERDICT_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['legitimate', 'classification', 'worklog'],
  properties: {
    legitimate: { type: 'boolean' },
    classification: { type: 'string', enum: ['bug', 'works-as-intended', 'cannot-reproduce', 'feature-request', 'too-vague'] },
    confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
    explanationPl: { type: 'string' },
    worklog: { type: 'string' },
  },
}
const REVIEW_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['verdict', 'improvements'],
  properties: {
    verdict: { type: 'string', enum: ['good', 'needs-work'] },
    improvements: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['title', 'detail', 'actionable', 'severity'],
        properties: {
          title: { type: 'string' },
          detail: { type: 'string' },
          actionable: { type: 'boolean', description: 'true only if it MUST/SHOULD change before merge; false for nitpicks/preferences' },
          severity: { type: 'string', enum: ['blocker', 'major', 'minor'] },
        },
      },
    },
  },
}
const IMPROVE_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['applied', 'summary', 'validation'],
  properties: {
    applied: { type: 'boolean', description: 'true only if you made AND committed at least one change' },
    summary: { type: 'string' },
    skipped: { type: 'array', items: { type: 'string' }, description: 'improvements deliberately NOT applied, with the reason' },
    validation: { type: 'string' },
  },
}

// ---------------------------------------------------------------- prompts
function lifecyclePrompt(u, branch, hint) {
  return `You are fixing a user-reported defect ("usterka") in the Fruit Farm Management System. You work inside an ISOLATED git worktree (a private checkout) — your current directory is a full copy of the repo and NOTHING you do here touches the user's main working tree, so you may freely create branches, edit, build and commit. The backend is at ./backend (Spring Boot, Java 21), the frontend at ./frontend. The validation gate is ${VALIDATE} (run it from inside this worktree; it auto-targets the current tree).

USTERKA #${u.id} (category: ${u.category}), reported by ${u.reporter || u.nickname}:
"""
${u.description}
"""
${hint ? '\nIMPORTANT CONTEXT: ' + hint + '\n' : ''}
PHASE A — VERIFY the report by TESTING THE CODE (do NOT create a branch or commit yet):
1. Investigate the exact code path the user describes (backend controller/service/repository/entity, or frontend component/hook).
2. Write the SMALLEST reproducing test. Prefer a non-DB unit or @WebMvcTest test so it runs without Docker. ${CONV}
3. Run it: \`bash ${VALIDATE} repro <TestClassName#method>\` — this EXITS 0 and prints "REPRODUCED" when the test FAILS (the defect is real), and exits 3 / prints "NOT REPRODUCED" when it passes (current code is already correct).
4. Decide. If this is NOT a real code defect (works-as-intended / cannot-reproduce / feature-request / too-vague), set status="invalid" with a courteous Polish explanationPl for the reporter, MAKE NO BRANCH AND NO COMMITS, and return now.

PHASE B — only if it is a real defect:
5. \`git checkout -B ${branch}\` and commit the reproducing test.
6. Implement the MINIMAL, correct fix in the right layer. ${CONV}
7. Validate: \`bash ${VALIDATE} quick <your repro test>\` (must now PASS), then \`bash ${VALIDATE} full\`, and \`bash ${VALIDATE} frontend\` if you touched any frontend file.
8. SELF-IMPROVE (the "can it be improved?" requirement): critically re-read your own diff (\`git --no-pager diff main...HEAD\`); if anything can be made more correct, more complete, or simpler, improve it and re-validate. Repeat until you genuinely find nothing worth changing (max 3 internal rounds).
9. Commit the fix with the forced identity, adding files BY NAME (never \`git add -A\`):
   ${IDENT} commit -m "Fix usterka #${u.id}: <concise English: why>"  — include the trailer "${COAUTHOR}".
10. FREE THE BRANCH so independent reviewers/improvers can use it: \`git switch --detach\` (leave the commits on ${branch}; just detach HEAD).

Return the result. status="fixed" ONLY if the fix is committed on ${branch} and validation passed (or is a documented partial because Rancher Desktop was down); set branch="${branch}". Otherwise status="invalid" (with explanationPl) or "error".`
}

function secondOpinionPrompt(u, life) {
  return `An automated triage dismissed usterka #${u.id} as NOT a real code defect (classification: ${life.classification}). Reported text:
"""
${u.description}
"""
First triage reasoning: ${life.worklog}

You are an INDEPENDENT second opinion. Investigate the code yourself in ${REPO} (READ-ONLY — do not modify files or git state). Decide whether dismissing it was correct. Users' reports are valuable: set legitimate=true if there is a plausible real defect worth fixing; only set legitimate=false if you are confident it is not a code defect (then give a courteous Polish explanationPl for the reporter). Put the concrete defect you found, if any, in worklog.`
}

function reviewPrompt(u, branch, lens) {
  const guidance = {
    correctness: 'Does the fix actually resolve the reported defect? Look for bugs, regressions, missed edge cases, null/empty/boundary handling, and security/authorization implications.',
    completeness: 'Does it FULLY address the usterka across all affected paths? Is there an adequate, meaningful reproducing/regression test? Any related case left unfixed? If the schema changed, is there a new Flyway V20+ migration?',
    simplicity: 'Is it the minimal, idiomatic solution? Flag dead code, duplication, over-engineering, convention violations (CLAUDE.md), and unclear naming.',
  }[lens]
  return `You are an INDEPENDENT, skeptical reviewer of the committed fix on branch ${branch} for usterka #${u.id}. Review ONLY through the "${lens}" lens. READ-ONLY — do not edit files or git state.

Reported defect:
"""
${u.description}
"""

Inspect the change: \`cd ${REPO} && git --no-pager diff main...${branch}\`. To read a file's POST-fix content use \`git show ${branch}:<path>\` (the working copy here may contain unrelated local edits — always read the branch version via git show, not the working tree).

Lens: ${guidance}

Return concrete improvements. Mark actionable=true ONLY for items that genuinely must/should change before merge; mark nitpicks and preferences actionable=false. If the fix is solid through this lens, return verdict="good" with an empty improvements list.`
}

function improvePrompt(u, branch, items, reproTest) {
  const list = items.map((i, n) => `${n + 1}. [${i.severity}] ${i.title} — ${i.detail}`).join('\n')
  return `You work inside an ISOLATED git worktree (private checkout; the user's main tree is untouched). Apply these independent-reviewer requests to the fix on branch ${branch} for usterka #${u.id}, then re-validate and commit.

Improvements:
${list}

Steps: \`git checkout ${branch}\`; apply the changes (${CONV}); re-validate: \`bash ${VALIDATE} quick ${reproTest || '<the reproducing test for this usterka>'}\` and \`bash ${VALIDATE} full\` (plus \`bash ${VALIDATE} frontend\` if you touched frontend) — all must pass; commit with the forced identity (${IDENT} ..., trailer "${COAUTHOR}", files by name); then \`git switch --detach\` to free the branch. If an item is NOT a genuine improvement or would harm the code, skip it and record why in "skipped". Set applied=true only if you committed at least one real change.`
}

// ---------------------------------------------------------------- stages
// Stage 1: verify + implement + internal improve, in an isolated worktree.
// On a dismissal, an independent second opinion can re-open it (re-running the
// lifecycle with the second opinion's findings as a hint).
async function lifecycleStage(u) {
  const branch = `usterka/${u.id}`
  log(`usterka #${u.id} (${u.category}): verifying against the code in an isolated worktree`)
  let life = await agent(lifecyclePrompt(u, branch, ''), { label: `fix:${u.id}`, phase: 'Fix', schema: LIFECYCLE_SCHEMA, isolation: 'worktree' })
  if (!life) return { id: u.id, status: 'error', reason: 'lifecycle agent returned nothing' }

  if (life.status === 'invalid') {
    const second = await agent(secondOpinionPrompt(u, life), { label: `2nd-opinion:${u.id}`, phase: 'Fix', schema: VERDICT_SCHEMA })
    if (second && second.legitimate) {
      log(`usterka #${u.id}: first pass dismissed it, but an independent second opinion disagrees — re-opening and fixing`)
      const hint = `A first triage dismissed this, but an independent reviewer found a plausible real defect: ${second.worklog}. Assume there IS likely a defect — write a reproducing test and fix it.`
      life = await agent(lifecyclePrompt(u, branch, hint), { label: `fix:${u.id}:reopen`, phase: 'Fix', schema: LIFECYCLE_SCHEMA, isolation: 'worktree' })
      if (!life) return { id: u.id, status: 'error', reason: 'reopen lifecycle agent returned nothing' }
    } else {
      return { id: u.id, status: 'invalid', classification: life.classification, explanationPl: (second && second.explanationPl) || life.explanationPl || 'Zgloszenie nie zostalo potwierdzone jako blad w kodzie.', worklog: life.worklog }
    }
  }
  return { ...life, id: u.id, branch }
}

// Stage 2: independent adversarial review panel + improve until a CLEAN review
// (or an honest "outstanding"/"incomplete" flag). Runs only for fixed usterki.
async function reviewAndPolish(life, u) {
  if (!life || life.status !== 'fixed') return life
  const branch = life.branch || `usterka/${u.id}`
  const lenses = ['correctness', 'completeness', 'simplicity']
  let round = 0, appliedRounds = 0, outstanding = false, incomplete = false

  while (true) {
    const raw = await parallel(lenses.map(lens => () =>
      agent(reviewPrompt(u, branch, lens), { label: `review:${u.id}:${lens}`, phase: 'Review', schema: REVIEW_SCHEMA })
    ))
    const reviews = raw.filter(Boolean)
    if (reviews.length === 0) { incomplete = true; log(`usterka #${u.id}: all reviewers failed — keeping the fix but NOT claiming a clean review`); break }
    const actionable = reviews.flatMap(r => (r.improvements || []).filter(i => i.actionable))
    if (actionable.length === 0) { log(`usterka #${u.id}: review round ${round + 1} is clean — nothing left to improve`); break }
    if (round >= MAX_ROUNDS) { outstanding = true; log(`usterka #${u.id}: hit the improve cap (${MAX_ROUNDS}); ${actionable.length} item(s) remain — PR review/CI cover the rest`); break }
    round++
    log(`usterka #${u.id}: review round ${round} surfaced ${actionable.length} actionable improvement(s) — applying`)
    const improved = await agent(improvePrompt(u, branch, actionable, life.reproTest), { label: `improve:${u.id}:r${round}`, phase: 'Improve', schema: IMPROVE_SCHEMA, isolation: 'worktree' })
    if (!improved || !improved.applied) { outstanding = true; log(`usterka #${u.id}: improver applied nothing — stopping with items outstanding`); break }
    appliedRounds++
    // loop back to re-review the newly improved branch (terminates only on a clean review)
  }

  return {
    id: u.id, status: 'fixed', branch,
    classification: life.classification,
    summary: life.summary,
    reproTest: life.reproTest || '',
    filesChanged: life.filesChanged || [],
    validation: life.validation,
    appliedImproveRounds: appliedRounds,
    improvementsOutstanding: outstanding,
    reviewIncomplete: incomplete,
  }
}

// ---------------------------------------------------------------- driver
// pipeline: each usterka flows through both stages independently (no barrier) —
// worktree isolation lets them run in parallel without colliding, and the
// read-only review panel never touches the user's working tree.
const results = await pipeline(USTERKI, lifecycleStage, reviewAndPolish)
return results.map((r, i) => r || { id: (USTERKI[i] || {}).id, status: 'error', reason: 'stage threw' })
