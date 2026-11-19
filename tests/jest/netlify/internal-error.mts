// The uniform 500 of internalError (netlify/functions/shared/http.mts) that the tests of the functions expect from a call that failed: its status, and a JSON body holding only the request id of the context, never the error itself
export async function expectInternalError(response: Response, requestId = "req-1"): Promise<void> {
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal error", requestId });
}
