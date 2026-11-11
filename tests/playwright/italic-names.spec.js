// The companies, schools and other organizations of config.companies, config.schools and config.organizations in italics: in the plain texts of _data through the italicNames filter of .eleventy.js (soft skill experiences, hard and mad skill tooltips), and written in <i> in the articles.
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const { italicNames } = require('../../.eleventy');

const root = path.join(__dirname, '..', '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const { companies, schools, organizations } = JSON.parse(read('package.json')).config;
const names = [...companies, ...schools, ...organizations];

// The text of an article outside its front matter, its tags and what is already in italics: no company nor school may be left there
function plainCompanyMentions(html) {
    const body = html.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
    let italic = 0;
    const mentions = [];
    const pattern = new RegExp(String.raw`(?<![\p{L}\p{N}])(${names.join('|')})(?![\p{L}\p{N}])`, 'gu');
    for (const part of body.split(/(<[^>]+>)/)) {
        const tag = /^<(\/?)(i|em)\b/i.exec(part);
        if (tag) italic += tag[1] ? -1 : 1;
        else if (!part.startsWith('<') && !italic) mentions.push(...(part.match(pattern) ?? []));
    }
    return mentions;
}

test.describe('italic-names', () => {
    test('puts each company and school in italics, the longest name first, and leaves a name inside a word alone', () => {
        expect(italicNames('Code audit for Bassetti Group, then Bassetti again', ['Bassetti', 'Bassetti Group'])).toBe('Code audit for <i>Bassetti Group</i>, then <i>Bassetti</i> again');
        expect(italicNames('CGIs are not CGI', ['CGI'])).toBe('CGIs are not <i>CGI</i>');
        expect(italicNames('Formation pour la MNT et La Poste')).toBe('Formation pour la <i>MNT</i> et <i>La Poste</i>');
        expect(italicNames('Double diplôme ESILV-UQAC, prépa au lycée Janson de Sailly')).toBe('Double diplôme <i>ESILV</i>-<i>UQAC</i>, prépa au lycée <i>Janson de Sailly</i>');
        expect(italicNames('Tennis (US Dax), padel (ESILV, FFSU), Club EBIOS © ANSSI, Coursera, FIRST')).toBe('Tennis (<i>US Dax</i>), padel (<i>ESILV</i>, <i>FFSU</i>), <i>Club EBIOS</i> © <i>ANSSI</i>, <i>Coursera</i>, <i>FIRST</i>');
    });

    test('escapes the text first, so only its own italics are HTML', () => {
        expect(italicNames('Sources & <b>"GitHub"</b> at Astek', ['Astek'])).toBe('Sources &amp; &lt;b&gt;&quot;GitHub&quot;&lt;/b&gt; at <i>Astek</i>');
        expect(italicNames(undefined, ['Astek'])).toBe('');
    });

    test('is applied to the soft skill experiences and the hard and mad skill tooltips, which render their HTML', () => {
        expect(read('_includes/skills-soft.html')).toContain('{{ proof | italicNames | safe }}');
        // The certificates of a hard skill, who delivered each one in italics (Coursera, ANSSI)
        expect(read('_includes/skills-hard.html')).toContain('{{ d.text[lang] | italicNames | safe }}');
        const hard = read('_includes/skills-hard.html');
        expect(hard).toContain('data-html="true" title="{{ tip | italicNames }}"');
        // The name read by screen readers stays plain text
        expect(hard).toMatch(/aria-label="\{\{ label \}\}[^"]*\{\{ tip \}\}"/);
        expect(read('_includes/skills-mad.html')).toContain('data-html="true" title="{{ s.tip[lang] | italicNames }}"');
    });

    test('leaves no company nor school out of italics in the text of an article', () => {
        const articles = fs.readdirSync(path.join(root, 'articles')).filter(file => file.endsWith('.html'));
        for (const file of articles) {
            expect(plainCompanyMentions(read(`articles/${file}`)), file).toEqual([]);
        }
    });
});
