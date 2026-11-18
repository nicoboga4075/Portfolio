// Unit tests of netlify/functions/shared/rate-limit.mts: the calls of each visitor counted per minute in Netlify Blobs (an in-memory store here, with the ETags and conditional writes of Blobs), a 429 past the limit, a burst of calls at the same time counted in full, the IP stored hashed, and Blobs failing letting the call through.
type Entry = { data: unknown; etag: string };
const blobs = new Map<string, Entry>();
let version = 0;
// A pause before each answer, as over the network, so calls at the same time read before any of them writes
const tick = (): Promise<void> => new Promise(resolve => setImmediate(resolve));
const store = {
    getWithMetadata: jest.fn(async (key: string) => {
        await tick();
        const entry = blobs.get(key);
        return entry ? { data: entry.data, etag: entry.etag, metadata: {} } : null;
    }),
    // Blobs writes only if the entry is still the one read (onlyIfMatch) or does not exist yet (onlyIfNew), and says whether it wrote
    setJSON: jest.fn(async (key: string, data: unknown, options: { onlyIfMatch?: string; onlyIfNew?: boolean } = {}) => {
        await tick();
        const current = blobs.get(key);
        if ((options.onlyIfNew && current) || (options.onlyIfMatch && current?.etag !== options.onlyIfMatch)) {
            return { modified: false };
        }
        const etag = `"${++version}"`;
        blobs.set(key, { data, etag });
        return { modified: true, etag };
    })
};
// Above the imports, which the TypeScript transform does not hoist it over
jest.mock("@netlify/blobs", () => ({ getStore: jest.fn(() => store) }));
import { getStore } from "@netlify/blobs";
import { isRateLimited, tooManyRequests } from "../../../netlify/functions/shared/rate-limit.mjs";

const context = (ip = "203.0.113.7") => ({ ip, requestId: "req-1" }) as any;
const NOW = new Date("2026-11-16T10:00:15Z");

beforeEach(() => {
    blobs.clear();
    jest.clearAllMocks();
    version = 0;
    jest.useFakeTimers({ now: NOW, doNotFake: ["setImmediate"] });
});

afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
});

test("lets a visitor make the limit of calls in a minute, then limits the next one", async () => {
    for (let call = 0; call < 3; call++) expect(await isRateLimited("visit", 3, context())).toBe(false);
    expect(await isRateLimited("visit", 3, context())).toBe(true);
    expect(getStore).toHaveBeenCalledWith({ name: "rate-limits", consistency: "strong" });
});

test("counts every call of a burst at the same time, none overwriting another", async () => {
    const answers = await Promise.all(Array.from({ length: 4 }, () => isRateLimited("env", 10, context())));
    expect(answers).toEqual([false, false, false, false]);
    expect(blobs.get([...blobs.keys()][0])?.data).toEqual({ window: Math.floor(NOW.getTime() / 60_000), count: 4 });
});

test("writes the first count only if no other call created it, then only over the entry it read", async () => {
    await isRateLimited("visit", 5, context());
    await isRateLimited("visit", 5, context());
    expect(store.setJSON.mock.calls[0][2]).toEqual({ onlyIfNew: true });
    expect(store.setJSON.mock.calls[1][2]).toEqual({ onlyIfMatch: '"1"' });
});

test("limits a call still beaten by other calls after every try", async () => {
    for (let attempt = 0; attempt < 5; attempt++) store.setJSON.mockResolvedValueOnce({ modified: false });
    expect(await isRateLimited("visit", 10, context())).toBe(true);
    expect(store.setJSON).toHaveBeenCalledTimes(5);
});

test("counts each visitor and each function on its own", async () => {
    expect(await isRateLimited("visit", 1, context())).toBe(false);
    expect(await isRateLimited("visit", 1, context("198.51.100.1"))).toBe(false);
    expect(await isRateLimited("env", 1, context())).toBe(false);
    expect(await isRateLimited("visit", 1, context())).toBe(true);
});

test("starts again at the next minute", async () => {
    expect(await isRateLimited("visit", 1, context())).toBe(false);
    expect(await isRateLimited("visit", 1, context())).toBe(true);
    jest.setSystemTime(new Date("2026-11-16T10:01:00Z"));
    expect(await isRateLimited("visit", 1, context())).toBe(false);
});

test("stores the IP hashed, never in clear", async () => {
    await isRateLimited("visit", 5, context());
    const [key] = blobs.keys();
    expect(key).toMatch(/^visit\/[0-9a-f]{64}$/);
    expect(key).not.toContain("203.0.113.7");
});

test("lets the call through with a warning when Blobs fails", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    store.getWithMetadata.mockRejectedValueOnce(new Error("blobs down"));
    expect(await isRateLimited("visit", 1, context())).toBe(false);
    expect(warn).toHaveBeenCalledWith("[req-1] Rate limit of visit not checked", expect.any(Error));
});

test("answers a 429 with the seconds left in the minute", async () => {
    const response = tooManyRequests();
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("45");
    expect(await response.json()).toEqual({ error: "Too many requests" });
});
