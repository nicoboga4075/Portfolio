import { Context } from "@netlify/functions";
import fs from "node:fs/promises";
import path from "node:path";

export default async function handler_article(req: Request, context: Context): Promise<Response> {
    try {
        const url = new URL(req.url);
        const filename = url.searchParams.get("filename");

        const referer = req.headers.get("referer") || "";
        const userAgent = req.headers.get("user-agent") || "";

        const error404 = new URL("/404", req.url).toString();

        const allowedReferers = [
            "http://localhost:8888",
            "https://nicoboga.netlify.app"
        ];

        const isFromSite = allowedReferers.some(origin => referer.startsWith(origin));
        const isFromLighthouse = /Lighthouse|Chrome-Lighthouse/i.test(userAgent);

        if (!filename || (!isFromSite && !isFromLighthouse)) {
            return Response.redirect(error404, 302);
        }

        const isValidFilename = /^[a-zA-Z0-9_-]+_(fr|en)\.html$/.test(filename);
        if (!isValidFilename) {
            return Response.redirect(error404, 302);
        }

        const filePath = path.join(process.cwd(), "articles", filename);

        try {
            const fileContent = await fs.readFile(filePath, "utf-8");
            return new Response(fileContent, {
                headers: {
                    "Content-Type": "text/html"
                },
            });
        } catch {
            return Response.redirect(error404, 302);
        }
    } catch (error) {
        return new Response(
            JSON.stringify({
                error: (error as Error).message
            }), {
                status: 500,
                headers: {
                    "Content-Type": "application/json"
                },
            }
        );
    }
};