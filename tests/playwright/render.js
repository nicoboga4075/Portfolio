// Renders the Nunjucks partials of _includes/ for the specs that read their HTML without a build, the way Eleventy does: autoescape, the includes they include read from _includes/, and the filters of .eleventy.js they use
const path = require('node:path');
const nunjucks = require('nunjucks');
const { italicNames } = require('../../.eleventy');

const root = path.join(__dirname, '..', '..');
const env = new nunjucks.Environment(new nunjucks.FileSystemLoader(path.join(root, '_includes')), { autoescape: true });
env.addFilter('italicNames', text => italicNames(text));
env.addFilter('workYears', require('../../work-years'));

// A partial of _includes/ by its file name, with the data Eleventy would give it
const renderInclude = (name, data) => env.render(name, data);

// A template given as text (a partial read and changed by the spec), with the data Eleventy would give it
const renderTemplate = (template, data) => env.renderString(template, data);

module.exports = { renderInclude, renderTemplate };
