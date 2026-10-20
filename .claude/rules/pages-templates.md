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
- A heading level is changed with its tag (`h2` to `h3`), never with a `.h5`-style class or a CSS font-size.
- A new page needs its route in `config.appRoutes` of `package.json` (then `npm run gen:redirects`, never an edit of `_redirects`), its Lighthouse audit in `netlify.toml`, and its page in every language.
- A new article or project goes through the `new-article` or `new-project` skill, then `npm run check:content`.
- Run `npm run lint:html` after a change; html-validate reads the Nunjucks through `html-validate-nunjucks.js`.
