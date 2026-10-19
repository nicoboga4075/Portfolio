// The QR codes of the author card of the blog, from config.qrCodes of package.json: the entries, their images, and the cards _includes/blog-content.html renders from them, rendered alone with Nunjucks.
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const nunjucks = require('nunjucks');

const root = path.join(__dirname, '..', '..');
const template = fs.readFileSync(path.join(root, '_includes', 'blog-content.html'), 'utf8');
const blog = require(path.join(root, '_data', 'blog.json'));
const pkg = require(path.join(root, 'package.json'));

// Renders the include alone, the way Eleventy gives it its data
function render(qrCodes, fileSlug = 'blog') {
    const env = new nunjucks.Environment(null, { autoescape: true });
    return env.renderString(template, {
        page: { fileSlug },
        siteLanguages: { default: pkg.config.defaultLang },
        blog,
        author: 'Author',
        qrCodes
    });
}

test.describe('blog author card QR codes', () => {
    test('package.json lists each QR code with an id, a label and a link', () => {
        expect(pkg.config.qrCodes.length).toBeGreaterThan(0);
        for (const qr of pkg.config.qrCodes) {
            expect(qr.id).toBeTruthy();
            expect(qr.label).toBeTruthy();
            expect(qr.href).toMatch(/^https:\/\//);
        }
    });

    test('every listed QR code has its logo and QR code images', () => {
        for (const { id } of pkg.config.qrCodes) {
            expect(fs.existsSync(path.join(root, 'images', `logo-${id}.png`))).toBe(true);
            expect(fs.existsSync(path.join(root, 'images', `qrcode-${id}.png`))).toBe(true);
        }
    });

    test('renders one card per config.qrCodes entry, in order', () => {
        const html = render(pkg.config.qrCodes);
        expect(html.match(/class="qrcode-card"/g)).toHaveLength(pkg.config.qrCodes.length);
        let last = -1;
        for (const { id, label } of pkg.config.qrCodes) {
            expect(html).toContain(`src="images/logo-${id}.png"`);
            expect(html).toContain(`src="images/qrcode-${id}.png"`);
            expect(html).toContain(`alt="${label}"`);
            expect(html).toContain(`alt="${label} QR Code"`);
            const index = html.indexOf(`images/logo-${id}.png`);
            expect(index).toBeGreaterThan(last);
            last = index;
        }
    });

    test('a custom list is rendered as given', () => {
        const html = render([{ id: 'one', label: 'One' }]);
        expect(html.match(/class="qrcode-card"/g)).toHaveLength(1);
        expect(html).toContain('images/qrcode-one.png');
        expect(html).not.toContain('beacons');
    });

    test('an empty list renders no card', () => {
        const html = render([]);
        expect(html).toContain('class="qrcode-group"');
        expect(html).not.toContain('qrcode-card');
    });
});
