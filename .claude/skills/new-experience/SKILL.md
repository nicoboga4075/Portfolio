---
name: new-experience
description: Adds a work experience, an education, a certification or a trip to the portfolio - its entry in _data/resume.json in English and French with its icon or logo, then asks which figures of config.profile in package.json to raise (permanent jobs, internships, experiences, years of activity, certifications, projects, visited countries), the CVs and the job search status - then checks the translations and the links. Use it when the user asks to add, update or remove a job, a contract, an internship, a mission, a degree, a school, a certificate, a test score, an award or a country visited, or to update the resume, the CV or the counters of the home page, even if they don't say "experience".
argument-hint: "[experience|education|certification|trip] [details]"
arguments: [kind]
metadata:
  category: Code Scaffolding & Templates
---

# New experience

The resume section of the home page (`_includes/index-resume.html`) reads `_data/resume.json`; the counters (`_includes/index-counter.html`), the about section, the skills chart and the presentation article read the figures of `config.profile` in `package.json`. The figures are set by hand and never counted from the entries: the user decides each one.

## Arguments

`/new-experience <kind> <details>`, for example `/new-experience experience Software Engineer at Acme, Paris, permanent, since March 2027` or `/new-experience trip Japan`.

- Kind: `$kind` (`experience`, `education`, `certification` or `trip`); when it is empty or another word, tell it from the details or ask.
- Everything typed: `$ARGUMENTS`. Take every field it gives, in the language it is written in, and translate it for the other language.

## 1. Gather

Ask only for what the arguments don't give, in one message, and don't invent any of it.

| Kind | Entry of `resume.json` | Fields |
|---|---|---|
| Work experience | `experiences` | `date` per language (`"December 2025 - August 2026"` / `"Décembre 2025 - Août 2026"`), `title` per language, `company`, `href` (one URL or one per language, optional), `city`, `type` (`permanent`, `internship` or `other`), `sector` (tags: a string, or one text per language), `companyType` (a key of `companyTypes`), `companySize`, an `icon` (icomoon class `icon-*`) or a `svgId` (`images/<svgId>.svg`), optionally `mission`, `missionCompany`, `missionHref` (a mission at a client), and `current: true` for the job held today |
| Education | `education` | `id` (its logo is `images/<id>.png`), `date` (`"2020 - 2021"`), `title` per language, `school`, `href`, `place` (`"(City, CCC)"`) |
| Certification, test, award | `awards` | `date` per language, `title` (one, or one per language), `score`, `detail` (optional, one or per language), an `icon` or a `svgId`; the certificate itself in `docs/public/` if it is published, named like the others and well under 50 MB |
| Trip | none | No entry: only the figures (step 3) |

For a new job, also ask whether the previous one is still `current`, whether the job search status changes (`config.profile.openToWork`: `true`, `"listening"` or `false`) and whether its city goes in `config.authorCities` (the cities the article search suggests).

## 2. Write the entry

- Same shape as its neighbours: a text shown in both languages is `{ "en": ..., "fr": ... }`, a name or a URL that doesn't change is one string. French months take a capital (`Août`), English text uses English punctuation.
- Place it by its start date, newest first, in `experiences` and `education`; in `awards`, next to the entries of its kind.
- A new `companyType` or `type` needs its label in `resume.json` `en.companyTypes` and `fr.companyTypes` (or `types`).
- A new icon: an `icon-*` class already used in the file, or a new `images/<svgId>.svg` (or `images/<id>.png` for a school logo), added with the entry.
- Moving `current: true` to the new job removes it from the previous one.

## 3. Ask about the figures

Show the current figures of `config.profile` in `package.json`, then ask in one message, for each one, whether to raise it and by how much; never change one without the user's answer, and never deduce it from the entries.

| Figure | Shown as |
|---|---|
| `cdiCount` | Permanent jobs (presentation article) |
| `internshipsCount` | Internships (presentation article) |
| `experiencesCount` | "Work experiences" counter |
| `xp` | Years of activity (about section, skills chart, presentation article) |
| `certifsCount` | "Certifications" counter |
| `projectsCount` | "Delivered projects" counter |
| `countriesCount` | "Visited countries" counter: ask it for a trip, and for an experience or an education abroad |

Write the answers in `config.profile` of `package.json`.

## 4. CVs and texts

- The CVs `docs/public/CV_en.pdf` and `CV_fr.pdf` are made by the user: remind them to replace both. The site shows the date of their last commit (the `env` function reads it from the GitHub API).
- `articles/presentation_en.html` and `_fr.html` tell the career: the figures update by themselves, but a new job may call for a sentence there; ask before writing one, in both languages.

## 5. Check

```
npm run check:translation
npm run check:links
```

`check:translation` checks the new entry has every text in every language, `check:links` (only if a URL was added) its links. Then look at the resume section and the counters of `/en` and `/fr` (`run-portfolio` skill) when the entry has a new icon or logo.
