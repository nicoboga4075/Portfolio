---
name: new-project
description: Adds a project to the portfolio - its card in _data/projects.json, its target in appProjects (js/app.js, same position), and for a project with its own page the two pages in projects/, the slug in package.json routes.projects, the redirects and the Lighthouse audits - then checks the wiring with npm run check:content and lints. Use it when the user asks to add, create or showcase a project, a realisation or a case study.
---

# New project

A project is a card in the home page's Projects section. Its **Explore** button opens one of three things:

- its own page, `/en/<slug>` (the usual case: `projects/<slug>_en.html` and `_fr.html`);
- an article of the blog, `blog#<article-slug>`;
- an external URL.

The card and its target are linked **by position**: card n opens `appProjects[n]`. Follow every step.

## 1. Gather

Ask for what is missing, in one message:

- the **title** (HTML allowed: the client's name in `<i>`), a short **badge** (main technology: `C#`, `HTML/CSS/JS`), the **technologies** (main ones in `<b>`);
- the **context** in English and in French, in the existing shape: `"<Contract> at <i>Company</i> | <how> | <duration>"` / `"<Contrat> chez <i>Entreprise</i> | <comment> | <durée>"`;
- a one-line **description** in both languages, and optionally a **note** (shown under it);
- where Explore goes (own page, article or URL), and for an own page: the **slug** (lowercase, `_` or `-`, no accent) and its **content** in both languages;
- the **position** among the cards (default: last, as the cards run from the oldest project to the newest);
- the **card picture** (`images/<card id>.avif`) and, if any, a **video** with its subtitles.

Don't invent the project's content: write only what the user gave or asked for.

## 2. The card and its target, at the same position

- `_data/projects.json` `cards`: `{ "id": "<card image name>", "title": "...", "badge": "...", "context": { "en", "fr" }, "description": { "en", "fr" }, "technologies": "..." }`, plus `"heading": { "en", "fr" }` when the title differs per language, `"note": { "en", "fr" }` if any.
- `js/app.js` `appProjects`: the target **at the same index**: `'<slug>'`, `'blog#<article-slug>'` or `'https://...'`.

Keep each file's formatting: edit, don't rewrite the file.

## 3. The pages (own page only)

`projects/<slug>_en.html` and `projects/<slug>_fr.html`, same structure in both:

```html
---
permalink: "projects/<slug>_en.html"
title: "Portfolio - <title without HTML>"
description: "<title without HTML>"
---
<article>
    <div class="read-title">
        <h1>🖥️ <title></h1>
        {% include "dark-mode.html" %}
        {% include "language-switcher.html" %}
    </div>
    <p><strong><one sentence: what, for whom, how long, with whom></strong> ...</p>
    <h2>📝 Presentation</h2>
    <p>...</p>
    <h2>🛠️ Technologies used</h2>
    <ul>
        <li><strong>...</strong></li>
    </ul>
    <h2>🗂️ Application structure</h2>
    <ul>
        <li>🏠 <strong>...</strong>: ...</li>
    </ul>
    <h2>📈 Usage</h2>
    <p>...</p>
</article>
<a id="index">Go back to the homepage</a>
```

- French page: `permalink: "projects/<slug>_fr.html"`, headings `📝 Présentation`, `🛠️ Technologies utilisées`, `🗂️ Structure de l’application`, `📈 Utilisation`, and `<a id="index">Retour à l'accueil</a>`.
- A video goes right after the title block, as in `projects/ebatisoft_en.html`: `<div class="video-wrapper"><video controls>` with its `<source>` in `docs/public/` and one `<track>` per language.
- A client's copyright line ends the article: `<hr>` then `<p>©Company 2024</p>`.

## 4. Routes, redirects, audits

- Add the slug to `routes.projects` in `package.json`, then run `npm run gen:redirects` (it writes `/en/<slug>` and `/fr/<slug>` into `_redirects`).
- Add two Lighthouse audits to `netlify.toml`, like the others: `url = "https://nicoboga.netlify.app"` with `path = "en/<slug>"`, and the same with `fr/<slug>`.
- Put the card picture at `images/<card id>.avif`. Ask the user for the file; don't create a placeholder.
- The "Delivered projects" counter is `projectsCount` in `js/common.js`: ask before changing it.

## 5. Check

1. `npm run check:content` (the check-content skill): no error. Read the "project card n → target" lines: the new card must open the new target, and the cards after it must still open theirs.
2. `npm run lint`: no error, no warning.
3. Show it with `npm run dev`: the card on `/en` and `/fr`, its Explore button, and `/en/<slug>`, `/fr/<slug>`.

A colour or a new style rule also needs `npm run contrast:quick`, but only when the user asks for it.
