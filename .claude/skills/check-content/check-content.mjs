#!/usr/bin/env node
// Checks that articles and projects are wired everywhere they must be: pages in every language, data entries in the same order, routes, images, Lighthouse audits.
// Usage: npm run check:content (exit 1 on an error; warnings are printed but don't fail)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const exists = file => fs.existsSync(path.join(ROOT, file));
const json = file => JSON.parse(read(file));

const routes = json('package.json').routes;
const langs = Object.keys(routes.locales);
const articles = json('_data/articles.json');
const blog = json('_data/blog.json');
const cards = json('_data/projects.json').cards;
const toml = read('netlify.toml');
const appProjectsBlock = read('js/app.js').match(/const appProjects = \[([\s\S]*?)\];/);
const appProjects = appProjectsBlock ? [...appProjectsBlock[1].matchAll(/'([^']+)'/g)].map(m => m[1]) : null;

const errors = [];
const warnings = [];

// A page exists in every language and its front matter permalink points at itself.
function checkPages(folder, slug) {
    for (const lang of langs) {
        const file = `${folder}/${slug}_${lang}.html`;
        if (!exists(file)) {
            errors.push(`${file} is missing`);
        } else if (!read(file).includes(`permalink: "${file}"`)) {
            errors.push(`${file}: its front matter permalink must be "${file}"`);
        }
    }
}

// ---- Articles ----
for (const { slug } of articles) {
    checkPages('articles', slug);
    if (!routes.articles.includes(slug)) errors.push(`article "${slug}" is not in package.json routes.articles`);
}
for (const slug of routes.articles) {
    if (!articles.some(a => a.slug === slug)) errors.push(`routes.articles lists "${slug}", which is not in _data/articles.json`);
}
// The blog section links card n to article n: both lists must line up.
if (blog.entries.length !== articles.length) {
    errors.push(`_data/blog.json has ${blog.entries.length} entries but _data/articles.json has ${articles.length}: the home page links blog card n to article n`);
}
blog.entries.forEach((entry, i) => {
    if (!exists(`images/${entry.id}.avif`)) errors.push(`blog card "${entry.id}" has no images/${entry.id}.avif`);
    if (articles[i]) warnings.push(`blog card ${i + 1} "${entry.title.en}" → article "${articles[i].slug}"`);
});
const dates = articles.map(a => a.date);
if (dates.some((d, i) => i && d > dates[i - 1])) {
    errors.push('_data/articles.json must be sorted newest first (the blog shows the first one as the most recent)');
}

// ---- Projects ----
if (!appProjects) {
    errors.push('js/app.js: const appProjects = [...] not found');
} else {
    // The Explore button of card n opens appProjects[n].
    if (appProjects.length !== cards.length) {
        errors.push(`js/app.js appProjects has ${appProjects.length} entries but _data/projects.json has ${cards.length} cards: the Explore button of card n opens appProjects[n]`);
    }
    cards.forEach((card, i) => warnings.push(`project card ${i + 1} "${card.title.replace(/<[^<>]+>/g, '')}" → ${appProjects[i] ?? '(nothing)'}`));
    for (const target of appProjects.filter(t => !/(?:^https?:)|[#/]/.test(t))) {
        checkPages('projects', target);
        if (!routes.projects.includes(target)) errors.push(`project "${target}" is not in package.json routes.projects`);
    }
    for (const target of appProjects.filter(t => t.startsWith('blog#'))) {
        if (!articles.some(a => a.slug === target.slice(5))) errors.push(`appProjects opens "${target}", which is not an article`);
    }
}
for (const slug of routes.projects) {
    checkPages('projects', slug);
    if (appProjects && !appProjects.includes(slug)) warnings.push(`routes.projects has "${slug}", which no project card opens`);
    for (const lang of langs) {
        if (!toml.includes(`path = "${lang}/${slug}"`)) warnings.push(`netlify.toml has no Lighthouse audit for ${lang}/${slug}`);
    }
}
for (const card of cards) {
    if (!exists(`images/${card.id}.avif`)) errors.push(`project card "${card.id}" has no images/${card.id}.avif`);
}

for (const w of new Set(warnings)) console.log(`  ${w}`);
// A page is checked from both its card and its route: report each problem once.
const unique = [...new Set(errors)];
if (unique.length) {
    console.error(`\n${unique.length} error(s):`);
    for (const e of unique) console.error(`  ✖ ${e}`);
    process.exit(1);
}
console.log(`\nArticles and projects are wired: ${articles.length} articles, ${cards.length} project cards.`);
