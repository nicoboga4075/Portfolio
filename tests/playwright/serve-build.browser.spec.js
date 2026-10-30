const { test, expect } = require('./site');

test.describe('serve-build redirects', () => {
    test('the root redirects to the English home like on Netlify', async ({ request }) => {
        const response = await request.get('/', { maxRedirects: 0 });
        expect(response.status()).toBe(301);
        expect(response.headers().location).toBe('/en');
    });

    test('a page with a 200 rewrite is still served', async ({ request }) => {
        const response = await request.get('/fr', { maxRedirects: 0 });
        expect(response.status()).toBe(200);
    });
});
