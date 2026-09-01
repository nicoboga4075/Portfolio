import { Context } from "@netlify/functions";
import fs from "node:fs/promises";
import path from "node:path";

export default async function handlerArticle(req: Request, context: Context): Promise<Response> {
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

        // Local preview (npm run dev) compiles to .eleventy/ instead of in-place,
        // so prefer that compiled copy when present; production builds compile
        // articles/*.html in place and never leave a .eleventy/ folder behind.
        const previewFilePath = path.join(process.cwd(), ".eleventy", "articles", filename);
        const filePath = path.join(process.cwd(), "articles", filename);

        try {
            const fileContent = await fs.readFile(previewFilePath, "utf-8");
            return new Response(fileContent, {
                headers: {
                    "Content-Type": "text/html",
                    "X-Content-Type-Options": "nosniff"
                },
            });
        } catch {
            // Fall through to the production path below
        }

        try {
            const fileContent = await fs.readFile(filePath, "utf-8");
            return new Response(fileContent, {
                headers: {
                    "Content-Type": "text/html",
                    "X-Content-Type-Options": "nosniff"
                },
            });
        } catch {
            return Response.redirect(error404, 302);
        }
    } catch (error) {
        console.error(`[${context.requestId}]`, error);
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