# eleventy-plugin-console-plus

**Console Plus** is a powerful Eleventy (11ty) plugin and shortcode for debugging your templates, objects, and data. It logs to your HTML output, your terminal, and your browser console—all at once, with beautiful formatting and deep customization.

---

## ✨ Features

- Pretty-prints any value (object, array, string, etc.) in your template, terminal, and browser console
- Collapsible, interactive HTML viewer with type labels, key paths, and more
- Handles circular references, functions, symbols, BigInts, Dates, and undefined
- Hide or replace sensitive keys (e.g., secrets, templates)
- Full control over output destinations and formatting
- Four-level options system: shortcode > plugin registration > plugin defaults > library defaults
- Works with Eleventy v3+ (ESM)

---

## 🚀 Installation

```bash
npm install eleventy-plugin-console-plus
# or
yarn add eleventy-plugin-console-plus
```

---

## ⚡ Quick Start

In your `.eleventy.js` or `eleventy.config.js`:

```js
import consolePlus from 'eleventy-plugin-console-plus';

export default function(eleventyConfig) {
  eleventyConfig.addPlugin(consolePlus, {
    // Optional: set global plugin options here
    logToHtml: true,
    logToTerminal: true,
    logToBrowserConsole: true,
    colorizeConsole: true,
    depth: 4,
    breakLength: 60
  });
}
```

In your template:

```njk
{% console myObject, { title: "Debug myObject" } %}
```

---

## 🛠️ Usage

### 1. **Basic Usage**

```njk
{% console "Hello, world!" %}
{% console 123 %}
{% console myArray %}
{% console myObject %}
```

### 2. **With a Title**

```njk
{% console myObject, { title: "My Object" } %}
```

### 3. **Controlling Output Destinations**

```njk
{% console myObject, { logToHtml: true, logToTerminal: false, logToBrowserConsole: true } %}
```

### 4. **Hiding or Replacing Keys**

```njk
{% console myObject, { removeKeys: ["secret", { keyName: "password", replaceString: "***" }] } %}
```

### 5. **Showing Template Keys**

```njk
{% console myObject, { showTemplate: true } %}
```

### 6. **Customizing the HTML Viewer**

```njk
{% console myObject, { showTypes: true, showControls: true, defaultExpanded: true, pathsOnHover: true, indentWidth: 12 } %}
```

### 7. **Handling Circular References**

```njk
{% set obj = { a: 1 } %}
{% set obj = obj.self = obj %}
{% console obj %}
```

### 8. **Option Precedence**

Options are merged in this order (highest wins):
1. Options passed in the shortcode
2. Options set in `addPlugin(consolePlus, options)`
3. Plugin defaults (see below)
4. Library defaults (see source for each lib)

---

## ⚙️ Options Reference

| Option              | Type      | Default   | Description |
|---------------------|-----------|-----------|-------------|
| logToHtml           | boolean   | true      | Output to HTML viewer |
| logToTerminal       | boolean   | true      | Output to terminal |
| logToBrowserConsole | boolean   | true      | Output to browser console |
| title               | string    | ""        | Optional title for output |
| colorizeConsole     | boolean   | true      | Colorize terminal output |
| depth               | number    | 8         | Terminal object depth |
| breakLength         | number    | 60        | Terminal line break length |
| showTemplate        | boolean   | false     | Show 'template' keys in objects |
| maxCircularDepth    | number    | 1         | Max depth for circular references |
| removeKeys          | array     | []        | Keys to remove/replace (string or {keyName, replaceString}) |
| showTypes           | boolean   | false     | Show type labels in viewer |
| defaultExpanded     | boolean   | false     | Expand nodes by default in viewer |
| pathsOnHover        | boolean   | false     | Show key path hover panel in viewer |
| showControls        | boolean   | false     | Show UI controls in viewer |
| indentWidth         | number    | 6         | Indentation width in px in viewer |

---

## 🖼️ Screenshots

### HTML Output
![HTML Output](./template.png)

### Terminal Output
![Terminal Output](./terminal.png)

### Browser Console Output
![Browser Console Output](./browser-console.png)

> **Tip:** Add more screenshots for key hiding, circular references, and advanced viewer features as needed.

---

## ❓ Troubleshooting & FAQ

- **Q: Why don't I see output in my terminal?**  
  A: Make sure `logToTerminal` is true and your Eleventy process is running in a terminal that supports color.

- **Q: Why are some keys hidden or replaced?**  
  A: Check your `removeKeys` and `showTemplate` options.

- **Q: How do I debug circular references?**  
  A: The plugin will show `[Circular Ref: ...]` in the output.

- **Q: Can I use this in CommonJS Eleventy?**  
  A: Use version 0.0.3 for CommonJS support.

---

## 📝 Changelog

See [CHANGELOG.md](./CHANGELOG.md) for release notes.

---

## 📄 License

MIT 