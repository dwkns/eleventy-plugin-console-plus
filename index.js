import { logToTerminal } from "./lib/logToTerminal.js";
import { stringifyPlus } from "./lib/stringify-plus.js";
import { jsonViewer } from "./lib/json-viewer.js";

// utility function to log value to a template, terminal and browser console.
let consolePlus = async (eleventyConfig, options) => {
  let defaults = {
    title: "",
    logToHtml: true, // log to HTML
    logToTerminal: true, // log to terminal
    logToBrowserConsole: true, // log to browser console
    
    // logToTerminal options 
    colorizeConsole: true, // colorize the output (where possible)
    depth: 8, // depth of object to print
    breakLength: 60,// length of line to break

    
    // log to HTML options
    
    // StringifyPlus options
    showTemplate: false,
    maxCircularDepth: 1,
    removeKeys: [],

    // jsonViewer options
    showTypes: false,
    defaultExpanded: false,
    pathsOnHover: false,
    showControls: false,
    indentWidth: 6,
  };
  options = Object.assign({}, defaults, options);

  eleventyConfig.addAsyncShortcode("console", async (value, options) => {

    options = Object.assign({}, defaults, options);

    // log to terminal
    if (options.logToTerminal) {
       logToTerminal(value, options.title, options)
    }

    // stringifyPlus is our custom JSON stringifier that deals with 
    // Eleventy quirks and other edge cases.
    const processedValue = await stringifyPlus(value, options);
   
    // function has to return a string or the shortcode wiill error.
    let browserHTML = "" 

    if (options.logToBrowserConsole) {
      // Adds a script tag to output processedValue to the browser console.
      browserHTML = `<script>console.log("${options.title}",${processedValue})</script>`
    }

    if (options.logToHtml) {
      console.log("options", options)
      // Adds a script tag to output processedValue to the browser console.
      let newHTML = await jsonViewer(processedValue, options)
      browserHTML = newHTML + browserHTML
    }



    return browserHTML


  });
};
export default consolePlus
export { consolePlus }