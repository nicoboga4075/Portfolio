import { Context } from "@netlify/functions";
import fs from "node:fs/promises";
import path from "node:path";
import { internalError, isTrustedRequest, redirectTo404 } from "./shared/http.mjs";
import { isRateLimited, tooManyRequests } from "./shared/rate-limit.mjs";

export default async function handlerArticle(req: Request, context: Context): Promise<Response> {
    try {
        // Fail fast: the origin first, then the parameter, before any read of the request body or of Blobs
        if (!isTrustedRequest(req)) {
            return redirectTo404();
        }

        const filename = new URL(req.url).searchParams.get("filename");
        if (!filename || !/^[a-zA-Z0-9_-]+_[a-z]{2}\.html$/.test(filename)) {
            return redirectTo404();
        }

        // one call per article opened on the blog: past 60 a minute, a loop running up the invocations
        if (await isRateLimited("article", 60, context)) {
            return tooManyRequests();
        }

        // Local preview (npm run dev, dev:watch, dev:live, dev:live:watch) compiles to .eleventy/ instead of in-place,
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
            } catch (error) {
                // Any error but a missing file (permissions, a folder in its place) is a fault of the deploy: a 500 through internalError, not a quiet 404
                if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
                    throw error;
                }
                // A missing file: try the next candidate, then fall through to 404
            }
        }

        return redirectTo404();
    } catch (error) {
        return internalError(context, error);
    }
};
