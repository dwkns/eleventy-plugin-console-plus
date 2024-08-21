# eleventy-plugin-console-plus


Provides an Eleventy shortcode that Pretty Prints out your variables to HTML `<pre></pre>`  And if you want it, your temrminal. Strings, Arrays and Objects are Supported 


## Installing

### npm
```bash
$ npm install eleventy-plugin-console-plus
```

### Yarn
```bash
$ yarn add eleventy-plugin-console-plus
```

### Add to your config. Usually `.eleventy.js`
```js
 import logToConsole from 'eleventy-plugin-console-plus'

export default async  (eleventyConfig)=> {
  // default options shown
  options = {
    logToHtml: true, // log to HTML
    logToTerminal: true, // log to terminal
    colorizeConsole: true, // colorize the console output
    escapeHTML: true, // escape HTML in the output
    depth: 4 // depth of object to print
	}
  eleventyConfig.addPlugin(logToConsole);
}
```

### Usage
```
{{ console <value>, <"title" — optional> }}

```



