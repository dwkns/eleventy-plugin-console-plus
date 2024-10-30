import { inspect } from "util";
import escapeHtml from "escape-html";

// utility function to log value to a template, terminal and browser console.
let logToConsole = (eleventyConfig, options) => {
  let defaults = {
    logToHtml: true, // log to HTML
    logToTerminal: true, // log to terminal
    logToBrowserConsole: true, // log to browser console
    colorizeConsole: true, // colorize the output (where possible)
    escapeHTML: true, // escape HTML in the output
    depth: 8, // depth of object to print
    breakLength: 60 // length of line to break
  };
  options = Object.assign({}, defaults, options);

  eleventyConfig.addShortcode("console", (value, title = "") => {

    let terminalStr = inspect(value, {
      showHidden: false,
      depth: options.depth,
      colors: options.colorizeConsole,
      breakLength: options.breakLength
    })

    let htmlStr = inspect(value, {
      showHidden: false,
      depth: options.depth,
      colors: false,
      breakLength: options.breakLength
    })

    let browserConsoleStr = inspect(value, {
      showHidden: false,
      depth: options.depth,
      colors: false,
      breakLength: options.breakLength
    })

    /* logging to terminal */
    if (options.logToTerminal) {
      let terminalTitleString = title ? `[${title}]: ` : ``
      switch (typeof value) {
        // Functions need to be logged differently to show thier contents.
        case "function":
          console.log(`${terminalTitleString}${value.toString()}`)
          break;
        default:
          console.log(`${terminalTitleString}${terminalStr}`)
      }
    }

    /* 
      logging to browser console 
      returns either a <script> tag with a console.log 
      or an empty string inserted into the template below
    */
    let browserConsoleHtml
    if (options.logToBrowserConsole) {
      let browserConsoleTitleString = title ? `[${title}]: ` : ``
      switch (typeof value) {
        case "string":
        case "number":
          browserConsoleHtml = `<script>console.log("${browserConsoleTitleString}",${browserConsoleStr})</script>`
          break;
        case 'object':
          if (value == null) {
            browserConsoleHtml = `<script>console.log("${browserConsoleTitleString}",${browserConsoleStr})</script>`
          } else {

            let showTitle = title ? `<script>console.log("${browserConsoleTitleString}")</script>` : ""
            browserConsoleHtml = `${showTitle}<script>console.dir(${browserConsoleStr})</script>`
          }
          break;
        case 'undefined':
        case 'boolean':
        case 'bigint':
          browserConsoleHtml = `<script>console.log("${browserConsoleTitleString}",${browserConsoleStr},)</script>`
          break;
        case 'function':
          browserConsoleHtml = `<script>console.log("${browserConsoleTitleString}",${value.toString()})</script>`
          break;
        default:
          browserConsoleHtml = `<script>console.log("${browserConsoleTitleString}","Not sure what that is!")</script>`
      }

    } else {
      browserConsoleHtml = ""
    }


    /* logging to template */
    if (options.logToHtml) {
      const css = `
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

      const html = `
        <div class="code-block">
          ${title ? "<p class='title'>" + title + "</p>" : ""} 
          <pre><code>${options.escapeHTML ? escapeHtml(htmlStr) : htmlStr}</code></pre>
        </div>`;

      return css + browserConsoleHtml + html;
    } else {
      // We have to return something or you get undefined in your template.
      // Will return a <script> tag (defined above) if logToBrowserConsole is true
      // or "" if logToBrowserConsole is set to false.
      return browserConsoleHtml
    }
  });
};
export default logToConsole