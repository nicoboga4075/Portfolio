const fs = require("fs");
const path = require("path");
const keptFiles = ["index_en.html", "index_fr.html"];
const outputFolder = ".eleventy";
const includesFolder = "_includes";

module.exports = function(eleventyConfig) {
  fs.readdirSync(".").forEach(file => {
    if (!keptFiles.includes(file) || (fs.statSync(file).isDirectory() && file !== includesFolder)) {
      eleventyConfig.ignores.add(file);
    }
  });
  eleventyConfig.on("eleventy.after", () => {
    const publicDir = path.join(__dirname, outputFolder);
    keptFiles.forEach(file => {
      const src = path.join(publicDir, file);
      const dest = path.join(__dirname, file);
      if (fs.existsSync(src)) fs.renameSync(src, dest);
    });
    if (fs.existsSync(publicDir)) fs.rmSync(publicDir, { recursive: true, force: true });
  });
  return {
    dir: { input: ".", includes: includesFolder, output: outputFolder },
    templateFormats: ["html"],
    htmlTemplateEngine: "njk"
  };
};