import consolePlus from './index.js';

/** @param {import("@11ty/eleventy").UserConfig} eleventyConfig */
export default (eleventyConfig) => {
  eleventyConfig.addPlugin(consolePlus, {
    logToTerminal: true, // log to terminal
    logToBrowserConsole: true, // log to browser console
    logToHtml: true, // log to HTML
  } );

};

export const config = {
  htmlTemplateEngine: "njk",
  dir: {
    input: "test/src",
    output: "dist"
  },
};