---
paths:
  - "_data/**/*.json"
---

# Data and translations

- Every text is keyed by language (`{ "en": ..., "fr": ... }`, or one block per language) with the same shape in every language: same keys, types and list lengths, never empty in one language only. The translation hook checks each edited file; run `npm run check:translation` after a change.
- Templates read a text as `x[lang]`, never `x.en` or `x.fr`.
- `_data/articles.json` and `_data/blog.json` list the articles in the same order; each card of `_data/projects.json` has an `explore` target (an external `https://` URL, a project page id or `blog#<slug>`). Run `npm run check:content` after any change of these files, or use the `new-article` and `new-project` skills.
- Skills (`new-skill` skill), each with its image `images/<key>.png`, square on a transparent background:
  - hard skills: `{ key, label }` in the list at the top of `_includes/skills-hard.html`, not in `_data`; the label is the name of the tool or language, one string, not translated;
  - soft skills: `soft` of `_data/skills.json`, `{ key, en, fr, proof: { en: [...], fr: [...] } }`, two to four short lines of experiences per language, the same number in both, taken from the CVs or `resume.json`, never made up; every card takes the height of the longest back, so keep the lines short;
  - mad skills: `mad` of `_data/skills.json`, `{ key, en, fr }`;
  - the tooltips of the three tabs: `carousel` of `_data/skills.json` (`hardTip`, `softTip`, `madTip`).
- The profile figures, routes, locales, socials and service URLs live in `config` of `package.json`, not in `_data`.
- A text with HTML (`<i>`, `<a>`) is rendered with `| safe`: keep it free of anything that comes from visitors.
