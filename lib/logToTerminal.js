import { inspect } from "util";
const logToTerminal = (value,options) => {
   /* logging to terminal */
  
    let terminalStr = inspect(value, {
      showHidden: false,
      depth: options.depth,
      colors: options.colorizeConsole,
      breakLength: options.breakLength
    })

    let terminalTitleString = options.title ? `[${options.title}]: ` : ``
    switch (typeof value) {
      // Functions need to be logged differently to show thier contents.
      case "function":
        console.log(`${terminalTitleString}${value.toString()}`)
        break;
      default:
        console.log(`${terminalTitleString}${terminalStr}`)
    }
  
        
};
export { logToTerminal }