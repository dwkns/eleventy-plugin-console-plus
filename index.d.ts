declare module 'eleventy-plugin-console-plus' {
  interface ConsolePlusOptions {
    // Output destinations
    logToHtml?: boolean;
    logToTerminal?: boolean;
    logToBrowserConsole?: boolean;
    
    // Terminal logging options
    colorizeConsole?: boolean;
    depth?: number;
    breakLength?: number;
    
    // StringifyPlus options
    showTemplate?: boolean;
    maxCircularDepth?: number;
    removeKeys?: Array<string | { keyName: string; replaceString: string }>;

    // JSON viewer options
    showTypes?: boolean;
    defaultExpanded?: boolean;
    pathsOnHover?: boolean;
    showControls?: boolean;
    indentWidth?: number;
    
    // General options
    title?: string;
  }

  interface EleventyConfig {
    addAsyncShortcode(name: string, callback: (value: any, options?: ConsolePlusOptions) => Promise<string>): void;
  }

  function consolePlus(eleventyConfig: EleventyConfig, options?: ConsolePlusOptions): void;

  export default consolePlus;
  export { consolePlus };
} 