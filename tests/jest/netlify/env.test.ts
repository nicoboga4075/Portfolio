// Unit tests of netlify/functions/env.mts: the public environment variables, Google's test reCAPTCHA key under netlify dev, and the date of the last commit of a CV through the GitHub API, fetch mocked.
import handlerEnv from "../../../netlify/functions/env.mjs";
import pkg from "../../../package.json";

const context = { requestId: "req-1" } as any;
const SITE = pkg.homepage;
const RECAPTCHA_TEST_KEY = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";

// A call of the function from the site, with the given query string
function request(query = "", referer = `${SITE}/en/`): Request {
    return new Request(`${SITE}/.netlify/functions/env${query}`, { headers: { referer } });
}

// fetch answering the GitHub commits API with the given commits, or with an error status
function mockGithub(commits: unknown, ok = true) {
    return jest.spyOn(global, "fetch").mockResolvedValue(new Response(JSON.stringify(commits), { status: ok ? 200 : 503, statusText: ok ? "OK" : "Service Unavailable" }));
}

beforeEach(() => {
    process.env.ENV_CLIENT_ID = "client-id";
    process.env.SITE_RECAPTCHA_KEY = "real-key";
    process.env.GITHUB_API_TOKEN = "gh-token";
    process.env.SECRET_THAT_MUST_NOT_LEAK = "secret";
});

afterEach(() => {
    for (const key of ["ENV_CLIENT_ID", "SITE_RECAPTCHA_KEY", "GITHUB_API_TOKEN", "SECRET_THAT_MUST_NOT_LEAK", "CONTEXT"]) delete process.env[key];
    jest.restoreAllMocks();
});

test("redirects to /404 a request that does not come from the site", async () => {
    const response = await handlerEnv(request("", "https://evil.example/"), context);
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("/404");
});

test("returns only the public variables", async () => {
    const response = await handlerEnv(request(), context);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ENV_CLIENT_ID: "client-id", SITE_RECAPTCHA_KEY: "real-key" });
});

test("leaves out a public variable that is not set", async () => {
    delete process.env.ENV_CLIENT_ID;
    expect(await (await handlerEnv(request(), context)).json()).toEqual({ SITE_RECAPTCHA_KEY: "real-key" });
});

test("hands back Google's test reCAPTCHA key under netlify dev", async () => {
    process.env.CONTEXT = "dev";
    expect((await (await handlerEnv(request(), context)).json()).SITE_RECAPTCHA_KEY).toBe(RECAPTCHA_TEST_KEY);
});

test("redirects to /404 a lang that is not two lowercase letters", async () => {
    const fetchSpy = jest.spyOn(global, "fetch");
    for (const lang of ["EN", "eng", "e", "../x"]) {
        expect((await handlerEnv(request(`?lang=${encodeURIComponent(lang)}`), context)).status).toBe(302);
    }
    expect(fetchSpy).not.toHaveBeenCalled();
});

test("returns the date of the last commit of the CV in that language, with the GitHub token", async () => {
    const fetchSpy = mockGithub([{ commit: { committer: { date: "2026-10-01T16:40:00Z" } } }]);
    const response = await handlerEnv(request("?lang=fr"), context);
    expect(await response.json()).toEqual({ date: "2026-10-01T16:40:00Z" });
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.github.com/repos/nicoboga4075/Portfolio/commits?path=docs/public/CV_fr.pdf&per_page=1");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer gh-token");
});

test("falls back to the CV of the default language for a language without a CV", async () => {
    const fetchSpy = mockGithub([]);
    const response = await handlerEnv(request("?lang=de"), context);
    expect(fetchSpy.mock.calls[0][0]).toContain("CV_en.pdf");
    expect(await response.json()).toEqual({});
});

test("answers a 500 when the GitHub API fails", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    mockGithub({}, false);
    const response = await handlerEnv(request("?lang=en"), context);
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal error", requestId: "req-1" });
});
