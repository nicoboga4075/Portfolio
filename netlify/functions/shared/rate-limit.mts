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

// Whether the visitor of this request has already made `limit` calls to the function `name` in the current minute, counting this call otherwise: a function keeps its default address /.netlify/functions/<name>, which the rate limit of a Netlify config cannot (it needs a path of its own); the IP is stored hashed, never in clear, and Blobs failing lets the call through rather than blocking every visitor
export async function isRateLimited(name: string, limit: number, context: Context): Promise<boolean> {
    try {
        const store = getStore({ name: "rate-limits", consistency: "strong" });
        const key = `${name}/${createHash("sha256").update(context.ip).digest("hex")}`;
        const window = Math.floor(Date.now() / WINDOW_MS);
        // Calls at the same time read the same count: each write only goes through if the entry is still the one it read (its ETag, or no entry yet), else the call reads again, so a burst cannot overwrite its own counts
        for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
            const entry = await store.getWithMetadata(key, { type: "json" });
            const stored = entry?.data as WindowCount | undefined;
            const count = stored?.window === window ? stored.count : 0;
            if (count >= limit) {
                return true;
            }
            const condition = entry?.etag ? { onlyIfMatch: entry.etag } : { onlyIfNew: true };
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
