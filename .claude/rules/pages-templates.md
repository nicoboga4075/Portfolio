---
paths:
  - "*.html"
  - "_includes/**"
  - "articles/**"
  - "projects/**"
  - ".eleventy.js"
---

# Pages and templates

- Every page exists once per language, named `<name>_<lang>.html`, with its front matter; a partial of `_includes/` reads the language as `page.fileSlug.slice(-2)`.
- Never run `npm run build` nor plain `npx eleventy` to check a page: they compile the pages in place over their sources. Preview with `npm run dev` or `ELEVENTY_PREVIEW=1 npx eleventy` (output in `.eleventy/`); if a page was overwritten, `git checkout` it.
- A heading level is changed with its tag (`h2` to `h3`) to match the real outline: never a Bootstrap `.h4`/`.h5`/`.h6` class, an `aria-level` or a CSS font-size to keep the old look. Rename the CSS selectors that targeted the old tag, and say which headings get bigger. Check axe `heading-order` before and after scrolling: `.ftco-animate` elements stay hidden until scrolled into view.
- Never use the Bootstrap `.h1` to `.h6` classes, on a heading or any other element: a heading is an `h1` to `h6` tag of its real level, and a text that only needs to look bold or bigger uses the utility classes (`font-weight-bold`, `text-dark`...) or a class of its own.
- Every page uses `layout: base.njk`; its front matter holds `title`, `description`, `permalink` and the odd override (`assets`). Keep the `{%- -%}` whitespace control of the loops in `base.njk`, or the build leaves blank lines.
- A new page needs its route in `config.appRoutes` of `package.json` (then `npm run gen:redirects`, never an edit of `_redirects`), its Lighthouse audit in `netlify.toml`, and its page in every language.
- A new article or project goes through the `new-article` or `new-project` skill, then `npm run check:content`.
- Articles and projects stay in `.html`, not Markdown: Nunjucks already runs on the `.html` pages, their content needs the site markup (classes, ids, link attributes, `bien-pasbien-*` partials), and the `article` function, `check:content`, the `new-article` skill and html-validate all read `.html`; `.eleventy.js` only compiles `.html` so the repository Markdown docs never become pages.
- Run `npm run lint:html` after a change; html-validate reads the Nunjucks through `html-validate-nunjucks.js`.
- The certifications count of `_includes/index-counter.html` turns over like a soft skill card (`soft-card` classes, `initFlipCards` of `js/app.js`), from a question mark in its top right corner (`data-icons="icon-question-circle icon-close"`). Its back lists `certifList` of `_data/counter.json`, newest first: each certification after the logo of its body or exam (`logo`: `images/certifs/<logo>.png`, decorative, `alt=""`), linked to its certificate in `docs/public/`, who delivered it, its score, its level and its date. A level explains itself in a Bootstrap tooltip with `data-container="body" data-boundary="window"`: inside the turned, scrolling back, the default container and boundary place the tooltip over its level. The card keeps the size of the other counters (its back lies over its front and scrolls), so keep each line short. The work experiences count turns over the same way: each company after its logo (`logo` of the experience in `_data/resume.json`, `images/companies/<logo>.png`).
