---
paths:
  - "_data/**/*.json"
---

# Data and translations

- Every text is keyed by language (`{ "en": ..., "fr": ... }`, or one block per language) with the same shape in every language: same keys, types and list lengths, never empty in one language only. The translation hook checks each edited file; run `npm run check:translation` after a change.
- Templates read a text as `x[lang]`, never `x.en` or `x.fr`.
- `_data/articles.json` and `_data/blog.json` list the articles in the same order; each card of `_data/projects.json` has an `explore` target (an external `https://` URL, a project page id or `blog#<slug>`). Run `npm run check:content` after any change of these files, or use the `new-article` and `new-project` skills.
- The profile figures, routes, locales, socials and service URLs live in `config` of `package.json`, not in `_data`.
- A text with HTML (`<i>`, `<a>`) is rendered with `| safe`: keep it free of anything that comes from visitors.
