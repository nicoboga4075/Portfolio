// The e-mail address of the author, hidden from address harvesters: never in clear in the HTML of the preview build, written encoded by the build and shown in clear by js/common.js once the page runs.
const fs = require('node:fs');
const path = require('node:path');
const { test, expect, data } = require('./site');

const email = data('package.json').author.email;
const built = path.join(__dirname, '..', '..', '.eleventy');

// Every HTML file of the preview build, the articles and project pages included
function builtPages(dir = built) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        const file = path.join(dir, entry.name);
        if (entry.isDirectory()) return ['css', 'js', 'images', 'docs', 'fonts'].includes(entry.name) ? [] : builtPages(file);
        return entry.name.endsWith('.html') ? [file] : [];
    });
}

test('no built page holds the address in clear', () => {
    const pages = builtPages();
    expect(pages.length).toBeGreaterThan(10);
    const leaking = pages.filter(file => fs.readFileSync(file, 'utf8').includes(email)).map(file => path.relative(built, file));
    expect(leaking).toEqual([]);
});

for (const url of ['/en', '/fr/policy', '/en/terms']) {
    test(`${url} shows the address in clear once the page runs`, async ({ page }) => {
        await page.goto(url);
        const spans = page.locator('.email-address');
        expect(await spans.count()).toBeGreaterThan(0);
        for (const text of await spans.allTextContents()) expect(text).toBe(email);
    });
}
