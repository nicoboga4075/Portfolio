// Unit tests of netlify/functions/article.mts: it serves an article's HTML from .eleventy/articles (local preview) or articles (production build), and redirects to /404 a missing, malformed or unknown file name, in a temporary working folder.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import handlerArticle from "../../../netlify/functions/article.mjs";

const context = { requestId: "req-1" } as any;
let cwd: string;

// A call of the function from the site, with the given filename parameter when set
function request(filename?: string, referer = "https://nicoboga.netlify.app/en/blog"): Request {
    const query = filename === undefined ? "" : `?filename=${encodeURIComponent(filename)}`;
    return new Request(`https://nicoboga.netlify.app/.netlify/functions/article${query}`, { headers: { referer } });
}

// Writes an article into a folder of the temporary working folder
function writeArticle(folder: string, filename: string, html: string) {
    fs.mkdirSync(path.join(cwd, folder), { recursive: true });
    fs.writeFileSync(path.join(cwd, folder, filename), html);
}

beforeEach(() => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), "article-"));
    jest.spyOn(process, "cwd").mockReturnValue(cwd);
});

afterEach(() => {
    jest.restoreAllMocks();
    fs.rmSync(cwd, { recursive: true, force: true });
});

test("serves the article of the production build, as HTML that must not be sniffed", async () => {
    writeArticle("articles", "mcs_en.html", "<h1>MCS</h1>");
    const response = await handlerArticle(request("mcs_en.html"), context);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/html");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(await response.text()).toBe("<h1>MCS</h1>");
});

test("prefers the compiled copy of the local preview", async () => {
    writeArticle("articles", "mcs_fr.html", "source");
    writeArticle(path.join(".eleventy", "articles"), "mcs_fr.html", "compiled");
    expect(await (await handlerArticle(request("mcs_fr.html"), context)).text()).toBe("compiled");
});

test("redirects to /404 without a filename or from outside the site", async () => {
    writeArticle("articles", "mcs_en.html", "<h1>MCS</h1>");
    expect((await handlerArticle(request(), context)).status).toBe(302);
    expect((await handlerArticle(request("mcs_en.html", "https://evil.example/"), context)).status).toBe(302);
});

test("redirects to /404 a filename outside the allowlist, path traversal included", async () => {
    fs.writeFileSync(path.join(cwd, "secret_en.html"), "secret");
    for (const filename of ["../secret_en.html", "..\\secret_en.html", "mcs.html", "mcs_EN.html", "mcs_en.htm", "mcs en.html"]) {
        const response = await handlerArticle(request(filename), context);
        expect(response.status).toBe(302);
        expect(response.headers.get("location")).toBe("/404");
    }
});

test("redirects to /404 an article that exists in neither folder", async () => {
    expect((await handlerArticle(request("unknown_en.html"), context)).status).toBe(302);
});

test("never reads a path that resolves outside the articles folder, even with an allowed name", async () => {
    writeArticle("articles", "mcs_en.html", "<h1>MCS</h1>");
    // The second barrier, behind the filename allowlist: path.resolve made to land outside each folder, as a loosened regex would let it
    jest.spyOn(path, "resolve").mockReturnValue(path.join(os.tmpdir(), "outside", "mcs_en.html"));
    const read = jest.spyOn(fs.promises, "readFile");
    const response = await handlerArticle(request("mcs_en.html"), context);
    expect(response.status).toBe(302);
    expect(read).not.toHaveBeenCalled();
});

test("answers a 500 with the request id when the request cannot be read", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    const response = await handlerArticle({ url: "not a url" } as Request, context);
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal error", requestId: "req-1" });
});
