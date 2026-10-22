module.exports = function(eleventyConfig) {

  // Static assets
  eleventyConfig.addPassthroughCopy({ "src/agents": "agents" });
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/icons");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/style.css");
  eleventyConfig.addPassthroughCopy("src/site.webmanifest");

  // Self-host the agent runtime instead of pulling it from a CDN.
  // clippyjs@latest on unpkg is now an ES module and breaks the classic <script> tag.
  eleventyConfig.addPassthroughCopy({
    "node_modules/jquery/dist/jquery.min.js": "js/vendor/jquery.min.js",
    "node_modules/clippyjs/dist/clippy.js": "js/vendor/clippy.js"
  });

  return {
    dir: { input: "src", output: "_site" }
  };
};
