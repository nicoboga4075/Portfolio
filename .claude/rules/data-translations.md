---
paths:
  - "_data/**/*.json"
---

# Data and translations

- Every text is keyed by language (`{ "en": ..., "fr": ... }`, or one block per language) with the same shape in every language: same keys, types and list lengths, never empty in one language only. The translation hook checks each edited file; run `npm run check:translation` after a change.
- Templates read a text as `x[lang]`, never `x.en` or `x.fr`.
- `_data/articles.json` and `_data/blog.json` list the articles in the same order; each card of `_data/projects.json` has an `explore` target (an external `https://` URL, a project page id or `blog#<slug>`). Run `npm run check:content` after any change of these files, or use the `new-article` and `new-project` skills.
- Skills (`new-skill` skill), each with its image `images/<key>.png`, square on a transparent background:
  - hard skills: `{ key, label }` in the `hardSkills` list at the top of `_includes/skills-hard.html`, not in `_data`; the label is the name of the tool or language, one string, or `{ en, fr }` for a method (`Cycle en V`); an optional `doc` (the file name of a certificate in `docs/public/`) adds a PDF icon linking to it, a line in `hardTips` of `_data/skills.json` (by key, in both languages) a question mark with its tooltip, a list in `hardDocs` (by key, `{ name, text, doc }`) a PDF icon opening their popover; an optional `categories` (`["frontend"]`: frontend, backend, devops, tests, ide, cyber, methodology, tools, git or automation, keys of `hardCategories` in `carousel` of `_data/skills.json`) puts it under those filters above the carousel, none under All only;
  - soft skills: `soft` of `_data/skills.json`, `{ key, en, fr, proof: { en: [...], fr: [...] } }`, two to four short lines of experiences per language, the same number in both, taken from the CVs or `resume.json`, never made up; every card takes the height of the longest back, so keep the lines short;
  - mad skills: `mad` of `_data/skills.json`, `{ key, en, fr }`;
  - the tooltips of the three tabs: `carousel` of `_data/skills.json` (`hardTip`, `softTip`, `madTip`).
- The profile figures, routes, locales, socials and service URLs live in `config` of `package.json`, not in `_data`.
- No HTML in `_data`: a text is plain text, and what it needs in bold, in italics, as a link or as an icon goes in the structure the template marks up (a mission line `{ label, href, text }` of `resume.json`, the `parts` of a detail line of `languages.json`: `{ text }`, `{ highlight }` (bold), `{ term }` (italics), `{ icon, label }`, named by what they mean, never by an HTML tag), never in the text; the template escapes it, without `| safe`. A few older texts still hold HTML (`<i>` in `projects.json`) and are rendered with `| safe` until they are converted the same way.
