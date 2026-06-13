---
name: commit
description: Utwórz commit git w tym repo z wymuszoną tożsamością autora i commitera "Lukasz Centkowski <centkowski.lukasz03@gmail.com>". Użyj, gdy użytkownik prosi o zrobienie commita (np. "/commit", "zrób commita").
---

# commit — commit z poprawną tożsamością

Tworzy commit, w którym **autor i committer** to zawsze:

```
Lukasz Centkowski <centkowski.lukasz03@gmail.com>
```

Tożsamość ustawiana jest **per-commit** przez flagi `-c` — bez zmiany globalnej
ani lokalnej konfiguracji git (`git config` NIE jest modyfikowane).

## Procedura

1. Sprawdź stan i historię, aby dobrać zakres i styl wiadomości:
   ```bash
   git status --short
   git diff --staged
   git log --oneline -5
   ```
2. Zastanów się, co należy objąć commitem. Dodaj **konkretne pliki po nazwie**
   (`git add <plik>`), nie używaj `git add -A` / `git add .`. Nie commituj plików
   z sekretami (`.env`, credentiale) — ostrzeż użytkownika, jeśli o to prosi.
3. Utwórz commit z wymuszoną tożsamością. **Zawsze** używaj obu flag `-c`:

   ```bash
   git -c user.name="Lukasz Centkowski" \
       -c user.email="centkowski.lukasz03@gmail.com" \
       commit -m "$(cat <<'EOF'
   <krótka wiadomość po polsku — dlaczego, nie tylko co>

   Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
   EOF
   )"
   ```
4. Zweryfikuj wynik:
   ```bash
   git log -1 --pretty=format:'%an <%ae> | committer: %cn <%ce>%n%s'
   ```
   Oba pola (autor i committer) muszą pokazywać `Lukasz Centkowski <centkowski.lukasz03@gmail.com>`.

## Zasady

- **Nigdy** nie rób `git config --global` ani `git config` zmieniającego trwale tożsamość — tożsamość ustawiamy wyłącznie per-commit przez `-c`.
- Twórz **nowy** commit; nie używaj `--amend`, chyba że użytkownik wyraźnie poprosi.
- Nie używaj `--no-verify` — jeśli hook padnie, napraw przyczynę i zacommituj ponownie.
- Nie pushuj — chyba że użytkownik wyraźnie o to poprosi.
- Wiadomości commitów pisz po polsku, zgodnie z konwencją repo.
</content>
