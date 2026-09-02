import { Context } from "@netlify/functions";

// Origins the site is actually served from; anything else is treated as third-party.
const allowedOrigins = new Set([
    "http://localhost:8888",
    "https://nicoboga.netlify.app"
]);

// Every function is a same-origin XHR target, never a page a visitor navigates to
// directly. Allow requests coming from the site (or the dev tunnel), plus the
// Lighthouse crawler used by the deploy audit.
export function isTrustedRequest(req: Request): boolean {
    const referer = req.headers.get("referer") || "";
    const userAgent = req.headers.get("user-agent") || "";

    let refererOrigin = "";
    try {
        refererOrigin = new URL(referer).origin;
    } catch {
        // Missing or malformed Referer: treat as not originating from the site.
    }

    // Netlify sets CONTEXT to "dev" only under `netlify dev` (npm run dev / dev:live);
    // in that mode the Live Share tunnel serves the site from a *.netlify.live origin.
    const isDevTunnel = process.env.CONTEXT === "dev" &&
        /^https:\/\/[^/]+\.netlify\.live$/.test(refererOrigin);

    const isFromSite = allowedOrigins.has(refererOrigin) || isDevTunnel;
    const isFromLighthouse = /Lighthouse|Chrome-Lighthouse/i.test(userAgent);

    return isFromSite || isFromLighthouse;
}

export function redirectTo404(): Response {
    return new Response(null, { status: 302, headers: { Location: "/404" } });
}

export function jsonResponse(data: unknown, init: ResponseInit = {}): Response {
    return new Response(JSON.stringify(data), {
        ...init,
        headers: { "Content-Type": "application/json", ...init.headers }
    });
}

// Uniform 500 for the top-level catch in every handler. Pass `req` to also log the
// Referer, which is the usual culprit when a request is unexpectedly rejected.
export function internalError(context: Context, error: unknown, req?: Request): Response {
    if (req) {
        console.error("[%s] Referer: %s", context.requestId, req.headers.get("referer") || "unknown", error);
    } else {
        console.error(`[${context.requestId}]`, error);
    }
    return jsonResponse({ error: "Internal error", requestId: context.requestId }, { status: 500 });
}
