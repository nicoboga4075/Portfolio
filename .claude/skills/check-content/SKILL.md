---
name: check-content
description: Checks that the portfolio's articles and projects are wired everywhere they must be - pages in English and French with the right permalink, _data/articles.json and _data/blog.json in the same order, _data/projects.json cards and appProjects (js/app.js) in the same order, package.json routes, card images, Lighthouse audits. Use it after adding, removing, renaming or reordering an article or a project (by hand or with new-article / new-project), after editing those data files, or when a blog card or an Explore button opens the wrong page.
---

# Check content

```
npm run check:content
```

That is `node .claude/skills/check-content/check-content.mjs`. It exits with code 1 and lists each error, 0 when everything is wired.

## What it checks

| Errors (exit 1) | Why it matters |
|---|---|
| `articles/<slug>_<lang>.html` or `projects/<slug>_<lang>.html` missing in a language, or its `permalink` not its own path | The language switch and the blog lead to a 404 |
| `_data/blog.json` and `_data/articles.json` of different lengths | Blog card n opens article n: one missing entry shifts every card after it |
| `_data/articles.json` not newest first | The blog's "recent publication" is the first one |
| `appProjects` (`js/app.js`) and the `_data/projects.json` cards of different lengths | The Explore button of card n opens `appProjects[n]` |
| An article or a project page missing from `package.json` `routes` | No sitemap entry, no redirect (`/en/<slug>` is a 404) |
| `appProjects` opening `blog#<slug>` with no such article | A dead Explore button |
| A blog or project card with no `images/<id>.avif` | An empty card |

It also prints, as notes, a project in `routes.projects` that no card opens, a project with no Lighthouse audit in `netlify.toml`, and the "card n → target" mapping of every blog and project card: read it after a change, a shifted list shows there even when the lengths match.

## What it does not check

- The content itself (a French page left in English, a wrong date in a card).
- Whether two lists of the same length are aligned on the right items: that is what the mapping lines are for.
- Article pictures inside the text (`<img class="article-image" id="x">` → `images/x.avif`).

## After a failure

Fix the cause, not the check: add the missing page or entry at the right position, then run it again until it prints "Articles and projects are wired". Run `npm run lint` after the fix.
