import { Context } from "@netlify/functions";
import fs from "node:fs/promises";
import path from "node:path";
import { internalError, isTrustedRequest, redirectTo404 } from "./shared/http.mjs";

export default async function handlerArticle(req: Request, context: Context): Promise<Response> {
    try {
        const url = new URL(req.url);
        const filename = url.searchParams.get("filename");

        if (!filename || !isTrustedRequest(req)) {
            return redirectTo404();
        }

        const isValidFilename = /^[a-zA-Z0-9_-]+_[a-z]{2}\.html$/.test(filename);
        if (!isValidFilename) {
            return redirectTo404();
        }

        // Local preview (npm run dev, dev:watch, dev:live) compiles to .eleventy/ instead of in-place,
        // so prefer that compiled copy when present; production builds compile
        // articles/*.html in place and never leave a .eleventy/ folder behind.
        const articleDirs = [
            path.join(process.cwd(), ".eleventy", "articles"),
            path.join(process.cwd(), "articles")
        ];

        for (const articleDir of articleDirs) {
            const candidatePath = path.resolve(articleDir, filename);

            // Second barrier behind the filename allowlist above: never read outside the articles folder, even if that regex is loosened later.
            if (!candidatePath.startsWith(articleDir + path.sep)) {
                continue;
            }

            try {
                const fileContent = await fs.readFile(candidatePath, "utf-8");
                return new Response(fileContent, {
                    headers: {
                        "Content-Type": "text/html",
                        "X-Content-Type-Options": "nosniff"
                    },
                });
            } catch {
                // Try the next candidate, then fall through to 404.
            }
        }

        return redirectTo404();
    } catch (error) {
        return internalError(context, error);
    }
};
