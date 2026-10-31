// The two calls jest-config makes to deepmerge 4, deepmerge(target, source) and deepmerge.all([...objects]), with its default options (arrays concatenated, later values win), handed to @fastify/deepmerge, which skips __proto__, constructor and prototype keys
const merge = require('@fastify/deepmerge')({ all: true });

const deepmerge = (target, source) => merge(target, source);
deepmerge.all = objects => merge(...objects);

module.exports = deepmerge;
