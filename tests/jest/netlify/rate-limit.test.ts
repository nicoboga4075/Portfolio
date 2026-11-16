// Unit tests of netlify/functions/shared/rate-limit.mts: the calls of each visitor counted per minute in Netlify Blobs (an in-memory store here), a 429 past the limit, the IP stored hashed, and Blobs failing letting the call through.
const blobs = new Map<string, unknown>();
const store = { get: jest.fn(async (key: string) => blobs.get(key) ?? null), setJSON: jest.fn(async (key: string, value: unknown) => void blobs.set(key, value)) };
// Above the imports, which the TypeScript transform does not hoist it over
jest.mock("@netlify/blobs", () => ({ getStore: jest.fn(() => store) }));
import { getStore } from "@netlify/blobs";
import { isRateLimited, tooManyRequests } from "../../../netlify/functions/shared/rate-limit.mjs";

const context = (ip = "203.0.113.7") => ({ ip, requestId: "req-1" }) as any;

beforeEach(() => {
    blobs.clear();
    jest.useFakeTimers({ now: new Date("2026-11-16T10:00:15Z") });
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
    store.get.mockRejectedValueOnce(new Error("blobs down"));
    expect(await isRateLimited("visit", 1, context())).toBe(false);
    expect(warn).toHaveBeenCalledWith("[req-1] Rate limit of visit not checked", expect.any(Error));
});

test("answers a 429 with the seconds left in the minute", async () => {
    const response = tooManyRequests();
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("45");
    expect(await response.json()).toEqual({ error: "Too many requests" });
});
