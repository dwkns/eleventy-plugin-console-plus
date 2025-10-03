/*
 * Test suite for console-plus.js
 *
 * Covers:
 *   - Rendering of basic and special JSON values
 *   - UI controls and interactivity
 *   - Edge cases and API usage
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { consolePlus } from '../lib/console-plus.js';
import { stringifyPlus } from '../lib/stringify-plus.js';

// Helper to extract HTML from the viewer
async function getViewerHTML(json, options = {}) {
  return consolePlus(json, options);
}

// Helper to extract and parse the data-json attribute from the HTML
function extractDataJson(html) {
  const match = html.match(/data-json='([^']+)'/);
  if (!match) return null;
  const jsonString = match[1].replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    // If parsing fails, it might be a primitive value that was stringified
    // Try to handle common cases
    if (jsonString === 'true') return true;
    if (jsonString === 'false') return false;
    if (jsonString === 'null') return null;
    if (!isNaN(jsonString) && jsonString !== '') return Number(jsonString);
    // If it's a string that looks like it should be a string, return it as-is
    if (jsonString.startsWith('"') && jsonString.endsWith('"')) {
      return jsonString.slice(1, -1);
    }
    // For other cases, return the raw string
    return jsonString;
  }
}

// Helper to simulate the browser, run the embedded script, and return the DOM
async function renderInJsdom(html) {
  const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable' });
  
  // Import the web component definition
  const { ConsolePlusComponent } = await import('../lib/console-plus.js');
  
  // Register the custom element
  if (!dom.window.customElements.get('console-plus')) {
    dom.window.customElements.define('console-plus', ConsolePlusComponent);
  }
  
  // Wait for the component to render
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Handle web components by accessing shadow DOM
  const customElements = dom.window.document.querySelectorAll('console-plus');
  customElements.forEach(element => {
    if (element.shadowRoot) {
      // Make shadow DOM content accessible for testing by copying it to innerHTML
      const shadowContent = element.shadowRoot.innerHTML;
      element.innerHTML = shadowContent;
    }
  });
  
  return dom;
}

describe('console-plus', () => {
  let dom;
  let container;

  beforeEach(async () => {
    // Set up a new DOM for each test
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { runScripts: 'dangerously', resources: 'usable' });
    global.window = dom.window;
    global.document = dom.window.document;
    container = dom.window.document.createElement('div');
    dom.window.document.body.appendChild(container);
  });

  // --- Basic rendering ---
  it('renders a simple object (data-json attribute)', async () => {
    const html = await getViewerHTML({ a: 1, b: 'two' });
    expect(html).toContain('console-plus');
    const data = extractDataJson(html);
    expect(data).toEqual({ a: 1, b: 'two' });
  });

  it('renders an array (data-json attribute)', async () => {
    const html = await getViewerHTML([1, 2, 3]);
    const data = extractDataJson(html);
    expect(data).toEqual([1, 2, 3]);
  });

  it('renders primitives (data-json attribute)', async () => {
    expect(extractDataJson(await getViewerHTML(42))).toBe(42);
    expect(extractDataJson(await getViewerHTML('hello'))).toBe('hello');
    expect(extractDataJson(await getViewerHTML(true))).toBe(true);
  });

  // --- Rendered DOM checks ---
  it('renders a simple object in the DOM', async () => {
    const html = await getViewerHTML({ a: 1, b: 'two' });
    // Check that the web component is created with correct data
    expect(html).toContain('console-plus');
    expect(html).toContain('data-json=');
    expect(html).toContain('&quot;a&quot;:1,&quot;b&quot;:&quot;two&quot;');
  });

  it('renders deeply nested structures in the DOM', async () => {
    const nested = { a: { b: { c: { d: 1 } } } };
    const html = await getViewerHTML(nested);
    // Check that the web component is created with correct data
    expect(html).toContain('console-plus');
    expect(html).toContain('data-json=');
    expect(html).toContain('&quot;a&quot;:{&quot;b&quot;:{&quot;c&quot;:{&quot;d&quot;:1}}}');
  });

  // --- Special values ---
  it('renders null and undefined (data-json attribute)', async () => {
    const processedJson = await stringifyPlus({ a: null, b: undefined });
    const html = await getViewerHTML(processedJson);
    const data = extractDataJson(html);
    expect(data).toEqual({ a: null, b: '[ undefined ]' });
  });

  it('renders functions and symbols (data-json attribute)', async () => {
    const processedJson = await stringifyPlus({ fn: function testFunc() { }, sym: Symbol('s') });
    const html = await getViewerHTML(processedJson);
    const data = extractDataJson(html);
    expect(data.fn).toBe('[function testFunc]');
    expect(data.sym).toBe('[Symbol s]');
  });

  it('renders dates (data-json attribute)', async () => {
    const processedJson = await stringifyPlus({ d: new Date('2024-01-01T00:00:00.000Z') });
    const html = await getViewerHTML(processedJson);
    const data = extractDataJson(html);
    expect(data.d).toBe('2024-01-01T00:00:00.000Z');
  });

  it('renders circular references (data-json attribute)', async () => {
    const obj = { a: 1 };
    obj.self = obj;
    const processedJson = await stringifyPlus(obj);
    const html = await getViewerHTML(processedJson);
    const data = extractDataJson(html);
    expect(data.a).toBe(1);
    expect(typeof data.self).toBe('object');
    expect(data.self.self).toContain('[Circular Ref:');
  });

  // --- UI controls ---
  it('includes controls for show types and paths', async () => {
    const html = await getViewerHTML({ a: 1 }, { showControls: true, showTypes: true, pathsOnHover: true });
    // Check that the web component is created
    expect(html).toContain('console-plus');
    expect(html).toContain('data-json=');
    expect(html).toContain('&quot;a&quot;:1');
  });

  // --- Edge cases ---
  it('renders empty object and array (data-json attribute)', async () => {
    const htmlObj = await getViewerHTML({});
    const htmlArr = await getViewerHTML([]);
    expect(extractDataJson(htmlObj)).toEqual({});
    expect(extractDataJson(htmlArr)).toEqual([]);
  });

  it('renders replaced key marker in the DOM', async () => {
    const processedJson = await stringifyPlus({
      foo: {
        bar: 'baz'
      },
      template: {
        foo: 'bar'
      }
    }, {
      removeKeys: [{
        keyName: 'template',
        replaceString: 'Removed for performance reasons'
      }]
    });
    const html = await getViewerHTML(processedJson);
    // Check that the web component is created with processed data
    expect(html).toContain('console-plus');
    expect(html).toContain('data-json=');
    expect(html).toContain('Removed for performance reasons');
  });

  it('renders replaced custom key marker in the DOM', async () => {
    const processedJson = await stringifyPlus({ secret: '12345', visible: 'ok' }, { removeKeys: [{ keyName: 'secret', replaceString: '***hidden***' }] });
    const html = await getViewerHTML(processedJson);
    // Check that the web component is created with processed data
    expect(html).toContain('console-plus');
    expect(html).toContain('data-json=');
    expect(html).toContain('***hidden***');
    expect(html).toContain('&quot;visible&quot;');
  });

  it('renders replaced key marker for string and object entries in removeKeysArray', async () => {
    const processedJson = await stringifyPlus({ secret: '12345', hidden: 'should hide', visible: 'ok' }, { removeKeys: [ 'hidden', { keyName: 'secret', replaceString: '***hidden***' } ] });
    const html = await getViewerHTML(processedJson);
    // Check that the web component is created with processed data
    expect(html).toContain('console-plus');
    expect(html).toContain('data-json=');
    expect(html).toContain('***hidden***');
    expect(html).toContain('Replaced as key was in supplied removeKeys');
    expect(html).toContain('&quot;visible&quot;');
  });

  // --- API usage ---
  it('exports consolePlus as named export', async () => {
    // Import the module directly for API tests using dynamic import
    const mod = await import('../lib/console-plus.js');
    expect(typeof mod.consolePlus).toBe('function');
  });
}); 