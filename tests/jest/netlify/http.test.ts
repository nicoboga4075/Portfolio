// Unit tests of netlify/functions/shared/http.mts: which requests count as coming from the site, and the 404 redirect, JSON and 500 responses every function returns.
import { internalError, isTrustedRequest, jsonResponse, redirectTo404 } from "../../../netlify/functions/shared/http.mjs";
import fs from "node:fs";
import path from "node:path";
import toml from "toml";
import pkg from "../../../package.json";

const site = pkg.homepage;
// The port of the local site, the one of [dev] in netlify.toml that dev-watch.js opens
const devPort = toml.parse(fs.readFileSync(path.join(__dirname, "..", "..", "..", "netlify.toml"), "utf8")).dev.port;

const context = { requestId: "req-1" } as any;

// A request to a function, with the given Referer and User-Agent when set
function request({ referer, userAgent }: { referer?: string, userAgent?: string } = {}): Request {
    const headers = new Headers();
    if (referer) headers.set("referer", referer);
    if (userAgent) headers.set("user-agent", userAgent);
    return new Request(`${site}/.netlify/functions/env`, { headers });
}

afterEach(() => {
    delete process.env.CONTEXT;
    jest.restoreAllMocks();
});

describe("isTrustedRequest", () => {
    test("trusts the production site", () => {
        expect(isTrustedRequest(request({ referer: `${site}/en/` }))).toBe(true);
    });

    test("trusts the local site only under netlify dev, on localhost over http", () => {
        const local = request({ referer: `http://localhost:${devPort}/fr/blog` });
        expect(isTrustedRequest(local)).toBe(false);
        process.env.CONTEXT = "dev";
        expect(isTrustedRequest(local)).toBe(true);
        expect(isTrustedRequest(request({ referer: `https://localhost:${devPort}/` }))).toBe(false);
        expect(isTrustedRequest(request({ referer: `http://localhost.evil.example:${devPort}/` }))).toBe(false);
    });

    test("rejects a third-party, a missing or a malformed Referer", () => {
        expect(isTrustedRequest(request({ referer: "https://evil.example/" }))).toBe(false);
        expect(isTrustedRequest(request())).toBe(false);
        expect(isTrustedRequest(request({ referer: "not a url" }))).toBe(false);
    });

    test("rejects an origin that only starts like the site's", () => {
        expect(isTrustedRequest(request({ referer: `${site}.evil.example/` }))).toBe(false);
    });

    test("trusts a *.netlify.live tunnel only under netlify dev", () => {
        const tunnel = request({ referer: "https://abc123.netlify.live/en/" });
        expect(isTrustedRequest(tunnel)).toBe(false);
        process.env.CONTEXT = "dev";
        expect(isTrustedRequest(tunnel)).toBe(true);
        expect(isTrustedRequest(request({ referer: "https://abc123.netlify.live.evil.example/" }))).toBe(false);
    });

    test("trusts the Lighthouse crawler of the deploy audit without a Referer", () => {
        expect(isTrustedRequest(request({ userAgent: "Mozilla/5.0 Chrome-Lighthouse" }))).toBe(true);
        expect(isTrustedRequest(request({ userAgent: "Mozilla/5.0 (Windows NT 10.0) Chrome/140" }))).toBe(false);
    });
});

describe("redirectTo404", () => {
    test("redirects to /404 with a 302", () => {
        const response = redirectTo404();
        expect(response.status).toBe(302);
        expect(response.headers.get("location")).toBe("/404");
    });
});

describe("jsonResponse", () => {
    test("serialises the data as JSON with a 200 by default", async () => {
        const response = jsonResponse({ visits: 3 });
        expect(response.status).toBe(200);
        expect(response.headers.get("content-type")).toBe("application/json");
        expect(await response.json()).toEqual({ visits: 3 });
    });

    test("keeps the given status and adds the given headers to the JSON content type", () => {
        const response = jsonResponse({}, { status: 201, headers: { "Cache-Control": "no-store" } });
        expect(response.status).toBe(201);
        expect(response.headers.get("cache-control")).toBe("no-store");
        expect(response.headers.get("content-type")).toBe("application/json");
    });
});

describe("internalError", () => {
    test("answers a 500 with the request id and logs the error", async () => {
        const log = jest.spyOn(console, "error").mockImplementation(() => {});
        const error = new Error("boom");
        const response = internalError(context, error);
        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({ error: "Internal error", requestId: "req-1" });
        expect(log).toHaveBeenCalledWith("[req-1]", error);
    });

    test("also logs the Referer when the request is given", () => {
        const log = jest.spyOn(console, "error").mockImplementation(() => {});
        const error = new Error("boom");
        internalError(context, error, request({ referer: "https://evil.example/" }));
        expect(log).toHaveBeenCalledWith("[%s] Referer: %s", "req-1", "https://evil.example/", error);
        internalError(context, error, request());
        expect(log).toHaveBeenLastCalledWith("[%s] Referer: %s", "req-1", "unknown", error);
    });
});
