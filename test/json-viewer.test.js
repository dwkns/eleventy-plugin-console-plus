/*
 * Test suite for json-viewer.js
 *
 * Covers:
 *   - Rendering of basic and special JSON values
 *   - UI controls and interactivity
 *   - Edge cases and API usage
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import jsonViewer from './json-viewer.js';

// Helper to extract HTML from the viewer
function getViewerHTML(json, options = {}) {
  return jsonViewer(json, options);
}

// Helper to extract and parse the data-json attribute from the HTML
function extractDataJson(html) {
  const match = html.match(/data-json='([^']+)'/);
  if (!match) return null;
  return JSON.parse(match[1].replace(/&quot;/g, '"').replace(/&#39;/g, "'"));
}

// Helper to simulate the browser, run the embedded script, and return the DOM
async function renderInJsdom(html) {
  const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable' });
  // Wait for the script to run and the DOM to update
  await new Promise(resolve => setTimeout(resolve, 50));
  return dom;
}

describe('json-viewer', () => {
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
    expect(html).toContain('json-viewer-container');
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
    const dom = await renderInJsdom(html);
    const container = dom.window.document.querySelector('.json-viewer-container');
    // Check for key/value pairs in the DOM
    expect(container.textContent).toContain('a:');
    expect(container.textContent).toContain('1');
    expect(container.textContent).toContain('b:');
    expect(container.textContent).toContain('two');
  });

  it('renders deeply nested structures in the DOM', async () => {
    const nested = { a: { b: { c: { d: 1 } } } };
    const html = await getViewerHTML(nested);
    const dom = await renderInJsdom(html);
    const container = dom.window.document.querySelector('.json-viewer-container');
    expect(container.textContent).toContain('d:');
    expect(container.textContent).toContain('1');
  });

  // --- Special values ---
  it('renders null and undefined (data-json attribute)', async () => {
    const html = await getViewerHTML({ a: null, b: undefined });
    const data = extractDataJson(html);
    expect(data).toEqual({ a: null, b: '[ undefined ]' });
  });

  it('renders functions and symbols (data-json attribute)', async () => {
    const html = await getViewerHTML({ fn: function testFunc() { }, sym: Symbol('s') });
    const data = extractDataJson(html);
    expect(data.fn).toBe('[function testFunc]');
    expect(data.sym).toBe('[Symbol s]');
  });

  it('renders dates (data-json attribute)', async () => {
    const html = await getViewerHTML({ d: new Date('2024-01-01T00:00:00.000Z') });
    const data = extractDataJson(html);
    expect(data.d).toBe('2024-01-01T00:00:00.000Z');
  });

  it('renders circular references (data-json attribute)', async () => {
    const obj = { a: 1 };
    obj.self = obj;
    const html = await getViewerHTML(obj);
    const data = extractDataJson(html);
    expect(data.a).toBe(1);
    expect(typeof data.self).toBe('object');
    expect(data.self.self).toContain('[Circular Ref:');
  });

  // --- UI controls ---
  it('includes controls for show types and paths', async () => {
    const html = await getViewerHTML({ a: 1 }, { showControls: true, showTypes: true, pathsOnHover: true });
    const dom = await renderInJsdom(html);
    const container = dom.window.document.querySelector('.json-viewer-container');
    expect(container.textContent).toContain('Show Types');
    expect(container.textContent).toContain('Show Paths on Hover');
  });

  // --- Edge cases ---
  it('renders empty object and array (data-json attribute)', async () => {
    const htmlObj = await getViewerHTML({});
    const htmlArr = await getViewerHTML([]);
    expect(extractDataJson(htmlObj)).toEqual({});
    expect(extractDataJson(htmlArr)).toEqual([]);
  });

  it('renders replaced key marker in the DOM', async () => {
    const html = await getViewerHTML({
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
    const dom = await renderInJsdom(html);
    const container = dom.window.document.querySelector('.json-viewer-container');
    expect(container.textContent).toContain('Removed for performance reasons');
  });

  it('renders replaced custom key marker in the DOM', async () => {
    const html = await getViewerHTML({ secret: '12345', visible: 'ok' }, { removeKeys: [{ keyName: 'secret', replaceString: '***hidden***' }] });
    const dom = await renderInJsdom(html);
    const container = dom.window.document.querySelector('.json-viewer-container');
    expect(container.textContent).toContain('***hidden***');
    expect(container.textContent).toContain('visible:');
    expect(container.textContent).toContain('ok');
  });

  it('renders replaced key marker for string and object entries in removeKeysArray', async () => {
    const html = await getViewerHTML({ secret: '12345', hidden: 'should hide', visible: 'ok' }, { removeKeys: [ 'hidden', { keyName: 'secret', replaceString: '***hidden***' } ] });
    const dom = await renderInJsdom(html);
    const container = dom.window.document.querySelector('.json-viewer-container');
    expect(container.textContent).toContain('***hidden***');
    expect(container.textContent).toContain('Replaced as key was in supplied removeKeys');
    expect(container.textContent).toContain('visible:');
    expect(container.textContent).toContain('ok');
  });

  // --- API usage ---
  it('exports jsonViewer as default and named export', () => {
    // Import the module directly for API tests
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('./json-viewer.js');
    expect(typeof mod.default).toBe('function');
    expect(typeof mod.jsonViewer).toBe('function');
  });
}); 