// The two FFT icons of the resume (an experience and an award, both svgId "fft" of _data/resume.json) get the unique ids fft--1 and fft--2 from _includes/index-resume.html, styled by the one rule of css/app.css and given images/fft.svg by loadImages.
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..', '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test.describe('FFT icon ids of the resume', () => {
    test('the template suffixes the svgId of the experiences with --1 and of the awards with --2', () => {
        const template = read('_includes/index-resume.html');
        expect(template).toContain('<div id="{{ e.svgId }}--1" class="icon svg');
        expect(template).toContain('<div id="{{ a.svgId }}--2" class="icon svg');
        expect(template).not.toMatch(/id="\{\{ (e|a)\.svgId \}\}"/);
    });

    test('resume.json shares the svgId fft between an experience and an award, whose image exists', () => {
        const resume = JSON.parse(read('_data/resume.json'));
        const ids = JSON.stringify(resume).match(/"svgId":\s*"fft"/g) || [];
        expect(ids.length).toBeGreaterThanOrEqual(2);
        expect(fs.existsSync(path.join(root, 'images', 'fft.svg'))).toBe(true);
    });

    test('the stylesheet styles every id that starts with fft-- and no longer the bare #fft', () => {
        const css = read('css/app.css');
        const rule = css.match(/\.resume-wrap \.icon\[id\^="fft--"\]\s*\{([^}]*)\}/);
        expect(rule).not.toBeNull();
        expect(rule[1]).toContain('background-size: 30px;');
        expect(css).not.toMatch(/^#fft\s*\{/m);
    });

    test('html-validate accepts the --<number> ids', () => {
        expect(read('.htmlvalidate.json')).toContain('--');
    });
});
