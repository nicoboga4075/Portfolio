const deepmerge = require('deepmerge');

// The deepmerge jest-config loads is the stand-in of tests/deepmerge (override of package.json), not the vulnerable deepmerge 4.3.1
describe('deepmerge stand-in', () => {
    test('is the one of tests/deepmerge', () => {
        expect(require('deepmerge/package.json').version).toBe('4.3.1-fastify');
    });

    test('merges two objects deeply, the second winning, arrays concatenated', () => {
        const target = { testMatch: ['a'], globals: { x: { y: 1 } }, keep: true };
        const source = { testMatch: ['b'], globals: { x: { z: 2 } }, keep: false };
        expect(deepmerge(target, source)).toEqual({ testMatch: ['a', 'b'], globals: { x: { y: 1, z: 2 } }, keep: false });
        expect(target).toEqual({ testMatch: ['a'], globals: { x: { y: 1 } }, keep: true });
    });

    test('merges a list of objects in order with all', () => {
        expect(deepmerge.all([{ a: 1, b: { c: 1 } }, { b: { d: 2 } }, { a: 3 }])).toEqual({ a: 3, b: { c: 1, d: 2 } });
    });

    test('never writes a __proto__ key into the prototype of the result', () => {
        const merged = deepmerge({}, JSON.parse('{"__proto__": {"polluted": true}, "a": {"__proto__": {"polluted": true}}}'));
        expect(merged.polluted).toBeUndefined();
        expect(merged.a?.polluted).toBeUndefined();
        expect(Object.getPrototypeOf(merged)).toBe(Object.prototype);
    });
});
