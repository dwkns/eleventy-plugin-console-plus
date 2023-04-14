const util = require("util");
const escapeHtml = require("escape-html");
// utility function to log value to HTML & the Console
let logToConsole = (eleventyConfig, options) => {
  defaults = {
    logToHtml: true, // log to HTML
    logToTerminal: true, // log to terminal
    colorizeConsole: true, // colorize the console output
    escapeHTML: true, // escape HTML in the output
    depth: 8 // depth of object to print
  };
  options = Object.assign({}, defaults, options);

  eleventyConfig.addShortcode("console", (value, title = "") => {
    let consoleStr = util.inspect(
      value,
      (showHidden = false),
      options.depth,
      (colorize = options.colorizeConsole)
    );
    let htmlStr = util.inspect(
      value,
      (showHidden = false),
      options.depth,
      (colorize = false)
    );

    if (typeof value === "string") {
      consoleStr = value;
      htmlStr = value;
    }

    let displayTitle = "";

    if (options.logToTerminal) {
      console.log("-------------start theconsole output-------------");
      if (title) {
        console.log(`[ ${title} ]`, consoleStr);
      } else {
        console.log(consoleStr);
      }
      console.log("-------------end-------------");
    }

    if (options.logToHtml) {
      if (title) {
        displayTitle = `<p class="title">${title}</p>`;
      }
      let css = `
      <style>
      .code-block {
        background: #f4f4f4;
        border: 1px solid #ddd;
        border-left: 3px solid #f36d33;
        color: #666;
        max-width: 100%;
        padding: 0.5rem 1rem;
        display: block;
        margin-top: 1rem;
        margin-bottom: 1rem;
      }
      .title {
        font-size: 18px;
        font-family: sans-serif;
        font-weight: 600;
        margin-top:0.5rem;
        margin-bottom:0.5rem;
      }
      pre {
        page-break-inside: avoid;
        font-family: monospace;
        font-size: 15px;
        line-height: 1.6;
        word-wrap: break-word;
        overflow: auto;
        margin: 0;
      }
      </style>`;

      let html = `<div class="code-block">${displayTitle}<pre><code>${
        options.escapeHTML ? escapeHtml(htmlStr) : htmlStr
      }</code></pre></div>`;

      return css + html;
    }
  });
};
module.exports = {
  logToConsole,
};
