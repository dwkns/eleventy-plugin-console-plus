/**
 * Default options for consolePlus plugin
 * @property {boolean} logToHtml - Output to HTML
 * @property {boolean} logToTerminal - Output to terminal
 * @property {boolean} logToBrowserConsole - Output to browser console
 * @property {string} title - Optional title
 * @property {boolean} colorizeConsole - Colorize terminal output
 * @property {number} depth - Terminal object depth
 * @property {number} breakLength - Terminal line break length
 * @property {boolean} showTemplate - Show 'template' keys in objects
 * @property {number} maxCircularDepth - Max depth for circular references
 * @property {Array} removeKeys - Keys to remove/replace
 * @property {boolean} showTypes - Show type labels in viewer
 * @property {boolean} defaultExpanded - Expand nodes by default
 * @property {boolean} pathsOnHover - Show key path hover panel
 * @property {boolean} showControls - Show UI controls
 * @property {number} indentWidth - Indentation width in px
 */
export const CONSOLE_PLUS_DEFAULTS = {
  logToHtml: true,
  logToTerminal: true,
  logToBrowserConsole: true,
  title: '',
  colorizeConsole: true,
  depth: 8,
  breakLength: 60,
  showTemplate: false,
  maxCircularDepth: 1,
  removeKeys: [],
  showTypes: false,
  defaultExpanded: false,
  pathsOnHover: false,
  showControls: false,
  indentWidth: 6
};

import { logToTerminal, LOG_TO_TERMINAL_DEFAULTS } from "./lib/logToTerminal.js";
import { stringifyPlus, STRINGIFY_PLUS_DEFAULTS } from "./lib/stringify-plus.js";
import { jsonViewer, JSON_VIEWER_DEFAULTS } from "./lib/json-viewer.js";

function mergeAllOptions({
  libDefaults = {},
  pluginDefaults = {},
  pluginRegistration = {},
  shortcode = {}
}) {
  return Object.assign({}, libDefaults, pluginDefaults, pluginRegistration, shortcode);
}

/**
 * Flexible argument parser for the console shortcode.
 * Supports:
 *   - value
 *   - value, "title"
 *   - value, { options }
 *   - value, "title", { options }
 *   - value, { title: "title", ... }
 * Returns: { value, options }
 */
function parseConsoleArgs(args) {
  const [value, arg2, arg3] = args;
  let options = {};
  if (typeof arg2 === 'string' && arg3 && typeof arg3 === 'object') {
    // value, "title", { options }
    options = { ...arg3, title: arg2 };
  } else if (typeof arg2 === 'string') {
    // value, "title"
    options = { title: arg2 };
  } else if (arg2 && typeof arg2 === 'object') {
    // value, { options }
    options = { ...arg2 };
  } // else: value only
  return { value, options };
}

function consolePlus(eleventyConfig, pluginRegistrationOptions = {}) {
  eleventyConfig.addAsyncShortcode("console", async function(...args) {
    const { value, options: shortcodeOptions } = parseConsoleArgs(args);
    // Merge all options for each lib
    const mergedTerminalOptions = mergeAllOptions({
      libDefaults: LOG_TO_TERMINAL_DEFAULTS,
      pluginDefaults: CONSOLE_PLUS_DEFAULTS,
      pluginRegistration: pluginRegistrationOptions,
      shortcode: shortcodeOptions
    });
    const mergedStringifyOptions = mergeAllOptions({
      libDefaults: STRINGIFY_PLUS_DEFAULTS,
      pluginDefaults: CONSOLE_PLUS_DEFAULTS,
      pluginRegistration: pluginRegistrationOptions,
      shortcode: shortcodeOptions
    });
    const mergedViewerOptions = mergeAllOptions({
      libDefaults: JSON_VIEWER_DEFAULTS,
      pluginDefaults: CONSOLE_PLUS_DEFAULTS,
      pluginRegistration: pluginRegistrationOptions,
      shortcode: shortcodeOptions
    });
    // Log to terminal if enabled
    if (mergedTerminalOptions.logToTerminal) {
      logToTerminal(value, mergedTerminalOptions.title, mergedTerminalOptions);
    }
    // Process value with stringifyPlus
    const processedValue = await stringifyPlus(value, mergedStringifyOptions);
    // Generate browser console output
    let output = '';
    if (mergedTerminalOptions.logToBrowserConsole) {
      const title = mergedTerminalOptions.title ? `"${mergedTerminalOptions.title}", ` : '';
      output += `<script>console.log(${title}${processedValue});</script>`;
    }
    // Generate HTML viewer output if enabled
    if (mergedTerminalOptions.logToHtml) {
      const viewerHTML = await jsonViewer(processedValue, mergedViewerOptions);
      output = viewerHTML + output;
    }
    return output;
  });
}

export { consolePlus };
export default consolePlus;