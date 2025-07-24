/**
 * Default options for logToTerminal
 * @property {boolean} colorizeConsole - Whether to colorize output
 * @property {number} depth - Maximum depth for object inspection
 * @property {number} breakLength - Line break length
 */
export const LOG_TO_TERMINAL_DEFAULTS = {
  colorizeConsole: true,
  depth: 8,
  breakLength: 60
};

import { inspect } from "util";

/**
 * Logs a value to the terminal with enhanced formatting
 * @param {any} value - The value to log
 * @param {string} title - Optional title to prefix the log
 * @param {Object} options - Logging options
 */
const logToTerminal = (value, title, options = {}) => {
  const {
    colorizeConsole,
    depth,
    breakLength
  } = Object.assign({}, LOG_TO_TERMINAL_DEFAULTS, options);

  try {
    const titleString = title ? `[${title}]: ` : '';
    switch (typeof value) {
      case "function":
        console.log(`${titleString}${value.toString()}`);
        break;
      case "undefined":
        console.log(`${titleString}undefined`);
        break;
      case "symbol":
        console.log(`${titleString}${value.toString()}`);
        break;
      default:
        const terminalStr = inspect(value, {
          showHidden: false,
          depth,
          colors: colorizeConsole,
          breakLength,
          compact: false
        });
        console.log(`${titleString}${terminalStr}`);
    }
  } catch (error) {
    console.error('Error in logToTerminal:', error);
    console.log(`${title ? `[${title}]: ` : ''}[Error logging value: ${error.message}]`);
  }
};

export { logToTerminal };