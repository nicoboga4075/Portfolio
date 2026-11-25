#!/usr/bin/env node
// Checks the definitions of the "Du voc de dev" article (articles/du-voc-de-dev_<lang>.html, the cards of its "To go further" accordion): every language has the same entries, numbered q1 to qN in order with no gap, each with at least one badge and the same badges in the same order, and no term twice in a language.
// Usage: node .claude/skills/new-definition/check-definitions.mjs [--find <term>] (with --find, lists the entries whose term holds it, in every language, before adding one)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const SLUG = 'du-voc-de-dev';
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
// The languages of the site, the keys of config.locales; English and French without that key
const langs = Object.keys(pkg.config?.locales ?? { en: '', fr: '' });
// A badge named differently in a language, by its English name; every other badge keeps its name in every language
const BADGE_NAMES = { AI: { fr: 'IA' }, Network: { fr: 'Réseau' }, Hardware: { fr: 'Matériel' }, Data: { fr: 'Données' }, System: { fr: 'Système' }, Software: { fr: 'Logiciel' } };

// The cards of the accordion of one language, in their order: the number of their id, their term and their badges, in their order
function entriesOf(lang) {
    const html = fs.readFileSync(path.join(ROOT, 'articles', `${SLUG}_${lang}.html`), 'utf8');
    const cards = html.split('<div class="card">').slice(1);
    return cards.map(card => ({
        id: Number(card.match(/<input type="checkbox" id="q(\d+)">/)?.[1] ?? Number.NaN),
        term: card.match(/<label for="q\d+">([^<]*)<\/label>/)?.[1].trim() ?? '',
        badges: [...card.matchAll(/<span class="badge badge-definition">([^<]*)<\/span>/g)].map(match => match[1].trim())
    }));
}

// The English name of a badge of a language, so the badges of two languages compare
function badgeKey(badge, lang) {
    const entry = Object.entries(BADGE_NAMES).find(([, names]) => names[lang] === badge);
    return entry ? entry[0] : badge;
}

const byLang = Object.fromEntries(langs.map(lang => [lang, entriesOf(lang)]));
const findIndex = process.argv.indexOf('--find');

// --find: the entries whose term holds the word, with their number, in every language
if (findIndex !== -1) {
    const word = (process.argv[findIndex + 1] ?? '').toLowerCase();
    if (!word) {
        console.error('Usage: check-definitions.mjs --find <term>');
        process.exit(1);
    }
    for (const lang of langs) {
        const found = byLang[lang].filter(entry => entry.term.toLowerCase().includes(word));
        console.log(`${lang}: ${found.length ? found.map(entry => `q${entry.id} ${entry.term} [${entry.badges.join(', ')}]`).join(' | ') : 'none'}`);
    }
    process.exit(0);
}

const problems = [];
for (const lang of langs) {
    const entries = byLang[lang];
    // Numbered q1, q2... in the order of the page, with no gap and no repeat
    entries.forEach((entry, index) => {
        if (entry.id !== index + 1) {
            problems.push(`${lang}: card ${index + 1} ("${entry.term}") has the id q${entry.id}, expected q${index + 1}`);
        }
        if (!entry.term) {
            problems.push(`${lang}: q${entry.id} has no term`);
        }
        // Every definition has at least one badge, each one once
        if (!entry.badges.length) {
            problems.push(`${lang}: q${entry.id} ("${entry.term}") has no badge`);
        }
        if (new Set(entry.badges).size !== entry.badges.length) {
            problems.push(`${lang}: q${entry.id} ("${entry.term}") has a badge twice`);
        }
    });
    // The same term twice in a language
    const seen = new Map();
    for (const entry of entries) {
        const key = entry.term.toLowerCase();
        if (seen.has(key)) {
            problems.push(`${lang}: "${entry.term}" is both q${seen.get(key)} and q${entry.id}`);
        }
        seen.set(key, entry.id);
    }
}

// Every language against the first one: the same number of entries and the same badges on each, in the same order
const [first, ...others] = langs;
for (const lang of others) {
    if (byLang[lang].length !== byLang[first].length) {
        problems.push(`${lang} has ${byLang[lang].length} entries, ${first} ${byLang[first].length}`);
    }
    byLang[first].forEach((entry, index) => {
        const other = byLang[lang][index];
        if (other && other.badges.map(badge => badgeKey(badge, lang)).join() !== entry.badges.map(badge => badgeKey(badge, first)).join()) {
            problems.push(`q${entry.id}: badges "${entry.badges.join(', ')}" in ${first} ("${entry.term}"), "${other.badges.join(', ')}" in ${lang} ("${other.term}")`);
        }
    });
}

if (problems.length) {
    console.error(`${problems.length} problem(s) in the definitions of ${SLUG}:\n${problems.map(problem => `- ${problem}`).join('\n')}`);
    process.exit(1);
}
const badges = [...new Set(byLang[first].flatMap(entry => entry.badges))].join(', ');
console.log(`Definitions of ${SLUG} are aligned: ${byLang[first].length} entries in ${langs.join(' / ')}, last q${byLang[first].length} "${byLang[first].at(-1)?.term}"; badges: ${badges}`);
