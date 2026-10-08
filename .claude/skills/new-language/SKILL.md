---
name: new-language
description: Adds a language to the portfolio (Spanish, German, Italian...) next to English and French - its routes.locales entry in package.json, its version of every text in _data/*.json, its page for every page (home, blog, policy, terms, every project and article), its entries in the translation check, optionally its CV and Lighthouse audits - then checks everything with npm run check:translation, check:content and lint. Use it when the user asks to add, support or translate the site into a new language or locale, or to remove one.
---

# New language

The site has one page per language (`index_en.html`, `index_fr.html`...) and one version per language of every text in `_data`. The language list is the keys of `routes.locales` in `package.json`: the redirects, the sitemap and its `hreflang` alternates, the language switcher, i18next and every check read it, so adding a key there is what makes a language exist. Everything else is translation work, and `npm run check:translation` lists it.

## 1. Gather

Ask for what is missing, in one message:

- the **language code**: two lowercase letters, ISO 639-1 (`es`, `de`, `it`, `pt`). A regional code (`pt-BR`) is not supported: the routes (`js/common.js`), the article and env functions and the templates (`suffix.length == 2`) expect two letters;
- the **locale** for `routes.locales` (`es_ES`, `de_DE`);
- who **translates**: the user, or Claude with the user reviewing. Claude may translate the site's own texts; say clearly that the result needs a review by a speaker of the language before it goes live;
- whether a **CV** exists in that language (`docs/public/CV_<code>.pdf`).

`defaultLang` (the `/` redirect and `x-default`) and `authorLang` don't change unless the user asks.

## 2. Register the language

In `package.json` `routes.locales`, add `"<code>": "<locale>"` after the existing ones: the order of the keys is the order of the language switcher.

From here on, `npm run check:translation` fails until the language is complete: that is expected, it is the to-do list.

## 3. The texts in `_data`

```
npm run check:translation -- --no-build
```

Each error `<file>.<path>: has "en", "fr" but not "<code>"` is a text to translate (about 210 of them). In each, add `"<code>": ...` after the last language, with **the same shape** as the others: same keys, same number of list items in the same order, same HTML tags and `&quot;` entities.

- **Edit, don't rewrite** the files: half of them keep entries on one line, and `JSON.stringify` would reformat them. Insert the new key next to the existing ones, one file at a time.
- **Localise, not only translate**:
  - dates in the language's format (`_data/blog.json` `date`: `"January 2, 2026"`, `"2 Janvier 2026"`);
  - a link per language when the target exists in it (`_data/skills.json` `href`);
  - the runtime messages in `_data/messages.json` (i18next);
  - typography: `_includes/index-projects.html` and `_includes/tools-softconcept.html` put a space before `:` only for `fr`; extend the condition if the new language needs it.
- Names, brands and technologies stay as they are.

## 4. The pages

Each page needs its `<name>_<code>.html` next to the others, made from the English (or French) one:

- the root pages of `routes.sections` and the home: `index`, `blog`, `policy`, `terms`;
- `projects/<slug>_<code>.html` for every `routes.projects`;
- `articles/<slug>_<code>.html` for every `routes.articles`.

In each copy:

- `permalink` is the file's own path (`projects/panel_mnt_es.html`);
- `title` and `description` are translated;
- the visible text, `alt`, `title` and `aria-label` are translated; code samples (`.lang-code`, `<pre>`, `<code>`) stay as they are;
- a phrase meant to stay in another language gets `lang="<that code>"` on its element.

`npm run check:content` then confirms every article and project exists in every language.

## 5. The translation check

At the top of `.claude/skills/i18n-l10n/check-translation.mjs`, add the language to:

- `FUNCTION_WORDS`: about twenty short words only that language uses (`el`, `los`, `las`, `y`, `para`, `con`, `una`, `del`... for `es`), avoiding words the other languages share;
- `MONTHS`: the twelve month names, lower case.

Without them, the check still requires every text and page, but can't spot a text left in that language elsewhere, or a date written in it.

## 6. Optional

- **CV**: `docs/public/CV_<code>.pdf` and the code in `routes.cvLangs`. Without it, the env function serves `routes.cvDefaultLang`.
- **Lighthouse audits** in `netlify.toml`: copy the `[[plugins.inputs.audits]]` blocks of `en` (`path = "en"`, `"en/blog"`, the projects, the articles) with the new code.
- The **404 page** (`404.html`) is a single page in English for every language: leave it.

## 7. Check

```
npm run gen:redirects
npm run check:translation
npm run check:content
npm run lint
```

- `check:translation` rebuilds the site: 0 error, then read the warnings (a text left in another language, the same sentence in two languages).
- `_redirects` and `sitemap.xml` are generated: commit the regenerated files, don't edit them by hand.
- Open `/<code>`, `/<code>/blog` and a project with `npm run dev`, and switch languages with the switcher on each.
- Offer `npm run contrast:quick` (longer texts can wrap differently), but run it only if the user agrees.

The new-article and new-project skills say "English and French": with a third language, each new article or project needs its page and its texts in it too, and `check:translation` will say so.

## Removing a language

The reverse: remove its key from `routes.locales` (and `routes.cvLangs`), delete its `*_<code>.html` pages, then remove its `"<code>"` keys from `_data` (`check:translation` doesn't report extra languages: search for `"<code>":`). Never remove `defaultLang` or `authorLang` without changing them first: `.eleventy.js` refuses to build.
