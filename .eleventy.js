const fs = require("fs");
const path = require("path");
const toml = require("toml");
const prettier = require("prettier");
const outputFolder = ".eleventy";
const includesFolder = "_includes";
const allowedDirs = [".", includesFolder, "articles", "projects"];

module.exports = function(eleventyConfig) {
  for (const name of fs.readdirSync(".")) {
    const fullPath = path.join(".", name);
    if (fs.statSync(fullPath).isDirectory() && !allowedDirs.includes(name)) {
      eleventyConfig.ignores.add(name);
    }
  }
  const lighthousePlugin = toml.parse(fs.readFileSync("./netlify.toml", "utf-8")).context.production.plugins.find(p => p.package === "@netlify/plugin-lighthouse");
  const preset = lighthousePlugin.inputs.settings.preset ?? "mobile";
  eleventyConfig.addGlobalData("viewport", preset);
  eleventyConfig.addTransform("prettify", function(content, outputPath) {
    if(outputPath && outputPath.endsWith(".html")) {
      try {
        return prettier.format(content, {parser: "html", tabWidth: 4, useTabs: false, printWidth: 1000, htmlWhitespaceSensitivity: "strict",});
      } catch (e) {
        console.warn(`Prettier failed on ${outputPath}: ${e.message}`);
        return content;
      }
    }
    return content;
  });
  eleventyConfig.on("eleventy.after", () => {
    const publicDir = path.join(__dirname, outputFolder);
    if (!fs.existsSync(publicDir)) return;
    for (const dir of allowedDirs) {
      const srcDir = path.join(publicDir, dir);
      const destDir = path.join(__dirname, dir);
      if (!fs.existsSync(srcDir)) continue;
      for (const file of fs.readdirSync(srcDir)) {
        if (file.endsWith(".html")) {
          fs.renameSync(path.join(srcDir, file), path.join(destDir, file));
        }
      }
    }
    fs.rmSync(publicDir, { recursive: true, force: true });
  });
  return {
    dir: { input: ".", includes: includesFolder, output: outputFolder },
    templateFormats: ["html"],
    htmlTemplateEngine: "njk"
  };
};