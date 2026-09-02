import { Context } from "@netlify/functions";

export default async function handlerVisit(req: Request, context: Context): Promise<Response> {
    try {
        const referer = req.headers.get("referer") || "";
        const userAgent = req.headers.get("user-agent") || "";

        const error404 = new URL("/404", req.url).toString();

        const allowedOrigins = [
            "http://localhost:8888",
            "https://nicoboga.netlify.app"
        ];

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

        const isFromSite = allowedOrigins.includes(refererOrigin) || isDevTunnel;
        const isFromLighthouse = /Lighthouse|Chrome-Lighthouse/i.test(userAgent);

        if (!isFromSite && !isFromLighthouse) {
            return Response.redirect(error404, 302);
        }

        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY;

        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/increment_visits`, {
            method: "POST",
            headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`RPC error: ${response.statusText}`);
        }

        const newCount = await response.json();
        return new Response(
            JSON.stringify({
                visits: newCount
            }), {
                headers: {
                    "Content-Type": "application/json"
                },
            }
        );
    } catch (error) {
        console.error(`[${context.requestId}] Referer: ${req.headers.get("referer") || "unknown"}`, error);
        return new Response(
            JSON.stringify({
                error: "Internal error",
                requestId: context.requestId
            }), {
                status: 500,
                headers: {
                    "Content-Type": "application/json"
                },
            }
        );
    }
};
