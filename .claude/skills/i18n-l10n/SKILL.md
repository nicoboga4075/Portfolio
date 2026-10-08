---
name: translation
description: Checks the translation (i18n) and localisation (l10n) of the portfolio in English and French - every text of _data/*.json in every language with the same shape (keys, types, list lengths, none empty on one side only), every page in every language, no template locked to one language ({{ x.en }} instead of x[lang]), every getMessage('key') of js/ in _data/messages.json, then the built pages (html lang, language switcher links, text left in the other language, dates in the other language, undefined / [object Object] / NaN shown to visitors). Use it after adding or editing a text in _data, a page, an include or a translation, after adding a language or a getMessage() call, when a French page shows English (or the reverse), or when asked to check, audit or fix the translations, i18n or l10n.
---

# Translation (i18n / l10n)

```
npm run check:translation
```

That is `node .claude/skills/i18n-l10n/check-translation.mjs`. It rebuilds the site into `.eleventy` (`ELEVENTY_PREVIEW=1`, sources untouched), exits with code 1 and lists each error, 0 when the translations are complete. `npm run check:translation -- --no-build` reuses the last build (only when nothing changed since).

The languages are the keys of `routes.locales` in `package.json`: adding one there makes the check require it everywhere.

## How the site is translated

- **Texts**: `_data/*.json`, as an object with a key per language, either at the root (`hero.json`: `{ "en": {...}, "fr": {...} }`) or field by field (`contact.json`: `"title": { "en": "...", "fr": "..." }`). Templates read them with `[lang]`, where `lang` is the page's `_en` / `_fr` suffix.
- **Pages**: one source per language, `<name>_<lang>.html`, at the root, in `articles/` and in `projects/`.
- **Runtime messages**: `_data/messages.json`, embedded by `base.njk` into `<meta name="i18n-messages">` and read by i18next through `getMessage('key')` in `js/app.js`.

## What it checks

| Errors (exit 1) | Why it matters |
|---|---|
| A `_data` object with some languages and not the others (`{ "en": "..." }` alone) | The other page shows nothing, or the default language |
| Two versions with different keys, types or list lengths, or a text empty on one side only | A missing field, card or list item in one language |
| `<name>_<lang>.html` missing in a language | The language switcher leads to a 404 |
| `{{ x.en }}`, `{{ x['fr'] }}` in a page or an include | The same language on every page |
| `getMessage('key')` with no `key` in `_data/messages.json` | i18next shows the raw key to visitors |
| A built page whose `<html lang>` is not its language | Screen readers read it with the wrong voice, search engines index it in the wrong language |
| A language switcher link that does not open the same page in the other language | The visitor lands on another page |
| `undefined`, `[object Object]` or `NaN` in a visible text | A value missing from the data or a template |
| A language with no `hreflang` alternate in the built `sitemap.xml` | Search engines don't link the pages of that language to their translations |

| Warnings | What to do |
|---|---|
| A text written in the other language in a built page (detected by its function words: the / of / and, le / des / et) | Translate it, or wrap it in an element with `lang="en"` (`lang="fr"`) when it is meant to stay in that language: a name, a quote, an acronym spelled out. The check then leaves it alone, and screen readers pronounce it right |
| The same sentence in both languages in `_data` | It was copied and not translated |
| The same `title` / `description` sentence in both versions of a page | Same: front matter left untranslated |
| A date with a month of the other language (`3 March` in a French page) | Format the date for the page's language |
| An empty `aria-label` or `title` | A missing translation, or an attribute to remove |

The other-language and date warnings only know the languages listed in `FUNCTION_WORDS` and `MONTHS` at the top of `check-translation.mjs`: a new language needs its entries there (see the new-language skill).

## What it does not check

- The quality of a translation, or a text translated into the wrong meaning.
- Texts too short to tell their language (a label, a name, a list of technologies): a French word left in an English button passes.
- Text inside code (`<pre>`, `<code>`, `.lang-code`), scripts, or anything marked `translate="no"`.
- Texts built in the browser (`js/app.js` string literals not going through `getMessage()`).
- `_data/messages.json` keys only built dynamically: they are listed as a note, not an error.

## After a failure

Fix the cause, not the check: add the missing language in the `_data` object (same keys, same order of list items), the missing page, or read the text with `[lang]`. For a warning on a text meant to stay in the other language, mark it with `lang` rather than leaving it. Run it again until it prints "Translations are complete", then `npm run lint`. When a page changed, `npm run check:content` checks that it is still wired.
