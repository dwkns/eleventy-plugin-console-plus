import consolePlus from './index.js';

/** @param {import("@11ty/eleventy").UserConfig} eleventyConfig */
export default (eleventyConfig) => {
  eleventyConfig.addPlugin(consolePlus, {
    logToTerminal: true, // log to terminal
    logToBrowserConsole: true, // log to browser console
    logToHtml: true, // log to HTML
  } );

  eleventyConfig.addCollection("test", (collectionApi) => {
    return collectionApi.getFilteredByGlob("test/src/**/*.md");
  });
  eleventyConfig.addCollection("test1", (collectionApi) => {
    return collectionApi.getFilteredByGlob("test/src/**/*.md");
  });
  eleventyConfig.addCollection("test2", (collectionApi) => {
    return collectionApi.getFilteredByGlob("test/src/**/*.md");
  });
};

export const config = {
  htmlTemplateEngine: "njk",
  dir: {
    input: "test/src",
    output: "dist"
  },
};