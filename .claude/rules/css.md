---
paths:
  - "css/**/*.css"
---

# CSS

- Sizes in px, not rem or em.
- Never resize a heading with a class or a font-size to change its level: change its tag in the page.
- Where each file loads: `css/common.css` on every page; `css/bootstrap.min.css` and `css/app.css` on the home and blog pages only; `css/standalone.css` on the light pages (policy, terms, 404, articles, projects), and on the blog page once an article is injected. A rule used by one page family goes in its own file, not in `common.css`; the styles of article content live only in `standalone.css`, never duplicated in `app.css`.
- Bootstrap is not loaded on the light pages: a partial shared by both kinds of page must not rely on Bootstrap classes (`d-flex`, `row`, `col-*`) for anything that matters, and the light pages re-implement what they need (`.card`, `.badge`, `.accordion`) in `standalone.css`.
- `css/bootstrap.min.css` is a customised build that also holds site rules (`.contact-section .box .icon`): grep it too before calling a class or id unused.
- Before moving or deleting a selector, check every page type in the built output (`.eleventy/`, preview build), not only the sources; a class may also be added at runtime by a plugin (`.owl-item`, `.owl-nav`).
- The colours come from the variables of `css/common.css` (`--primary`, `--secondary`, `--accent-color`...), in light and dark mode.
- Never edit the vendored styles of `css/` (`owl.carousel.css` and the icon fonts `flaticon.css`, `icomoon.css`): they are replaced by a new download, with README.md updated (`update-docs` skill).
- Run `npm run lint:css` after a change. Run the WCAG contrast check (`wcag-contrast` skill) only when asked: after a colour change, say it hasn't been run.
