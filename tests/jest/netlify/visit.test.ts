// Unit tests of netlify/functions/visit.mts: it increments the visit counter through the increment_visits RPC of Supabase and returns the new count, fetch mocked.
import handlerVisit from "../../../netlify/functions/visit.mjs";

const context = { requestId: "req-1" } as any;

// A call of the function, from the site unless another Referer is given
function request(referer = "https://nicoboga.netlify.app/en/"): Request {
    return new Request("https://nicoboga.netlify.app/.netlify/functions/visit", { headers: { referer } });
}

beforeEach(() => {
    process.env.SUPABASE_URL = "https://project.supabase.co";
    process.env.SUPABASE_ANON_KEY = "anon-key";
});

afterEach(() => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
    jest.restoreAllMocks();
});

test("redirects to /404 a request that does not come from the site, without calling Supabase", async () => {
    const fetchSpy = jest.spyOn(global, "fetch");
    const response = await handlerVisit(request("https://evil.example/"), context);
    expect(response.status).toBe(302);
    expect(fetchSpy).not.toHaveBeenCalled();
});

test("calls increment_visits with the anon key and returns the new count", async () => {
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue(new Response("42", { status: 200 }));
    const response = await handlerVisit(request(), context);
    expect(await response.json()).toEqual({ visits: 42 });
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://project.supabase.co/rest/v1/rpc/increment_visits");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({ apikey: "anon-key", Authorization: "Bearer anon-key" });
});

test("answers a 500 and logs the Referer when the RPC fails", async () => {
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(global, "fetch").mockResolvedValue(new Response("", { status: 500, statusText: "Internal Server Error" }));
    const response = await handlerVisit(request(), context);
    expect(response.status).toBe(500);
    expect(log.mock.calls[0][2]).toBe("https://nicoboga.netlify.app/en/");
});

test("answers a 500 when Supabase cannot be reached", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(global, "fetch").mockRejectedValue(new TypeError("fetch failed"));
    expect((await handlerVisit(request(), context)).status).toBe(500);
});
