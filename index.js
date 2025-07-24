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

/**
 * Merge options in the correct order of precedence:
 * 1. lib defaults
 * 2. plugin defaults
 * 3. plugin registration options
 * 4. shortcode options
 */
function mergeAllOptions({
  libDefaults = {},
  pluginDefaults = {},
  pluginRegistration = {},
  shortcode = {}
}) {
  return Object.assign({}, libDefaults, pluginDefaults, pluginRegistration, shortcode);
}

/**
 * Console Plus plugin for Eleventy
 * Provides enhanced logging capabilities for debugging Eleventy projects
 * @param {Object} eleventyConfig - Eleventy configuration object
 * @param {Object} pluginRegistrationOptions - Plugin configuration options
 */
function consolePlus(eleventyConfig, pluginRegistrationOptions = {}) {
  eleventyConfig.addAsyncShortcode("console", async (value, shortcodeOptions = {}) => {
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

export default consolePlus;
export { consolePlus };