import { Context } from "@netlify/functions";

export default async function handler_env(req: Request, context: Context): Promise<Response> {
    const referer = req.headers.get("referer") || "";

    const allowedReferers = [
        "http://localhost:8888",
        "https://nicoboga.netlify.app"
    ];

    const error404 = new URL("/404", req.url).toString();

    const isFromSite = allowedReferers.some(origin => referer.startsWith(origin));

    if (!isFromSite) {
        return Response.redirect(error404, 302);
    }

    const filteredEnvVars = Object.entries(process.env)
        .filter(([key, _]) => key.startsWith("ENV_") || key.startsWith("SITE_") || key.startsWith("GITHUB_"))
        .reduce((acc, [key, value]) => {
                acc[key] = key.includes("SECRET") ? "HIDDEN" : value;
                return acc;
            }, {} as Record<string, string>);

    return new Response(JSON.stringify(filteredEnvVars), {
        headers: {
            "Content-Type": "application/json"
        }
    });
};
