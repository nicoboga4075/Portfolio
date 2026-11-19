import { Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { createHash } from "node:crypto";
import { jsonResponse } from "./http.mjs";

// The calls of one visitor in the current window, kept in Netlify Blobs so they count across the instances of a function
type WindowCount = { window: number; count: number };

const WINDOW_MS = 60_000;
// The reads and writes one call may try before it gives up, each lost to another call of the same visitor written in between
const MAX_TRIES = 5;

// The 429 a visitor gets past the limit of a function, with the seconds to wait before the next window
export function tooManyRequests(): Response {
    const retryAfter = Math.ceil((WINDOW_MS - (Date.now() % WINDOW_MS)) / 1000);
    return jsonResponse({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(retryAfter) } });
}

// The calls already counted in the current window from the entry Blobs holds, which may be missing, from an older window or without one of its keys
function storedCount(data: Partial<WindowCount> | null | undefined, window: number): number {
    // No entry yet, or a value that is not an object
    if (typeof data !== "object" || data === null) {
        return 0;
    }
    // No window key, or an older window: this call starts a new one
    if (data.window !== window) {
        return 0;
    }
    // No count key, or a count that is not a whole number of calls
    if (typeof data.count !== "number" || !Number.isInteger(data.count) || data.count < 0) {
        return 0;
    }
    return data.count;
}

// The condition of the write of a count: only over the entry read (its ETag), or only if there is still none; an entry read without its ETag, as the local Blobs server of netlify dev returns (its GET sends no ETag header, so an onlyIfNew write would always fail and limit every call), is written without a condition, a burst then able to lose a count
function writeCondition(entry: { etag?: string } | null): { onlyIfMatch: string } | { onlyIfNew: true } | Record<string, never> {
    // No entry yet
    if (!entry) {
        return { onlyIfNew: true };
    }
    // An entry with its ETag, as Netlify Blobs returns in production
    if (entry.etag) {
        return { onlyIfMatch: entry.etag };
    }
    return {};
}

// Whether the visitor of this request has already made `limit` calls to the function `name` in the current minute, counting this call otherwise: a function keeps its default address /.netlify/functions/<name>, which the rate limit of a Netlify config cannot (it needs a path of its own); the IP is stored hashed, never in clear, and Blobs failing lets the call through rather than blocking every visitor
export async function isRateLimited(name: string, limit: number, context: Context): Promise<boolean> {
    try {
        const store = getStore({ name: "rate-limits", consistency: "strong" });
        const key = `${name}/${createHash("sha256").update(context.ip).digest("hex")}`;
        const window = Math.floor(Date.now() / WINDOW_MS);
        // Calls at the same time read the same count: each write only goes through if the entry is still the one it read (its ETag, or no entry yet), else the call reads again, so a burst cannot overwrite its own counts
        for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
            const entry = await store.getWithMetadata(key, { type: "json" });
            const count = storedCount(entry?.data, window);
            if (count >= limit) {
                return true;
            }
            const condition = writeCondition(entry);
            const { modified } = await store.setJSON(key, { window, count: count + 1 } satisfies WindowCount, condition);
            if (modified) {
                return false;
            }
        }
        // Still beaten by other calls of the same visitor after every try: a burst that busy is past the limit anyway
        return true;
    } catch (error) {
        console.warn(`[${context.requestId}] Rate limit of ${name} not checked`, error);
        return false;
    }
}
