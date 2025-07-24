// json-viewer.js
//
// Interactive, collapsible JSON viewer with syntax highlighting and controls.
// Provides a filter for Eleventy and a reusable module for rendering JSON data.
//
// Author: [Your Name]
//

import { stringifyPlus } from "./stringify-plus.js";
/**
 * JSON Viewer Module and Filter
 * Provides a collapsible, interactive JSON viewer with syntax highlighting
 * and support for toggling types and counts display.
 * Uses a defaults pattern for options: defaults are defined and merged with incoming options, with options taking precedence.
 *
 * @module json-viewer
 */

const JSONViewerModule = {
  /**
   * Generates a unique ID for each JSON viewer instance
   * @returns {string} A unique ID prefixed with 'json-viewer-'
   */
  generateId: () => `json-viewer-${Math.random().toString(36).substr(2, 9)}`,

  /**
   * Returns the CSS styles for the JSON viewer
   * @returns {string} CSS styles as a template literal
   */
  getStyles: () => `
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
      pointer-events: auto;
      cursor: pointer;
    }

    .json-viewer-key-panel-buffer {
      position: absolute;
      left: -12px;
      top: 88%;
      z-index: 9;
      width: calc(100% + 24px);
      height: 36px;
      pointer-events: auto;
      background: transparent;
    }

    .json-viewer-key-path {
      font-family: monospace;
      font-size: 0.95em;
      margin-right: 8px;
      word-break: break-all;
    }

    .json-viewer-copy-btn {
      margin-left: 4px;
      padding: 2px 4px;
      font-size: 1em;
      border: none;
      background: none;
      color: #333;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      position: relative;
    }

    .json-viewer-copy-btn svg {
      width: 16px;
      height: 16px;
      vertical-align: middle;
      fill: #888;
      transition: fill 0.2s;
    }

    .json-viewer-copy-btn:hover svg {
      fill: #0056b3;
    }

    .json-viewer-copy-btn .json-viewer-tooltip {
      visibility: hidden;
      opacity: 0;
      background: #222;
      color: #fff;
      text-align: center;
      border-radius: 4px;
      padding: 2px 8px;
      position: absolute;
      z-index: 20;
      bottom: 125%;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.85em;
      white-space: nowrap;
      pointer-events: none;
      transition: opacity 0.2s;
    }

    .json-viewer-copy-btn:hover .json-viewer-tooltip {
      visibility: visible;
      opacity: 1;
    }

    .json-viewer-string {
      color: #008000;
    }

    .json-viewer-number {
      color: #6c757d;
      font-style: italic;
    }

    .json-viewer-boolean {
      color: #6c757d;
      font-style: italic;
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
      color: #6c757d;
      font-style: italic;
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
  `,

  /**
   * Generates the JavaScript code for the JSON viewer
   * @param {string} containerId - The ID of the container element
   * @param {Object} options - Viewer configuration options
   * @returns {string} JavaScript code as a template literal
   */
  getScript: (containerId, options) => `
    (function() {
      /**
       * JSON Viewer class that handles rendering and interaction
       * @class
       */
      class JSONViewer {
        /**
         * Creates a new JSON viewer instance
         * @param {HTMLElement} container - The container element
         * @param {Object} options - Configuration options
         * @param {boolean} [options.showTypes=true] - Whether to show type labels
         * @param {boolean} [options.defaultExpanded=false] - Whether nodes are expanded by default
         * @param {boolean} [options.pathsOnHover=false] - Whether to show key path hover panel
         * @param {boolean} [options.showControls=true] - Whether to show controls
         * @param {number} [options.indentWidth=8] - The number of pixels to indent each level
         */
        constructor(container, options = {}) {
          // Merge defaults with incoming options (options take precedence)
          this.options = Object.assign({}, options);
          this.container = container;
          this.isOptionKeyPressed = false;
          this.expandedNodes = new Set();
          this.currentlyOpenPanel = null;
          this.showTimer = null;
          this.hideTimer = null;
          this.setupEventListeners();
        }

        /**
         * Sets up keyboard event listeners for the Option/Alt key
         */
        setupEventListeners() {
          document.addEventListener('keydown', (e) => {
            if (e.key === 'Alt' || e.key === 'Option') this.isOptionKeyPressed = true;
          });
          document.addEventListener('keyup', (e) => {
            if (e.key === 'Alt' || e.key === 'Option') this.isOptionKeyPressed = false;
          });
        }

        /**
         * Gets the type of a value
         * @param {*} value - The value to check
         * @returns {string} The type of the value
         */
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

        /**
         * Gets the count of items in an array or object
         * @param {*} value - The value to count
         * @returns {number|null} The count or null if not applicable
         */
        getCount(value) {
          if (Array.isArray(value)) return value.length;
          if (typeof value === 'object' && value !== null) return Object.keys(value).length;
          return null;
        }

        /**
         * Creates a preview string for a collapsed object or array
         * @param {Object|Array} value - The object or array to create a preview for
         * @returns {HTMLElement} A DOM element containing the preview
         */
        createPreviewNode(value) {
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

              const keyEl = document.createElement('span');
              keyEl.className = 'json-viewer-key';
              keyEl.textContent = key + ': ';
              item.appendChild(keyEl);

              const val = value[key];
              const valType = this.getType(val);
              let valEl;

              if (valType === 'object') {
                valEl = this.createValueElement(null);
                valEl.textContent = '{…}';
              } else if (valType === 'array') {
                valEl = this.createValueElement(null);
                valEl.textContent = 'Array(' + this.getCount(val) + ')';
              } else {
                valEl = this.createValueElement(val);
              }
              item.appendChild(valEl);

              previewContainer.appendChild(item);

              if (index < keys.slice(0, 5).length - 1) {
                previewContainer.appendChild(document.createTextNode(', '));
              }
            });

            if (keys.length > 5) {
              previewContainer.appendChild(document.createTextNode(', …'));
            }
            previewContainer.appendChild(document.createTextNode(' }'));

          } else if (type === 'array') {
            if (value.length === 0) {
              previewContainer.textContent = '[]';
              return previewContainer;
            }

            previewContainer.appendChild(document.createTextNode('[ '));
            value.slice(0, 5).forEach((val, index) => {
              const item = document.createElement('span');
              item.className = 'json-viewer-preview-item';
              const valType = this.getType(val);
              let valEl;

              if (valType === 'object') {
                valEl = this.createValueElement(null);
                valEl.textContent = '{…}';
              } else if (valType === 'array') {
                valEl = this.createValueElement(null);
                valEl.textContent = 'Array(' + this.getCount(val) + ')';
              } else {
                valEl = this.createValueElement(val);
              }
              item.appendChild(valEl);

              previewContainer.appendChild(item);

              if (index < value.slice(0, 5).length - 1) {
                previewContainer.appendChild(document.createTextNode(', '));
              }
            });

            if (value.length > 5) {
              previewContainer.appendChild(document.createTextNode(', …'));
            }
            previewContainer.appendChild(document.createTextNode(' ]'));
          }

          return previewContainer;
        }

        /**
         * Creates a toggle button for expandable nodes
         * @returns {HTMLElement} The toggle button element
         */
        createToggleButton() {
          const button = document.createElement('span');
          button.className = 'json-viewer-toggle';
          button.innerHTML = '▶';
          return button;
        }

        /**
         * Creates a type label element
         * @param {string} type - The type to display
         * @returns {HTMLElement} The type label element
         */
        createTypeLabel(type) {
          const label = document.createElement('span');
          label.className = 'json-viewer-type';
          label.textContent = type;
          return label;
        }

        /**
         * Creates a count label element
         * @param {number} count - The count to display
         * @returns {HTMLElement} The count label element
         */
        createCountLabel(count) {
          const label = document.createElement('span');
          label.className = 'json-viewer-count';
          label.textContent = '(' + count + ')';
          return label;
        }

        /**
         * Creates a value element with appropriate styling
         * @param {*} value - The value to display
         * @returns {HTMLElement} The value element
         */
        createValueElement(value) {
          const element = document.createElement('span');
          element.className = 'json-viewer-value';
          
          // Special case: replaced value (no quotes, amber style)
          // Check if value matches any replaceString, any string value in an object entry (shorthand), or is a known replacement message
          const isShorthandReplaced = this.options && Array.isArray(this.options.removeKeys) && this.options.removeKeys.some(entry => {
            if (typeof entry === 'object' && entry !== null) {
              // Check for { keyName, replaceString }
              if (typeof entry.replaceString === 'string' && value === entry.replaceString) return true;
              // Check for shorthand { key: value } (excluding keyName/replaceString)
              return Object.keys(entry).some(k => k !== 'keyName' && k !== 'replaceString' && value === entry[k]);
            }
            return false;
          });
          if (
            isShorthandReplaced ||
            value === 'Replaced as key was in supplied removeKeys' ||
            value === 'Removed for performance reasons. Use { showTemplate: true } to show it'
          ) {
            element.textContent = value;
            element.classList.add('json-viewer-replaced-value');
            return element;
          }

          if (value === null) {
            element.textContent = 'null';
            element.classList.add('json-viewer-null');
          } else if (this.getType(value) === 'date') {
            // For dates, show the original value but style as date
            element.textContent = typeof value === 'string' ? value : '"' + value + '"';
            element.classList.add('json-viewer-date');
          } else if (typeof value === 'string' && value === '[ undefined ]') {
            element.textContent = 'undefined';
            element.classList.add('json-viewer-undefined');
          } else if (typeof value === 'string' && value.startsWith('[function') && value.endsWith(']')) {
            element.textContent = value;
            element.classList.add('json-viewer-function');
          } else if (typeof value === 'string' && value.startsWith('[Circular Ref:')) {
            element.textContent = value;
            element.classList.add('json-viewer-circ-ref');
          } else if (typeof value === 'string') {
            element.textContent = '"' + value + '"';
            element.classList.add('json-viewer-string');
          } else if (typeof value === 'number') {
            element.textContent = value;
            element.classList.add('json-viewer-number');
          } else if (typeof value === 'boolean') {
            element.textContent = value;
            element.classList.add('json-viewer-boolean');
          } else if (value instanceof Date) {
            element.textContent = value.toISOString();
            element.classList.add('json-viewer-date');
          } else {
            element.textContent = JSON.stringify(value);
          }
          return element;
        }

        /**
         * Gets the path to a node in the tree
         * @param {HTMLElement} node - The node element
         * @returns {string} The path to the node
         */
        getNodePath(node) {
          const path = [];
          let current = node;
          while (current && current !== this.container) {
            const key = current.getAttribute('data-key');
            if (key !== null) path.unshift(key);
            current = current.parentElement;
          }
          return path.join('.');
        }

        /**
         * Creates a key element, with hover-to-show-path functionality if enabled.
         * @param {string} key - The key name.
         * @param {string} keyPath - The full path to the key.
         * @returns {HTMLElement} The key element (or a wrapper with hover functionality).
         * @private
         */
        _createKeyElement(key, keyPath) {
          const keyWrapper = document.createElement('span');
          keyWrapper.className = 'json-viewer-key-wrapper';

          const keyElement = document.createElement('span');
          keyElement.className = 'json-viewer-key';
          keyElement.textContent = key + ': ';

          if (this.options.pathsOnHover) {
            // Buffer wrapper
            const buffer = document.createElement('span');
            buffer.className = 'json-viewer-key-panel-buffer';
            buffer.style.display = 'none';
            buffer.appendChild(document.createTextNode(''));

            // Panel
            const panel = document.createElement('span');
            panel.className = 'json-viewer-key-panel';
            panel.style.display = 'none';
            panel.innerHTML =
              '<span class="json-viewer-key-path">' + keyPath + '</span>' +
              '<button class="json-viewer-copy-btn" tabindex="0" aria-label="Copy path to clipboard">' +
                '<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="none"><g fill="#000000"><path fill-rule="evenodd" d="M3.25 2.5H4v.25C4 3.44 4.56 4 5.25 4h5.5C11.44 4 12 3.44 12 2.75V2.5h.75a.75.75 0 01.75.75v3a.75.75 0 001.5 0v-3A2.25 2.25 0 0012.75 1h-.775c-.116-.57-.62-1-1.225-1h-5.5c-.605 0-1.11.43-1.225 1H3.25A2.25 2.25 0 001 3.25v10.5A2.25 2.25 0 003.25 16h9.5A2.25 2.25 0 0015 13.75v-1a.75.75 0 00-1.5 0v1a.75.75 0 01-.75.75h-9.5a.75.75 0 01-.75-.75V3.25a.75.75 0 01.75-.75zm2.25-1v1h5v-1h-5z" clip-rule="evenodd"/><path d="M4.75 5.5a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3zM4 12.25a.75.75 0 01.75-.75h3a.75.75 0 010 1.5h-3a.75.75 0 01-.75-.75zM4.75 8.5a.75.75 0 000 1.5h2a.75.75 0 000-1.5h-2zM16 9.25a.75.75 0 01-.75.75h-4.19l1.22 1.22a.75.75 0 11-1.06 1.06l-2.5-2.5a.752.752 0 010-1.06l2.5-2.5a.75.75 0 111.06 1.06L11.06 8.5h4.19a.75.75 0 01.75.75z"/></g></svg>' +
                  '<span class="json-viewer-tooltip">Copy path to clipboard</span>' +
                '</button>' +
                '<span class="json-viewer-copy-confirm" style="display:none;">Copied!</span>';

            keyWrapper.appendChild(keyElement);
            keyWrapper.appendChild(buffer);
            keyWrapper.appendChild(panel);
            // Copy logic
            const confirmMsg = panel.querySelector('.json-viewer-copy-confirm');
            panel.addEventListener('click', (e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(keyPath).then(() => {
                confirmMsg.style.display = 'inline';
                setTimeout(() => { confirmMsg.style.display = 'none'; }, 1200);
              });
            });
            // --- Delayed show/hide logic (global timers per viewer) ---
            keyWrapper.addEventListener('mouseenter', () => {
              if (this.hideTimer) { clearTimeout(this.hideTimer); this.hideTimer = null; }
              if (this.showTimer) { clearTimeout(this.showTimer); this.showTimer = null; }
              if (this.currentlyOpenPanel && this.currentlyOpenPanel !== panel) {
                this.currentlyOpenPanel.style.display = 'none';
                if (this.currentlyOpenBuffer) this.currentlyOpenBuffer.style.display = 'none';
              }
              this.showTimer = setTimeout(() => {
                if (this.currentlyOpenPanel && this.currentlyOpenPanel !== panel) {
                  this.currentlyOpenPanel.style.display = 'none';
                  if (this.currentlyOpenBuffer) this.currentlyOpenBuffer.style.display = 'none';
                }
                panel.style.display = 'flex';
                buffer.style.display = 'block';
                this.currentlyOpenPanel = panel;
                this.currentlyOpenBuffer = buffer;
              }, 220);
            });
            keyWrapper.addEventListener('mouseleave', () => {
              if (this.showTimer) { clearTimeout(this.showTimer); this.showTimer = null; }
              this.hideTimer = setTimeout(() => {
                panel.style.display = 'none';
                buffer.style.display = 'none';
                if (this.currentlyOpenPanel === panel) {
                  this.currentlyOpenPanel = null;
                  this.currentlyOpenBuffer = null;
                }
              }, 250);
            });
            // Buffer hover logic
            buffer.addEventListener('mouseenter', () => {
              if (this.hideTimer) { clearTimeout(this.hideTimer); this.hideTimer = null; }
            });
            buffer.addEventListener('mouseleave', () => {
              this.hideTimer = setTimeout(() => {
                panel.style.display = 'none';
                buffer.style.display = 'none';
                if (this.currentlyOpenPanel === panel) {
                  this.currentlyOpenPanel = null;
                  this.currentlyOpenBuffer = null;
                }
              }, 250);
            });
            panel.addEventListener('mouseenter', () => {
              if (this.hideTimer) { clearTimeout(this.hideTimer); this.hideTimer = null; }
            });
            panel.addEventListener('mouseleave', () => {
              this.hideTimer = setTimeout(() => {
                panel.style.display = 'none';
                buffer.style.display = 'none';
                if (this.currentlyOpenPanel === panel) {
                  this.currentlyOpenPanel = null;
                  this.currentlyOpenBuffer = null;
                }
              }, 250);
            });
          } else {
            keyWrapper.appendChild(keyElement);
          }
          return keyWrapper;
        }

        /**
         * Creates a node element for a value
         * @param {string|null} key - The key of the value
         * @param {*} value - The value to display
         * @param {number} depth - The depth in the tree
         * @param {string} path - The path to this node
         * @returns {HTMLElement} The node element
         */
        createNode(key = undefined, value, depth = 0, path = '') {
          const node = document.createElement('div');
          node.className = 'json-viewer-node';
          node.style.marginLeft = (depth * this.options.indentWidth) + 'px';
          if (typeof key !== 'undefined' && key !== null) node.setAttribute('data-key', key);

          const header = document.createElement('div');
          header.className = 'json-viewer-header';
          const type = this.getType(value);
          const count = this.getCount(value);

          // Helper to build the path string
          function buildPath(parentPath, key, isArrayKey) {
            if (parentPath === '' || parentPath == null) {
              return isArrayKey ? '[' + key + ']' : key;
            }
            if (isArrayKey) {
              return parentPath + '[' + key + ']';
            } else {
              return parentPath + '.' + key;
            }
          }

          if (type === 'object' || type === 'array') {
            if (count === 0) {
              if (typeof key !== 'undefined' && key !== null) {
                const isArrayKey = typeof key === 'number' || (typeof key === 'string' && /^\d+$/.test(key));
                const nodePath = buildPath(path, key, isArrayKey);
                header.appendChild(this._createKeyElement(key, nodePath));
              }
              const typeLabel = this.createTypeLabel(type);
              typeLabel.style.display = this.options.showTypes ? 'inline' : 'none';
              header.appendChild(typeLabel);
              
              const valueElement = document.createElement('span');
              valueElement.textContent = type === 'object' ? '{}' : '[]';
              header.appendChild(valueElement);

              node.appendChild(header);
              return node;
            }
            let nodePath = path;
            if (typeof key !== 'undefined' && key !== null) {
              const isArrayKey = typeof key === 'number' || (typeof key === 'string' && /^\d+$/.test(key));
              nodePath = buildPath(path, key, isArrayKey);
            }
            
            const isRootLevel = typeof key === 'undefined' || key === null;
            const isExpanded = isRootLevel ? true : (this.expandedNodes.has(nodePath) || this.options.defaultExpanded);
            
            const toggle = this.createToggleButton();
            toggle.addEventListener('click', (e) => {
              if (e.altKey) this.toggleAll(node, true);
              else this.toggleNode(node, nodePath);
            });
            node.appendChild(toggle);

            if (typeof key !== 'undefined' && key !== null) {
              header.appendChild(this._createKeyElement(key, nodePath));
            }

            const typeLabel = this.createTypeLabel(type);
            typeLabel.style.display = isRootLevel || this.options.showTypes ? 'inline' : 'none';
            header.appendChild(typeLabel);

            const expandedInfo = document.createElement('span');
            expandedInfo.className = 'json-viewer-expanded-info';

            if (count !== null && type === 'array') {
              const countLabel = this.createCountLabel(count);
              expandedInfo.appendChild(countLabel);
            }
            
            const collapsedPreview = document.createElement('span');
            collapsedPreview.className = 'json-viewer-collapsed-preview';
            
            // Clear existing content and append the new preview node
            while (collapsedPreview.firstChild) {
              collapsedPreview.removeChild(collapsedPreview.firstChild);
            }
            collapsedPreview.appendChild(this.createPreviewNode(value));

            header.appendChild(expandedInfo);
            header.appendChild(collapsedPreview);
            
            const content = document.createElement('div');
            content.className = 'json-viewer-content';
            
            expandedInfo.style.display = isExpanded ? 'inline' : 'none';
            collapsedPreview.style.display = isExpanded ? 'none' : 'inline';
            content.style.display = isExpanded ? 'block' : 'none';
            
            if (isExpanded) {
              toggle.innerHTML = '▼';
            }

            if (type === 'array') {
              value.forEach((item, index) => {
                content.appendChild(this.createNode(index, item, depth + 1, nodePath));
              });
            } else {
              Object.entries(value).forEach(([k, v]) => {
                content.appendChild(this.createNode(k, v, depth + 1, nodePath));
              });
            }

            node.appendChild(header);
            node.appendChild(content);
          } else {
            if (typeof key !== 'undefined' && key !== null) {
              const isArrayKey = typeof key === 'number' || (typeof key === 'string' && /^\d+$/.test(key));
              const keyPath = buildPath(path, key, isArrayKey);
              header.appendChild(this._createKeyElement(key, keyPath));
            }

            if (type !== 'undefined') {
                const typeLabel = this.createTypeLabel(type);
                typeLabel.style.display = this.options.showTypes ? 'inline' : 'none';
                header.appendChild(typeLabel);
            }

            header.appendChild(this.createValueElement(value));
            node.appendChild(header);
          }
          return node;
        }

        /**
         * Toggles the expansion state of a node
         * @param {HTMLElement} node - The node to toggle
         * @param {string} path - The path to the node
         */
        toggleNode(node, path) {
          const content = node.querySelector('.json-viewer-content');
          const toggle = node.querySelector('.json-viewer-toggle');
          const expandedInfo = node.querySelector('.json-viewer-expanded-info');
          const collapsedPreview = node.querySelector('.json-viewer-collapsed-preview');

          if (content.style.display === 'none') {
            content.style.display = 'block';
            if (expandedInfo) expandedInfo.style.display = 'inline';
            if (collapsedPreview) collapsedPreview.style.display = 'none';
            toggle.innerHTML = '▼';
            this.expandedNodes.add(path);
          } else {
            content.style.display = 'none';
            if (expandedInfo) expandedInfo.style.display = 'none';
            if (collapsedPreview) collapsedPreview.style.display = 'inline';
            toggle.innerHTML = '▶';
            this.expandedNodes.delete(path);
          }
        }

        /**
         * Toggles the expansion state of a node and all its children
         * @param {HTMLElement} node - The node to toggle
         */
        toggleAll(node, includeRoot) {
          const content = node.querySelector('.json-viewer-content');
          const isExpanded = content && content.style.display === 'block';
          const targetExpand = !isExpanded;

          // Include the root node itself, not just descendants
          const nodes = includeRoot ? [node, ...node.querySelectorAll('.json-viewer-node')] : node.querySelectorAll('.json-viewer-node');
          nodes.forEach((nodeEl) => {
            const content = nodeEl.querySelector('.json-viewer-content');
            const toggle = nodeEl.querySelector('.json-viewer-toggle');
            const expandedInfo = nodeEl.querySelector('.json-viewer-expanded-info');
            const collapsedPreview = nodeEl.querySelector('.json-viewer-collapsed-preview');
            const nodePath = this.getNodePath(nodeEl);
            if (content) content.style.display = targetExpand ? 'block' : 'none';
            if (expandedInfo) expandedInfo.style.display = targetExpand ? 'inline' : 'none';
            if (collapsedPreview) collapsedPreview.style.display = targetExpand ? 'none' : 'inline';
            if (toggle) toggle.innerHTML = targetExpand ? '▼' : '▶';
            if (targetExpand) this.expandedNodes.add(nodePath);
            else this.expandedNodes.delete(nodePath);
          });
        }

        /**
         * Creates the controls for toggling types and counts
         * @returns {HTMLElement} The controls container
         */
        createControls() {
          // Controls wrapper for show/hide
          const controlsWrapper = document.createElement('div');
          controlsWrapper.className = 'json-viewer-controls-wrapper';
          controlsWrapper.style.display = this.controlsVisible === false ? 'none' : 'flex';
          controlsWrapper.style.flexDirection = 'row';
          controlsWrapper.style.gap = '12px';

          const controls = document.createElement('div');
          controls.className = 'json-viewer-controls';
          controls.id = this.container.id + '-controls';

          const typesControl = document.createElement('label');
          typesControl.className = 'json-viewer-control';
          typesControl.id = this.container.id + '-types-control';
          const typesCheckbox = document.createElement('input');
          typesCheckbox.type = 'checkbox';
          typesCheckbox.id = this.container.id + '-types-checkbox';
          typesCheckbox.checked = this.options.showTypes;
          typesCheckbox.addEventListener('change', () => {
            this.options.showTypes = typesCheckbox.checked;
            this.updateDisplay();
          });
          typesControl.appendChild(typesCheckbox);
          typesControl.appendChild(document.createTextNode('Show Types'));

          // Show Paths on Hover control
          const pathsControl = document.createElement('label');
          pathsControl.className = 'json-viewer-control';
          pathsControl.id = this.container.id + '-paths-control';
          const pathsCheckbox = document.createElement('input');
          pathsCheckbox.type = 'checkbox';
          pathsCheckbox.id = this.container.id + '-paths-checkbox';
          pathsCheckbox.checked = this.options.pathsOnHover;
          pathsCheckbox.addEventListener('change', () => {
            this.options.pathsOnHover = pathsCheckbox.checked;
            this.refresh();
          });
          pathsControl.appendChild(pathsCheckbox);
          pathsControl.appendChild(document.createTextNode('Show Paths on Hover'));

          controls.appendChild(typesControl);
          controls.appendChild(pathsControl);
          controlsWrapper.appendChild(controls);
          return controlsWrapper;
        }

        /**
         * Updates the display based on current options
         */
        updateDisplay() {
          const typeLabels = this.container.querySelectorAll('.json-viewer-type');

          typeLabels.forEach(label => {
            const node = label.closest('.json-viewer-node');
            const isRootLevel = !node.hasAttribute('data-key');
            if (!isRootLevel) {
              label.style.display = this.options.showTypes ? 'inline' : 'none';
            }
          });

          // Update checkbox states
          const typesCheckbox = this.container.querySelector('#' + this.container.id + '-types-checkbox');
          const pathsCheckbox = this.container.querySelector('#' + this.container.id + '-paths-checkbox');
          if (typesCheckbox) typesCheckbox.checked = this.options.showTypes;
          if (pathsCheckbox) pathsCheckbox.checked = this.options.pathsOnHover;
        }

        /**
         * Completely re-renders the viewer (for toggling pathsOnHover)
         */
        refresh() {
          // Remove all children
          while (this.container.firstChild) {
            this.container.removeChild(this.container.firstChild);
          }
          this.render(this._lastJson);
        }

        /**
         * Renders the JSON viewer
         * @param {*} json - The JSON data to display
         */
        render(json) {
          const data = typeof json === 'string' ? JSON.parse(json) : json;
          this._lastJson = json;
          // Render controls above title
          if (this.options.showControls) {
            const controlsWrapper = this.createControls();
            this.container.appendChild(controlsWrapper);
          }
          // Render title if present
          const title = this.container.getAttribute('data-title');
          if (title) {
            const titleDiv = document.createElement('div');
            titleDiv.className = 'json-viewer-title';
            titleDiv.textContent = title;
            this.container.appendChild(titleDiv);
          }
          const root = this.createNode(null, data);
          this.container.appendChild(root);
        }
      }

      // Initialize the viewer
      const container = document.getElementById('${containerId}');
      if (container) {
        const viewer = new JSONViewer(container, ${JSON.stringify(options)});
        viewer.render(container.getAttribute('data-json'));
      }
    })();
  `,

  /**
   * Generates the complete HTML output for the JSON viewer
   * @param {*} json - The JSON data to display
   * @param {Object} options - Viewer configuration options
   * @param {string} [options.title] - Optional title to display above the controls
   * @returns {string} The complete HTML output
   */
  generate: (json, options = {}) => {
    const containerId = JSONViewerModule.generateId();
    // If json is already a string (from stringifyPlus), use it directly
    // Otherwise, stringify it
    const jsonString = typeof json === 'string' ? json : JSON.stringify(json);
    const escapedJsonString = jsonString.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    // The title will be rendered by JS if present
    return `<style>${JSONViewerModule.getStyles()}</style><div id="${containerId}" class="json-viewer-container" data-json='${escapedJsonString}' data-title='${options.title ? options.title.replace(/'/g, '&#39;').replace(/"/g, '&quot;') : ''}'></div><script>${JSONViewerModule.getScript(containerId, options)}</script>`;
  }
};

/**
 * JSON Viewer filter function for Eleventy
 * @param {any} json - The JSON data to display
 * @param {Object} [options] - Configuration options
 * @param {boolean} [options.showTypes=false] - Whether to show type labels
 * @param {boolean} [options.defaultExpanded=false] - Whether nodes are expanded by default
 * @param {boolean} [options.pathsOnHover=false] - Whether to show key path hover panel
 * @param {boolean} [options.showControls=false] - Whether to show controls
 * @param {number} [options.indentWidth=6] - The number of pixels to indent each level
 * @param {boolean} [options.showTemplate=false] - If true, shows 'template' keys; if false, replaces them with performance message
 * @param {Array} [options.removeKeys=[]] - Array of keys to remove/replace (passed to stringifyPlus)
 * @returns {Promise<string>} HTML string for the JSON viewer
 */
const jsonViewer = async function jsonViewer(processedJSON, options = {}) {
  // Define default options for the filter as well
  const defaults = {
    // In json-viewer
    showTypes: false,
    defaultExpanded: false,
    pathsOnHover: false,
    showControls: false,
    indentWidth: 6,
    // Passed to stringifyPlus
    
  };
  options = Object.assign({}, defaults, options);
  const html = JSONViewerModule.generate(processedJSON, options);
  return html;
}

export default jsonViewer;
export { jsonViewer };

//
// End of json-viewer.js
// 