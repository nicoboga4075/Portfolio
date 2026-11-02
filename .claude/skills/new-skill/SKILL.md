---
name: new-skill
description: Adds a skill to the portfolio - a hard skill (a tool or a language of the skills carousel), a soft skill (a card of the carousel that unlocks the experiences behind it), a mad skill (a passion) or a skill card of the resume section - with its image and its texts in English and French, then checks the translations and the cards. Use it when the user asks to add, rename, reorder or remove a skill, a soft skill, a hard skill, a mad skill, a tool, a language, a technology or a skill card, or to change the experiences that prove a soft skill, even if they don't say "skill".
argument-hint: "[hard|soft|mad|card] [details]"
arguments: [kind]
metadata:
  category: Code Scaffolding & Templates
---

# New skill

The skills of the home page live in two places: the carousel of `_includes/index-carousel.html` (three tabs: hard, soft and mad skills) and the skill cards of the resume section (`_includes/index-resume.html`). Every text shown is in English and French; a name that doesn't change (a tool, a language) is one string.

## Arguments

`/new-skill <kind> <details>`, for example `/new-skill soft Problem solving: preparatory classes, chess, software maintenance` or `/new-skill hard Kotlin`.

- Kind: `$kind` (`hard`, `soft`, `mad` or `card`); when it is empty or another word, tell it from the details or ask.
- Everything typed: `$ARGUMENTS`. Take every field it gives, in the language it is written in, and translate it for the other language.

## 1. Gather

Ask only for what the arguments don't give, in one message, and don't invent any of it: a soft skill is only worth its experiences, so never make one up.

| Kind | Where | Fields |
|---|---|---|
| Hard skill | the `hardSkills` list at the top of `_includes/skills-hard.html` | `key` (its image is `images/<key>.png`), `label` (one string, the name of the tool or language, or `{ en, fr }` for a method such as the V model), optionally `certificate`: the path of its certificate in `docs/public/`, spaces written `%20` (`/docs/public/Certificat%20FIGMA.pdf`) |
| Soft skill | `soft` of `_data/skills.json` | `key` (kebab-case, its image is `images/<key>.png`), the name per language (`en`, `fr`), `proof`: the experiences that prove it, a list per language, one short line each (`"Customer support at Soft Concept"` / `"Support client chez Soft Concept"`) |
| Mad skill | `mad` of `_data/skills.json` | `key` (its image is `images/<key>.png`), the name per language |
| Skill card | `cards` of `_data/skills.json` | `id` (its image is `images/<id>.avif`), `title` (one, or one per language), `href` (a page that explains the subject, one or per language), `item1` and `item2` (the two tools shown under it, one string or one per language) |

Take the experiences of a soft skill from the CVs (`docs/public/CV_en.pdf` and `CV_fr.pdf`, their "Assets" section), `_data/resume.json` and the project pages, then let the user choose: propose lines, never write one they can't defend in an interview.

## 2. Write the entry

- Same shape as its neighbours, in the order the user wants (a soft skill next to the ones it is closest to). French text uses French punctuation (`Échecs : ...`), English text English punctuation.
- A soft skill has two to four lines of `proof` per language, the same number in both, each line short: the cards all take the height of the longest back, so one long list makes every card taller. Keep one experience in one card when possible, rather than the same line in several.
- The image:
  - hard, soft and mad skills: `images/<key>.png`, square, transparent background, in the flat colourful style of the others (512 × 512 is enough). No image fits: draw an SVG with the colours of `:root` in `css/common.css` (`--blue`, `--orange`, `--yellow`...), render it to PNG (Playwright `screenshot` with `omitBackground: true`), look at it, then add it;
  - skill card: `images/<id>.avif`, like the other cards (`loadImages('.blog-img', 'avif')` of `js/app.js` loads it).
- The controls sit in the top right corner, never on the name: no skill has its label or logo as a link.
  - hard skill: it may have a corner icon, only when it has a `certificate`: a PDF icon in the top right corner of its slide is then its only link, to the certificate in a new tab, named "<label> : Attestation (PDF)" for screen readers (`carousel.docLinkLabel`); check the PDF exists and is meant to be public before linking it;
  - soft skill: it always has both, a card (its front: image and name; its back: the experiences of `proof`) and a padlock in the top right corner of the card, its only control (`_includes/skills-soft.html`, `initFlipCards` of `js/app.js`), which turns the card over and back; the label and the image stay plain text;
  - mad skill: never a corner icon (a hard skill may have one, a soft skill always does), no card and no link: its image and its name only.
- A new text of the carousel (a tab, a tooltip) goes in `carousel` of `_data/skills.json`, in both languages.
- The skill cards come in rows of three (`batch(3)`): a tenth card starts a row of one, so say so and ask whether to add two more or drop one.

## 3. Check

```
npm run check:translation
npx playwright test tests/playwright/soft-skills.spec.js
npm run lint
```

`check:translation` checks every text exists in both languages with the same shape (the same number of `proof` lines), the spec checks every soft skill card shows its name, its image and its experiences. Then look at the carousel of `/en` and `/fr` (`run-portfolio` skill): the new image, the label on one or two lines, and for a soft skill the card unlocked, every card the same height and its padlock at the top.
