// parseRange() and servePartial() of dev-watch.js, which answer the byte ranges of the public documents locally (the static server of netlify dev ignores Range, so a video couldn't be sought): tested without a browser, on a temporary file and a stand-in response.
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { Writable } = require('node:stream');
const { parseRange, servePartial } = require('../../dev-watch');

// A response stream that keeps its status, its headers and its body, with a promise that resolves once it ends
function fakeResponse() {
    const chunks = [];
    const res = new Writable({
        write(chunk, _encoding, callback) {
            chunks.push(chunk);
            callback();
        }
    });
    res.writeHead = (status, headers) => Object.assign(res, { status, headers });
    res.body = () => Buffer.concat(chunks).toString();
    res.finished = new Promise(resolve => res.on('finish', resolve));
    return res;
}

test.describe('parseRange', () => {
    test('reads a start and an end, a start alone and a suffix, clamped to the file', () => {
        expect(parseRange('bytes=0-9', 100)).toEqual({ start: 0, end: 9 });
        expect(parseRange('bytes=90-', 100)).toEqual({ start: 90, end: 99 });
        expect(parseRange('bytes=-10', 100)).toEqual({ start: 90, end: 99 });
        expect(parseRange('bytes=-500', 100)).toEqual({ start: 0, end: 99 });
        expect(parseRange('bytes=50-500', 100)).toEqual({ start: 50, end: 99 });
    });

    test('refuses another unit, several ranges, an empty range and a start past the end', () => {
        for (const header of ['items=0-9', 'bytes=0-9,20-29', 'bytes=-', 'bytes=100-', 'bytes=9-0']) {
            expect(parseRange(header, 100)).toBeNull();
        }
    });
});

test.describe('servePartial', () => {
    let dir;
    let file;

    test.beforeAll(() => {
        dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dev-watch-range-'));
        file = path.join(dir, 'video.mp4');
        fs.writeFileSync(file, '0123456789abcdefghij');
    });

    test.afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

    test('answers 206 with the bytes asked, their Content-Range and the headers of _headers', async () => {
        const res = fakeResponse();
        servePartial(file, 'bytes=10-14', 'GET', res, { 'cache-control': 'public' }, () => {});
        await res.finished;
        expect(res.status).toBe(206);
        expect(res.headers).toMatchObject({ 'content-type': 'video/mp4', 'content-length': 5, 'content-range': 'bytes 10-14/20', 'accept-ranges': 'bytes', 'cache-control': 'public' });
        expect(res.body()).toBe('abcde');
    });

    test('sends no body to HEAD, and 416 for a range past the end', async () => {
        const head = fakeResponse();
        servePartial(file, 'bytes=0-', 'HEAD', head, {}, () => {});
        await head.finished;
        expect(head.status).toBe(206);
        expect(head.body()).toBe('');

        const outside = fakeResponse();
        servePartial(file, 'bytes=50-', 'GET', outside, {}, () => {});
        await outside.finished;
        expect(outside.status).toBe(416);
        expect(outside.headers['content-range']).toBe('bytes */20');
    });

    test('hands the request on when the file is not there', async () => {
        const next = await new Promise(resolve => servePartial(path.join(dir, 'missing.mp4'), 'bytes=0-1', 'GET', fakeResponse(), {}, () => resolve(true)));
        expect(next).toBe(true);
    });
});
