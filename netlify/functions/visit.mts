import { Context } from "@netlify/functions";
import { internalError, isTrustedRequest, jsonResponse, redirectTo404 } from "./shared/http.mjs";
import { isRateLimited, tooManyRequests } from "./shared/rate-limit.mjs";

export default async function handlerVisit(req: Request, context: Context): Promise<Response> {
    try {
        if (!isTrustedRequest(req)) {
            return redirectTo404();
        }

        // one call per load of the live home page: past 10 a minute, a loop inflating the counter
        if (await isRateLimited("visit", 10, context)) {
            return tooManyRequests();
        }

        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY;
        // Without its settings in Netlify, the counter cannot be reached: a 500 through internalError rather than a call to "undefined/rest/v1"
        if (!supabaseUrl || !supabaseKey) {
            throw new Error("SUPABASE_URL or SUPABASE_ANON_KEY is not set");
        }

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
        return jsonResponse({ visits: newCount });
    } catch (error) {
        return internalError(context, error, req);
    }
};
