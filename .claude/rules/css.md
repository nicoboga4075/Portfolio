---
paths:
  - "css/**/*.css"
---

# CSS

- Sizes in px, not rem or em.
- Never resize a heading with a class or a font-size to change its level: change its tag in the page.
- The site's own styles are `css/common.css`, `css/app.css` and `css/standalone.css`; the colours come from the variables of `css/common.css` (`--primary`, `--secondary`, `--accent-color`...), in light and dark mode.
- Never edit the vendored styles of `css/` (`owl.carousel.css` and the icon fonts `flaticon.css`, `icomoon.css`): they are replaced by a new download, with README.md updated (`update-docs` skill).
- Run `npm run lint:css` after a change. Run the WCAG contrast check (`wcag-contrast` skill) only when asked.
