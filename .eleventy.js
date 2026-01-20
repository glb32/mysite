module.exports = function(eleventyConfig) {

  // 1. Copy your local agents folder to '_site/agents'
  // Ensure your folder at 'src/agents/Bonzi' exists!
  eleventyConfig.addPassthroughCopy({ "src/agents": "agents" });

  // 2. Copy your standard assets
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/icons");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/images/bg_buttons");
  eleventyConfig.addPassthroughCopy("src/style.css");

  return {
    dir: { input: "src", output: "_site" }
  };
};