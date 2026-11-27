// forgetChangedModules() of .eleventy.js, which deletes the project modules from require.cache before a watch build, by their real keys (backslashes on Windows), so the config reset Eleventy does when .eleventy.js or a file it requires changes loads them again: tested on a fake cache, without Eleventy.
const { test, expect } = require('@playwright/test');
const path = require('node:path');
const { forgetChangedModules } = require('../../.eleventy');

const root = path.resolve(path.sep, 'site');
const key = (...parts) => path.join(root, ...parts);

// A require.cache with the config, one of its helpers and a package
function fakeCache() {
    return { [key('.eleventy.js')]: {}, [key('articles', 'resolve-articles.js')]: {}, [key('node_modules', 'prettier', 'index.cjs')]: {} };
}

test('a changed config or helper deletes every project module, by its real key, and keeps the packages', () => {
    for (const changed of ['./.eleventy.js', './articles/resolve-articles.js']) {
        const cache = fakeCache();
        forgetChangedModules([changed], cache, root);
        expect(Object.keys(cache)).toEqual([key('node_modules', 'prettier', 'index.cjs')]);
    }
});

test('a change to a page or a file never required leaves the cache alone', () => {
    const cache = fakeCache();
    forgetChangedModules(['./index_en.html', './js/app.js'], cache, root);
    expect(Object.keys(cache)).toHaveLength(3);
});
