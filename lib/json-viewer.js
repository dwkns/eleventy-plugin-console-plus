// json-viewer.js
// Interactive, collapsible JSON viewer with syntax highlighting and controls.

/**
 * Default options for jsonViewer
 * @property {boolean} showTypes - Show type labels
 * @property {boolean} defaultExpanded - Expand nodes by default
 * @property {boolean} pathsOnHover - Show key path hover panel
 * @property {boolean} showControls - Show UI controls
 * @property {number} indentWidth - Indentation width in px
 * @property {string} title - Optional title
 */
export const JSON_VIEWER_DEFAULTS = {
  showTypes: false,
  defaultExpanded: false,
  pathsOnHover: false,
  showControls: false,
  indentWidth: 6,
  title: ''
};

import { stringifyPlus } from "./stringify-plus.js";

// Web Component for JSON Viewer
class JsonViewerComponent extends (typeof HTMLElement !== 'undefined' ? HTMLElement : class {}) {
  constructor() {
    super();
    if (typeof HTMLElement !== 'undefined') {
      this.attachShadow({ mode: 'open' });
    }
    this.options = { ...JSON_VIEWER_DEFAULTS };
    this.data = null;
    this._lastJson = null;
    this.isOptionKeyPressed = false;
    this.expandedNodes = new Set();
    this.currentlyOpenPanel = null;
    this.showTimer = null;
    this.hideTimer = null;
  }

  static get observedAttributes() {
    return ['data-json', 'data-title'];
  }

  connectedCallback() {
    this.setupEventListeners();
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }

  setupEventListeners() {
    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Alt' || e.key === 'Option') this.isOptionKeyPressed = true;
      });
      document.addEventListener('keyup', (e) => {
        if (e.key === 'Alt' || e.key === 'Option') this.isOptionKeyPressed = false;
      });
    }
  }

  getStyles() {
    return `
      .json-viewer-container {
        font-family: monospace;
        line-height: 1.4;
        color: #333;
        background: #fff;
        padding: 16px;
        border: 1px solid #ddd;
        border-radius: 4px;
        margin: 8px 0;
      }

      .json-viewer-title {
        font-weight: bold;
        font-size: 1.1em;
        margin-bottom: 8px;
      }

      .json-viewer-node {
        position: relative;
      }

      .json-viewer-header {
        display: flex;
        align-items: flex-start;
        gap: 4px;
        padding-left: 16px;
        min-height: 14px;
      }

      .json-viewer-toggle {
        cursor: pointer;
        user-select: none;
        width: 14px;
        height: 14px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        position: absolute;
        left: 0;
        top: 0;
        color: #666;
      }

      .json-viewer-key-wrapper {
        position: relative;
        display: inline-block;
      }

      .json-viewer-key {
        color: #0066cc;
        position: relative;
        cursor: pointer;
      }

      .json-viewer-key-panel {
        display: none;
        position: absolute;
        left: 0;
        top: 100%;
        z-index: 10;
        background: #f9f9f9;
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 4px 10px;
        margin-top: 2px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        font-size: 0.88em;
        white-space: nowrap;
        overflow-x: auto;
        color: #222;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .json-viewer-key-panel.show {
        display: flex;
      }

      .json-viewer-key-panel-copy {
        background: #e0eaff;
        border: 1px solid #0066cc;
        border-radius: 2px;
        padding: 1px 4px;
        cursor: pointer;
        font-size: 0.75em;
        color: #0056b3;
        user-select: none;
      }

      .json-viewer-key-panel-copy:hover {
        background: #cce0ff;
      }

      .json-viewer-value {
        color: #333;
        flex: 1;
      }

      .json-viewer-string {
        color: #d63384;
      }

      .json-viewer-number {
        color: #0d6efd;
      }

      .json-viewer-boolean {
        color: #198754;
      }

      .json-viewer-null {
        color: #6c757d;
        font-style: italic;
      }

      .json-viewer-undefined {
        color: #6c757d;
        font-style: italic;
      }

      .json-viewer-function {
        color: #fd7e14;
        font-style: italic;
      }

      .json-viewer-symbol {
        color: #dc3545;
        font-style: italic;
      }

      .json-viewer-bigint {
        color: #0d6efd;
      }

      .json-viewer-array {
        color: #0d6efd;
      }

      .json-viewer-object {
        color: #333;
      }

      .json-viewer-expanded {
        display: block;
      }

      .json-viewer-collapsed {
        display: none;
      }

      .json-viewer-circ-ref {
        color: #dc3545;
        font-style: italic;
      }

      .json-viewer-type {
        color: #666;
        font-size: 0.8em;
        margin: 0 4px;
      }

      .json-viewer-count {
        color: #666;
        font-size: 0.8em;
      }

      .json-viewer-date {
        color: #d63384;
      }

      .json-viewer-controls {
        margin-bottom: 12px;
        display: flex;
        gap: 12px;
      }

      .json-viewer-control {
        display: flex;
        align-items: center;
        gap: 4px;
        cursor: pointer;
        user-select: none;
        color: #666;
      }

      .json-viewer-control input[type="checkbox"] {
        margin: 0;
      }

      .json-viewer-controls-toggle {
        margin-bottom: 8px;
        padding: 2px 10px;
        font-size: 1em;
        border: 1px solid #bbb;
        border-radius: 3px;
        background: #f0f0f0;
        color: #333;
        cursor: pointer;
        transition: background 0.2s, color 0.2s;
      }

      .json-viewer-controls-toggle:hover {
        background: #e0eaff;
        color: #0056b3;
      }

      .json-viewer-collapsed-preview {
        display: inline-flex;
        gap: 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
      }

      .json-viewer-preview-item {
        display: inline-flex;
        gap: 4px;
      }

      .json-viewer-removed-template {
        color: #ffb300;
        font-style: italic;
      }

      .json-viewer-replaced-value {
        color: #ffb300;
        font-style: italic;
      }
    `;
  }

  setOptions(options) {
    this.options = { ...JSON_VIEWER_DEFAULTS, ...options };
  }

  setData(data) {
    this.data = data;
    this._lastJson = data;
  }

  render() {
    if (typeof HTMLElement === 'undefined') return;
    
    const jsonData = this.getAttribute('data-json');
    const title = this.getAttribute('data-title') || '';
    
    if (!jsonData) return;

    try {
      const data = JSON.parse(jsonData);
      this.data = data;
      this._lastJson = jsonData;
    } catch (e) {
      console.error('Invalid JSON data:', jsonData);
      return;
    }

    // Create shadow DOM content
    this.shadowRoot.innerHTML = `
      <style>${this.getStyles()}</style>
      <div class="json-viewer-container">
        ${this.options.showControls ? this.createControlsHTML() : ''}
        ${title ? `<div class="json-viewer-title">${title}</div>` : ''}
        <div class="json-viewer-content"></div>
      </div>
    `;

    const content = this.shadowRoot.querySelector('.json-viewer-content');
    const root = this.createNode(null, this.data);
    content.appendChild(root);

    // Set up event listeners
    this.setupComponentEventListeners();
  }

  createControlsHTML() {
    return `
      <div class="json-viewer-controls-wrapper">
        <div class="json-viewer-controls-toggle" id="controls-toggle">⚙️ Controls</div>
        <div class="json-viewer-controls" id="controls" style="display: none;">
          <label class="json-viewer-control">
            <input type="checkbox" id="types-checkbox" ${this.options.showTypes ? 'checked' : ''}>
            Show Types
          </label>
          <label class="json-viewer-control">
            <input type="checkbox" id="paths-checkbox" ${this.options.pathsOnHover ? 'checked' : ''}>
            Show Paths on Hover
          </label>
        </div>
      </div>
    `;
  }

  setupComponentEventListeners() {
    if (typeof HTMLElement === 'undefined') return;
    
    // Controls toggle
    const controlsToggle = this.shadowRoot.getElementById('controls-toggle');
    const controls = this.shadowRoot.getElementById('controls');
    if (controlsToggle && controls) {
      controlsToggle.addEventListener('click', () => {
        controls.style.display = controls.style.display === 'none' ? 'block' : 'none';
      });
    }

    // Types checkbox
    const typesCheckbox = this.shadowRoot.getElementById('types-checkbox');
    if (typesCheckbox) {
      typesCheckbox.addEventListener('change', () => {
        this.options.showTypes = typesCheckbox.checked;
        this.updateDisplay();
      });
    }

    // Paths checkbox
    const pathsCheckbox = this.shadowRoot.getElementById('paths-checkbox');
    if (pathsCheckbox) {
      pathsCheckbox.addEventListener('change', () => {
        this.options.pathsOnHover = pathsCheckbox.checked;
        this.refresh();
      });
    }
  }

  updateDisplay() {
    if (typeof HTMLElement === 'undefined') return;
    
    const typeLabels = this.shadowRoot.querySelectorAll('.json-viewer-type');
    typeLabels.forEach(label => {
      const node = label.closest('.json-viewer-node');
      const isRootLevel = !node.hasAttribute('data-key');
      if (!isRootLevel) {
        label.style.display = this.options.showTypes ? 'inline' : 'none';
      }
    });
  }

  refresh() {
    if (typeof HTMLElement === 'undefined') return;
    
    const content = this.shadowRoot.querySelector('.json-viewer-content');
    if (content) {
      content.innerHTML = '';
      const root = this.createNode(null, this.data);
      content.appendChild(root);
      this.setupComponentEventListeners();
    }
  }

  getType(value) {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    if (value instanceof Date) return 'date';
    if (typeof value === 'string' && value === '[ undefined ]') return 'undefined';
    if (typeof value === 'string' && value.startsWith('[function') && value.endsWith(']')) return 'function';
    if (typeof value === 'string' && value.startsWith('[Circular Ref:')) return 'Circular Ref';
    if (typeof value === 'string') {
      // Remove surrounding quotes if present, then check for date pattern
      const cleanValue = value.replace(/^"|"$/g, '');
      // Simple date detection: check if it looks like an ISO date string
      if (cleanValue.length >= 20 && 
          cleanValue.includes('T') && 
          cleanValue.includes('-') && 
          cleanValue.includes(':') && 
          !isNaN(new Date(cleanValue).getTime())) {
        return 'date';
      }
    }
    return typeof value;
  }

  getCount(value) {
    if (Array.isArray(value)) return value.length;
    if (typeof value === 'object' && value !== null) return Object.keys(value).length;
    return null;
  }

  createPreviewNode(value) {
    if (typeof document === 'undefined') return null;
    
    const previewContainer = document.createElement('span');
    const type = this.getType(value);

    if (type === 'object') {
      const keys = Object.keys(value);
      if (keys.length === 0) {
        previewContainer.textContent = '{}';
        return previewContainer;
      }

      previewContainer.appendChild(document.createTextNode('{ '));
      
      keys.slice(0, 5).forEach((key, index) => {
        const item = document.createElement('span');
        item.className = 'json-viewer-preview-item';
        const keySpan = document.createElement('span');
        keySpan.className = 'json-viewer-key';
        keySpan.textContent = `"${key}":`;
        item.appendChild(keySpan);
        
        const valueType = this.getType(value[key]);
        let valueText = '';
        if (valueType === 'string') {
          valueText = `"${String(value[key]).slice(0, 20)}${String(value[key]).length > 20 ? '...' : ''}"`;
        } else if (valueType === 'object' && !Array.isArray(value[key])) {
          valueText = '{...}';
        } else if (valueType === 'array') {
          valueText = `[${value[key].length}]`;
        } else {
          valueText = String(value[key]);
        }
        
        const valueSpan = document.createElement('span');
        valueSpan.textContent = valueText;
        item.appendChild(valueSpan);
        
        previewContainer.appendChild(item);
        if (index < Math.min(keys.length, 5) - 1) {
          previewContainer.appendChild(document.createTextNode(', '));
        }
      });

      if (keys.length > 5) {
        previewContainer.appendChild(document.createTextNode(` ... +${keys.length - 5} more`));
      }
      
      previewContainer.appendChild(document.createTextNode(' }'));
    } else if (type === 'array') {
      previewContainer.appendChild(document.createTextNode('['));
      
      value.slice(0, 3).forEach((item, index) => {
        const itemType = this.getType(item);
        let itemText = '';
        if (itemType === 'string') {
          itemText = `"${String(item).slice(0, 15)}${String(item).length > 15 ? '...' : ''}"`;
        } else if (itemType === 'object' && !Array.isArray(item)) {
          itemText = '{...}';
        } else if (itemType === 'array') {
          itemText = `[${item.length}]`;
        } else {
          itemText = String(item);
        }
        previewContainer.appendChild(document.createTextNode(itemText));
        if (index < Math.min(value.length, 3) - 1) {
          previewContainer.appendChild(document.createTextNode(', '));
        }
      });

      if (value.length > 3) {
        previewContainer.appendChild(document.createTextNode(` ... +${value.length - 3} more`));
      }
      
      previewContainer.appendChild(document.createTextNode(']'));
    }

    return previewContainer;
  }

  createNode(key, value, path = '') {
    if (typeof document === 'undefined') return null;
    
    const node = document.createElement('div');
    node.className = 'json-viewer-node';
    
    if (key !== null) {
      node.setAttribute('data-key', key);
    }

    const type = this.getType(value);
    const count = this.getCount(value);
    const isExpandable = (type === 'object' || type === 'array') && count > 0;
    const isExpanded = this.options.defaultExpanded || this.expandedNodes.has(path);

    // Create header
    const header = document.createElement('div');
    header.className = 'json-viewer-header';

    // Create toggle button for expandable nodes
    if (isExpandable) {
      const toggle = document.createElement('span');
      toggle.className = 'json-viewer-toggle';
      toggle.textContent = isExpanded ? '▼' : '▶';
      toggle.addEventListener('click', () => {
        if (isExpanded) {
          this.expandedNodes.delete(path);
        } else {
          this.expandedNodes.add(path);
        }
        this.refresh();
      });
      header.appendChild(toggle);
    }

    // Create key wrapper if there's a key
    if (key !== null) {
      const keyWrapper = document.createElement('span');
      keyWrapper.className = 'json-viewer-key-wrapper';

      const keySpan = document.createElement('span');
      keySpan.className = 'json-viewer-key';
      keySpan.textContent = `"${key}":`;
      
      // Add hover panel for key paths if enabled
      if (this.options.pathsOnHover) {
        const panel = document.createElement('div');
        panel.className = 'json-viewer-key-panel';
        panel.textContent = path;
        
        const copySpan = document.createElement('span');
        copySpan.className = 'json-viewer-key-panel-copy';
        copySpan.textContent = 'Copy';
        copySpan.addEventListener('click', (e) => {
          e.stopPropagation();
          if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(path);
          }
        });
        panel.appendChild(copySpan);

        keyWrapper.appendChild(panel);

        keySpan.addEventListener('mouseenter', () => {
          if (this.currentlyOpenPanel) {
            this.currentlyOpenPanel.classList.remove('show');
          }
          panel.classList.add('show');
          this.currentlyOpenPanel = panel;
        });

        keySpan.addEventListener('mouseleave', () => {
          if (this.hideTimer) {
            clearTimeout(this.hideTimer);
          }
          this.hideTimer = setTimeout(() => {
            panel.classList.remove('show');
            this.currentlyOpenPanel = null;
          }, 100);
        });
      }

      keyWrapper.appendChild(keySpan);
      header.appendChild(keyWrapper);
    }

    // Create value
    const valueSpan = document.createElement('span');
    valueSpan.className = `json-viewer-value json-viewer-${type}`;

    if (isExpandable) {
      if (isExpanded) {
        // Show expanded content
        const expandedContent = document.createElement('div');
        expandedContent.className = 'json-viewer-expanded';
        expandedContent.style.paddingLeft = `${this.options.indentWidth}px`;

        if (type === 'object') {
          Object.entries(value).forEach(([k, v]) => {
            const childPath = path ? `${path}.${k}` : k;
            const childNode = this.createNode(k, v, childPath);
            expandedContent.appendChild(childNode);
          });
        } else if (type === 'array') {
          value.forEach((item, index) => {
            const childPath = `${path}[${index}]`;
            const childNode = this.createNode(index, item, childPath);
            expandedContent.appendChild(childNode);
          });
        }

        node.appendChild(header);
        node.appendChild(expandedContent);
      } else {
        // Show collapsed preview
        const preview = this.createPreviewNode(value);
        valueSpan.appendChild(preview);
        header.appendChild(valueSpan);
        node.appendChild(header);
      }
    } else {
      // Show simple value
      let displayValue = value;
      if (type === 'string') {
        displayValue = `"${value}"`;
      } else if (type === 'null') {
        displayValue = 'null';
      } else if (type === 'undefined') {
        displayValue = 'undefined';
      }
      valueSpan.textContent = displayValue;
      header.appendChild(valueSpan);
      node.appendChild(header);
    }

    // Add type label if enabled and not root level
    if (this.options.showTypes && key !== null) {
      const typeLabel = document.createElement('span');
      typeLabel.className = 'json-viewer-type';
      typeLabel.textContent = `<${type}>`;
      header.appendChild(typeLabel);
    }

    // Add count if applicable and not root level
    if (count !== null && key !== null) {
      const countLabel = document.createElement('span');
      countLabel.className = 'json-viewer-count';
      countLabel.textContent = `(${count})`;
      header.appendChild(countLabel);
    }

    return node;
  }
}

// Register the custom element (only in browser environment)
if (typeof customElements !== 'undefined' && !customElements.get('json-viewer')) {
  customElements.define('json-viewer', JsonViewerComponent);
}

// Track if we've added the registration script to this page
let pageHasRegistrationScript = false;

const JSONViewerModule = {
  /**
   * Generates a unique ID for each JSON viewer instance
   * @returns {string} A unique ID prefixed with 'json-viewer-'
   */
  generateId: () => `json-viewer-${Math.random().toString(36).substr(2, 9)}`,

  /**
   * Generates the complete HTML output for the JSON viewer
   * @param {*} json - The JSON data to display
   * @param {Object} options - Viewer configuration options
   * @param {string} [options.title] - Optional title to display above the controls
   * @returns {string} The complete HTML output
   */
  generate: (json, options = {}) => {
    // If json is already a string (from stringifyPlus), use it directly
    // Otherwise, stringify it
    const jsonString = typeof json === 'string' ? json : JSON.stringify(json);
    const escapedJsonString = jsonString.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    // The title will be rendered by JS if present
    return `<json-viewer data-json='${escapedJsonString}' data-title='${options.title ? options.title.replace(/'/g, '&#39;').replace(/"/g, '&quot;') : ''}'></json-viewer>`;
  }
};

// Get the component registration script (only once per page)
const getRegistrationScript = () => {
  if (pageHasRegistrationScript) {
    return '';
  }
  
  pageHasRegistrationScript = true;
  
  return `
if (!window.jsonViewerRegistered) {
  window.jsonViewerRegistered = true;
  
  // Define the JSON Viewer Web Component
  class JsonViewerComponent extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.options = {
        showTypes: false,
        defaultExpanded: false,
        pathsOnHover: false,
        showControls: false,
        indentWidth: 6,
        title: ''
      };
      this.data = null;
      this._lastJson = null;
      this.isOptionKeyPressed = false;
      this.expandedNodes = new Set();
      this.currentlyOpenPanel = null;
      this.showTimer = null;
      this.hideTimer = null;
    }

    static get observedAttributes() {
      return ['data-json', 'data-title'];
    }

    connectedCallback() {
      this.setupEventListeners();
      this.render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue !== newValue) {
        this.render();
      }
    }

    setupEventListeners() {
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Alt' || e.key === 'Option') this.isOptionKeyPressed = true;
      });
      document.addEventListener('keyup', (e) => {
        if (e.key === 'Alt' || e.key === 'Option') this.isOptionKeyPressed = false;
      });
    }

    getStyles() {
      return \`
        .json-viewer-container {
          font-family: monospace;
          line-height: 1.4;
          color: #333;
          background: #fff;
          padding: 16px;
          border: 1px solid #ddd;
          border-radius: 4px;
          margin: 8px 0;
        }
        .json-viewer-title {
          font-weight: bold;
          font-size: 1.1em;
          margin-bottom: 8px;
        }
        .json-viewer-node {
          position: relative;
        }
        .json-viewer-header {
          display: flex;
          align-items: flex-start;
          gap: 4px;
          padding-left: 16px;
          min-height: 14px;
        }
        .json-viewer-toggle {
          cursor: pointer;
          user-select: none;
          width: 14px;
          height: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          position: absolute;
          left: 0;
          top: 0;
          color: #666;
        }
        .json-viewer-key {
          color: #0066cc;
          position: relative;
          cursor: pointer;
        }
        .json-viewer-value {
          color: #333;
          flex: 1;
        }
        .json-viewer-string { color: #d63384; }
        .json-viewer-number { color: #0d6efd; }
        .json-viewer-boolean { color: #198754; }
        .json-viewer-null { color: #6c757d; font-style: italic; }
        .json-viewer-undefined { color: #6c757d; font-style: italic; }
        .json-viewer-function { color: #fd7e14; font-style: italic; }
        .json-viewer-symbol { color: #dc3545; font-style: italic; }
        .json-viewer-bigint { color: #0d6efd; }
        .json-viewer-array { color: #0d6efd; }
        .json-viewer-object { color: #333; }
        .json-viewer-expanded { display: block; }
        .json-viewer-collapsed { display: none; }
        .json-viewer-circ-ref { color: #dc3545; font-style: italic; }
        .json-viewer-type { color: #666; font-size: 0.8em; margin: 0 4px; }
        .json-viewer-count { color: #666; font-size: 0.8em; }
        .json-viewer-date { color: #d63384; }
      \`;
    }

    render() {
      const jsonData = this.getAttribute('data-json');
      const title = this.getAttribute('data-title') || '';
      
      if (!jsonData) return;

      try {
        const data = JSON.parse(jsonData);
        this.data = data;
        this._lastJson = jsonData;
      } catch (e) {
        console.error('Invalid JSON data:', jsonData);
        return;
      }

      // Create shadow DOM content
      this.shadowRoot.innerHTML = '<style>' + this.getStyles() + '</style><div class="json-viewer-container">' + (title ? '<div class="json-viewer-title">' + title + '</div>' : '') + '<div class="json-viewer-content"></div></div>';

      const content = this.shadowRoot.querySelector('.json-viewer-content');
      const root = this.createNode(null, this.data);
      content.appendChild(root);
    }

    getType(value) {
      if (value === null) return 'null';
      if (Array.isArray(value)) return 'array';
      if (value instanceof Date) return 'date';
      if (typeof value === 'string' && value === '[ undefined ]') return 'undefined';
      if (typeof value === 'string' && value.startsWith('[function') && value.endsWith(']')) return 'function';
      if (typeof value === 'string' && value.startsWith('[Circular Ref:')) return 'Circular Ref';
      return typeof value;
    }

    getCount(value) {
      if (Array.isArray(value)) return value.length;
      if (typeof value === 'object' && value !== null) return Object.keys(value).length;
      return null;
    }

    createNode(key, value, path = '') {
      const node = document.createElement('div');
      node.className = 'json-viewer-node';
      
      if (key !== null) {
        node.setAttribute('data-key', key);
      }

      const type = this.getType(value);
      const count = this.getCount(value);
      const isExpandable = (type === 'object' || type === 'array') && count > 0;
      const isExpanded = this.options.defaultExpanded || this.expandedNodes.has(path);

      // Create header
      const header = document.createElement('div');
      header.className = 'json-viewer-header';

      // Create toggle button for expandable nodes
      if (isExpandable) {
        const toggle = document.createElement('span');
        toggle.className = 'json-viewer-toggle';
        toggle.textContent = isExpanded ? '▼' : '▶';
        toggle.addEventListener('click', () => {
          if (isExpanded) {
            this.expandedNodes.delete(path);
          } else {
            this.expandedNodes.add(path);
          }
          this.render();
        });
        header.appendChild(toggle);
      }

      // Create key wrapper if there's a key
      if (key !== null) {
        const keySpan = document.createElement('span');
        keySpan.className = 'json-viewer-key';
        keySpan.textContent = '"' + key + '":';
        header.appendChild(keySpan);
      }

      // Create value
      const valueSpan = document.createElement('span');
      valueSpan.className = 'json-viewer-value json-viewer-' + type;

      if (isExpandable) {
        if (isExpanded) {
          // Show expanded content
          const expandedContent = document.createElement('div');
          expandedContent.className = 'json-viewer-expanded';
          expandedContent.style.paddingLeft = this.options.indentWidth + 'px';

          if (type === 'object') {
            Object.entries(value).forEach(([k, v]) => {
              const childPath = path ? path + '.' + k : k;
              const childNode = this.createNode(k, v, childPath);
              expandedContent.appendChild(childNode);
            });
          } else if (type === 'array') {
            value.forEach((item, index) => {
              const childPath = path + '[' + index + ']';
              const childNode = this.createNode(index, item, childPath);
              expandedContent.appendChild(childNode);
            });
          }

          node.appendChild(header);
          node.appendChild(expandedContent);
        } else {
          // Show collapsed preview
          let previewText = '';
          if (type === 'object') {
            const keys = Object.keys(value);
            previewText = keys.length === 0 ? '{}' : '{ ' + keys.slice(0, 3).map(k => '"' + k + '": ...').join(', ') + (keys.length > 3 ? ', ...' : '') + ' }';
          } else if (type === 'array') {
            previewText = '[' + value.length + ' items]';
          }
          valueSpan.textContent = previewText;
          header.appendChild(valueSpan);
          node.appendChild(header);
        }
      } else {
        // Show simple value
        let displayValue = value;
        if (type === 'string') {
          displayValue = '"' + value + '"';
        } else if (type === 'null') {
          displayValue = 'null';
        } else if (type === 'undefined') {
          displayValue = 'undefined';
        }
        valueSpan.textContent = displayValue;
        header.appendChild(valueSpan);
        node.appendChild(header);
      }

      return node;
    }
  }

  // Register the custom element
  if (!customElements.get('json-viewer')) {
    customElements.define('json-viewer', JsonViewerComponent);
  }
}
`;
};

/**
 * Renders the JSON viewer as HTML
 * @param {*} processedJSON - The JSON data to display (should be stringified)
 * @param {Object} options - Viewer configuration options
 * @returns {string} The complete HTML output
 */
const jsonViewer = async function jsonViewer(processedJSON, options = {}) {
  options = Object.assign({}, JSON_VIEWER_DEFAULTS, options);
  const html = JSONViewerModule.generate(processedJSON, options);
  const script = `<script>${getRegistrationScript()}</script>`;
  return html + script;
}

export { jsonViewer, JsonViewerComponent };
export default jsonViewer;