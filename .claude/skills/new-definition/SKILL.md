---
name: new-definition
description: Adds a definition or a comparison ("A vs B") to the "Du voc de dev" article (articles/du-voc-de-dev_en.html and _fr.html) - a card of its "To go further" accordion in English and French with the next number and one or more badges (Dev, Web, Network / Réseau, Cyber, AI / IA, Cloud, C#, SQL, DevOps...) - after checking the term is not there yet, then checks both languages stay aligned. Use it when the user asks to add, define, explain, compare, fix or remove a term, an acronym, a concept or a "vs" in the dev vocabulary article, the glossary or the "voc de dev", even if they don't name the article.
argument-hint: "<term or A vs B> [badges] [what it should say]"
metadata:
  category: Code Scaffolding & Templates
---

# New definition

The article "Du voc de dev" (slug `du-voc-de-dev`) ends with a glossary: the accordion after "Pour aller plus loin..." / "To go further...", one card per term, the same cards in `articles/du-voc-de-dev_en.html` and `articles/du-voc-de-dev_fr.html`. A comparison is a card like the others, its term written `A vs B`.

## Arguments

`/new-definition <term> [badges] [details]`, for example `/new-definition Rebase vs Merge Git DevOps` or `/new-definition SBOM Cyber DevOps`.

Everything typed: `$ARGUMENTS`. Take the term, the badges and any wording it gives, in the language it is written in, and write the other language from it.

## 1. Check it is new

```
node .claude/skills/new-definition/check-definitions.mjs --find <word>
```

It lists, in every language, the cards whose term holds the word (one search per side of a "vs", in English and in French). When the term or a close one is there, show it and ask whether to complete that card instead of adding one. Run it without `--find` too: it must say the definitions are aligned before you add anything, else fix what it reports first.

## 2. Write the card

Add it at the end of the accordion of both files, after the last card (the script prints its number): the cards follow the order they were added in, not the alphabet, and their ids run `q1` to `qN` with no gap. Same markup as its neighbours, four spaces per level:

```html
        <div class="card">
            <input type="checkbox" id="q329">
            <div class="card-header">
                <label for="q329">Rebase vs Merge</label>
                <span class="badge badge-definition">Git</span>
                <span class="badge badge-definition">DevOps</span>
            </div>
            <div class="card-body">...</div>
        </div>
```

- The term: as it is used in the trade, the same in both languages when it is (an acronym, a command, a product name), translated when it is a common word ("Shallow copy vs Deep copy" / "Copie superficielle vs Copie profonde"). An acronym is spelled out once in the text, with its French meaning after "ou" in the French card, or after a comma when "ou" reads badly, never after a semicolon ("WCAG (Web Content Accessibility Guidelines ou règles pour l'accessibilité des contenus web)"); only a proper name keeps its English expansion alone (a company, a product, a project: AMD, Android App Bundle, OWASP).
- The badges: at least one, each a span of its own after the label, the main field first, then every other field or language the term clearly belongs to (Docker vs Kubernetes: DevOps, then Cloud); reuse those the script lists, the same in both files and in the same order, with their French names in the French file (AI / IA, Network / Réseau, Hardware / Matériel, Data / Données, System / Système, Software / Logiciel, the names of `BADGE_NAMES` in the script). A new badge needs the user's go-ahead, and its French name, when it has one, goes in `BADGE_NAMES`.
- The text: one paragraph, no list, no title. A definition starts by what the term is, then how it is used and a concrete example; a comparison says what both share, then what sets them apart, then when to pick which. Facts only, checked against the official docs when they are recent or versioned (a version number, a standard, a limit): never invent one. Plain text, as the other cards: `<b>` and `<i>` only, and `&lt;` `&gt;` for a placeholder (`git worktree add &lt;path&gt;`). French text uses French punctuation (space before `:` and `;`, `’` or `'` as the neighbours), English text English punctuation.
- Both cards say the same thing, neither a word-for-word translation nor one longer than the other.
- To fix a card, change it in both files; to remove one, remove it from both and renumber the ids after it (`id` and `for`), since the script wants no gap.

## 3. Check

```
node .claude/skills/new-definition/check-definitions.mjs
npm run lint:html
```

The script must say the definitions are aligned, with the new count and the new last term. Then open the article on the local site (`run-portfolio` skill, `/en/blog#du-voc-de-dev` and `/fr/blog#du-voc-de-dev`) and expand the new card in both languages: its term, its badges and its text, on a phone width too.
