// A test that fails on purpose, on the ci-failure-check branch only, to check that a failed Jest test turns both pipelines red (#479); never merged.
test('fails on purpose', () => {
    expect(1).toBe(2);
});
