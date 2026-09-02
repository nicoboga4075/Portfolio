import { Context } from "@netlify/functions";
import { internalError, isTrustedRequest, jsonResponse, redirectTo404 } from "./shared/http.mjs";

export default async function handlerVisit(req: Request, context: Context): Promise<Response> {
    try {
        if (!isTrustedRequest(req)) {
            return redirectTo404();
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
        return jsonResponse({ visits: newCount });
    } catch (error) {
        return internalError(context, error, req);
    }
};
