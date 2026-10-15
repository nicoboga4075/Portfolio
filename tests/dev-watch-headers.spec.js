// headersFor() of dev-watch.js, which gives the public documents dev-watch.js serves locally the headers _headers sets on them: tested without a browser, against temporary _headers files.
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { headersFor } = require('../dev-watch');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dev-watch-headers-'));
let files = 0;

// The headers that a _headers file with this content sets on a path.
function rulesOf(content) {
    const file = path.join(dir, `_headers_${files++}`);
    fs.writeFileSync(file, content);
    return pathname => headersFor(pathname, file);
}

test.describe('headersFor', () => {
    // A pure Node test: one browser project is enough.
    test.skip(({ browserName }) => browserName !== 'chromium');

    test.afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

    test('gives every path the headers of /*', () => {
        const forPath = rulesOf('/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n');
        expect(forPath('/docs/public/CV_en.pdf')).toEqual({ 'x-content-type-options': 'nosniff', 'referrer-policy': 'strict-origin-when-cross-origin' });
    });

    test('lets the longer pattern win a header two rules set', () => {
        const forPath = rulesOf('/docs/public/*\n  X-Robots-Tag: all\n/docs/*\n  X-Robots-Tag: noindex, nofollow\n');
        expect(forPath('/docs/public/CV_en.pdf')['x-robots-tag']).toBe('all');
        expect(forPath('/docs/private.pdf')['x-robots-tag']).toBe('noindex, nofollow');
    });

    test('matches :name on one segment only', () => {
        const forPath = rulesOf('/docs/:file\n  X-Robots-Tag: noindex\n');
        expect(forPath('/docs/a.pdf')).toEqual({ 'x-robots-tag': 'noindex' });
        expect(forPath('/docs/public/a.pdf')).toEqual({});
    });

    test('takes a pattern literally apart from * and :name', () => {
        const forPath = rulesOf('/feed_en.xml\n  Cache-Control: no-cache\n');
        expect(forPath('/feed_en.xml')).toEqual({ 'cache-control': 'no-cache' });
        expect(forPath('/feed_enxxml')).toEqual({});
    });

    test('skips comments and blank lines, and reads CRLF line endings', () => {
        const forPath = rulesOf('# a comment\r\n\r\n/*\r\n  # an indented comment\r\n  Cache-Control: no-cache\r\n');
        expect(forPath('/index.html')).toEqual({ 'cache-control': 'no-cache' });
    });

    test('keeps the colons of a value', () => {
        const forPath = rulesOf("/*\n  Content-Security-Policy: default-src 'self' https://example.com\n");
        expect(forPath('/')['content-security-policy']).toBe("default-src 'self' https://example.com");
    });

    test('gives nothing to a path no rule matches', () => {
        expect(rulesOf('/api/*\n  X-Robots-Tag: noindex\n')('/docs/public/CV_en.pdf')).toEqual({});
    });

    test('reads the real _headers by default: CSP and an indexable /docs/public', () => {
        const headers = headersFor('/docs/public/CV_en.pdf');
        expect(headers['content-security-policy']).toContain("default-src 'self'");
        expect(headers['x-robots-tag']).toBe('all');
    });
});
