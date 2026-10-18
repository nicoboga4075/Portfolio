// The slugs of the projects with a page of their own (projects/<slug>_<lang>.html, served at /<lang>/<slug>): the explore of the _data/projects.json cards that is neither an address nor a part of another page (blog#<article>); read by .eleventy.js, gen-redirects.js, check-content and the portfolio-dev MCP server instead of a list kept in package.json.
module.exports = function resolveProjects(cards) {
    return cards.map(card => card.explore).filter(target => target && !/(?:^https?:)|#/.test(target));
};
