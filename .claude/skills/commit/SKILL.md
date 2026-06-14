---
name: commit
description: Create a git commit in this repo with the author and committer identity forced to "Lukasz Centkowski <centkowski.lukasz03@gmail.com>". Use when the user asks to make a commit (e.g. "/commit", "make a commit").
---

# commit — commit with the correct identity

Creates a commit in which the **author and committer** are always:

```
Lukasz Centkowski <centkowski.lukasz03@gmail.com>
```

The identity is set **per-commit** via the `-c` flags — without changing the global
or local git configuration (`git config` is NOT modified).

## Procedure

1. Check the state and history to choose the scope and message style:
   ```bash
   git status --short
   git diff --staged
   git log --oneline -5
   ```
2. Consider what the commit should cover. Add **specific files by name**
   (`git add <file>`), do not use `git add -A` / `git add .`. Do not commit files
   with secrets (`.env`, credentials) — warn the user if they ask for it.
3. Create the commit with the forced identity. **Always** use both `-c` flags:

   ```bash
   git -c user.name="Lukasz Centkowski" \
       -c user.email="centkowski.lukasz03@gmail.com" \
       commit -m "$(cat <<'EOF'
   <short message in English — why, not just what>

   Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
   EOF
   )"
   ```
4. Verify the result:
   ```bash
   git log -1 --pretty=format:'%an <%ae> | committer: %cn <%ce>%n%s'
   ```
   Both fields (author and committer) must show `Lukasz Centkowski <centkowski.lukasz03@gmail.com>`.

## Rules

- **Never** run `git config --global` or any `git config` that permanently changes the identity — the identity is set exclusively per-commit via `-c`.
- Create a **new** commit; do not use `--amend` unless the user explicitly asks.
- Do not use `--no-verify` — if a hook fails, fix the cause and commit again.
- Do not push — unless the user explicitly asks for it.
- Write commit messages in English, following the repo convention.
