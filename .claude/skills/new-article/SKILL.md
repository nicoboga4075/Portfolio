---
name: new-article
description: Adds a blog article to the portfolio in English and French - its two pages in articles/, its entry in _data/articles.json, its card in _data/blog.json (same position), its slug in package.json routes.articles and its images - then checks the wiring with npm run check:content and lints. Use it when the user asks to add, write, publish or create an article, a blog post or a post.
---

# New article

An article is shown inside the blog page, never on its own: `/en/blog#<slug>` loads `articles/<slug>_en.html` through the article function. It is wired in five places, and two of them are linked **by position**, so follow every step.

## 1. Gather

Ask for what is missing, in one message:

- the **slug** (lowercase, hyphens, no accent: `my-first-article`);
- the **title** in English and in French, and the **date** (`YYYY-MM-DD`);
- the **text** in both languages, or the text in one language to translate;
- a **card picture** (or reuse an existing name in `images/`), a **read time**, a one-paragraph **excerpt** in both languages, and **tags**.

Don't invent the article's content: write only what the user gave or asked for.

## 2. The two pages

`articles/<slug>_en.html` and `articles/<slug>_fr.html`, same structure in both:

```html
---
permalink: "articles/<slug>_en.html"
title: "Portfolio - <title>"
description: "<title>"
---
<article class="article-container">
    <h1><title></h1>
    <div class="article-intro"><one or two sentences></div>
    <p>...</p>
    <img id="<image-id>" class="article-image" alt="<what the picture shows>" width="<w>" height="<h>">
    <h2>...</h2>
    <p>...</p>
</article>
```

- `permalink` must be the file's own path (`articles/<slug>_fr.html` in the French one).
- An `<img class="article-image" id="x">` gets `images/x.avif` (no `src`: the blog sets it). Give it its real `width` and `height`. A picture that needs a size of its own gets a rule `#x { ... }` in `css/standalone.css`.
- External links: `<a target="_blank" rel="noopener" href="https://...">`. A link to another article: `<a article-link="<other-slug>">`.
- Use `<b>`, `<i>`, `<ul>`, `<h2>` like the existing articles; one `<h1>` only.

## 3. The data, in the same position

The list is **newest first**: an article dated after all the others goes **first** in both files.

- `_data/articles.json`: `{ "slug": "<slug>", "title": { "en": "...", "fr": "..." }, "date": "YYYY-MM-DD", "tags": [...] }`. A tag is a string, `{ "en": "...", "fr": "..." }`, `{ "<label>": "<url>" }` or `{ "name": { "en", "fr" }, "url": "..." }`.
- `_data/blog.json` `entries`: `{ "id": "<card image name>", "title": { "en", "fr" }, "date": { "en": "January 2, 2026", "fr": "2 Janvier 2026" }, "readTime": "4 min", "excerpt": { "en", "fr" } }`, **at the same index** as in `articles.json`: the home page links blog card n to article n.

Keep each file's formatting (one entry per line block, 4-space indent): edit, don't rewrite the file.

## 4. Route and images

- Add the slug to `routes.articles` in `package.json` (the sitemap is built from it).
- Put the card picture at `images/<card id>.avif` and every article picture at `images/<image-id>.avif`. Ask the user for the files; don't create placeholder images.
- Optional: a Lighthouse audit in `netlify.toml`, like the existing ones (`path = ".netlify/functions/article?filename=<slug>_en.html"`).

## 5. Check

1. `npm run check:content` (the check-content skill): no error. Read the "blog card n → article" lines: the new card must open the new article.
2. `npm run lint`: no error, no warning.
3. Show it: `/en/blog#<slug>` and `/fr/blog#<slug>` with `npm run dev`, and the card on the home page.

A colour or a new style rule also needs `npm run contrast:quick`, but only when the user asks for it.
