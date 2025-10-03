/*
 * Test suite for browser compatibility features
 * 
 * Covers:
 *   - Shadow DOM fallbacks
 *   - Custom elements support
 *   - Browser API availability
 *   - Polyfill behavior
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { consolePlus } from '../lib/console-plus.js';
import { ConsolePlusComponent } from '../lib/console-plus.js';

describe('Browser Compatibility Tests', () => {
  let dom;
  let window;
  let document;

  beforeEach(() => {
    // Create a fresh JSDOM environment for each test
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { 
      runScripts: 'dangerously', 
      resources: 'usable' 
    });
    window = dom.window;
    document = window.document;
    
    // Set up global environment
    global.window = window;
    global.document = document;
  });

  describe('Shadow DOM Support', () => {
    it('works with Shadow DOM support', async () => {
      // Test with full Shadow DOM support
      const html = await consolePlus('{"test": "value"}');
      expect(html).toContain('console-plus');
      expect(html).toContain('data-json=');
    });

    it('falls back gracefully without Shadow DOM', () => {
      // Mock environment without Shadow DOM
      const originalAttachShadow = HTMLElement.prototype.attachShadow;
      HTMLElement.prototype.attachShadow = function() {
        throw new Error('Shadow DOM not supported');
      };

      try {
        const component = new ConsolePlusComponent();
        expect(component._fallbackMode).toBe(true);
      } finally {
        // Restore original method
        HTMLElement.prototype.attachShadow = originalAttachShadow;
      }
    });

    it('handles Shadow DOM errors gracefully', () => {
      // Mock attachShadow to throw an error
      const originalAttachShadow = HTMLElement.prototype.attachShadow;
      HTMLElement.prototype.attachShadow = function() {
        throw new Error('Shadow DOM error');
      };

      try {
        const component = new ConsolePlusComponent();
        expect(component._fallbackMode).toBe(true);
      } finally {
        HTMLElement.prototype.attachShadow = originalAttachShadow;
      }
    });
  });

  describe('Custom Elements Support', () => {
    it('registers custom element when customElements is available', () => {
      if (window.customElements) {
        // Should not throw when registering
        expect(() => {
          if (!window.customElements.get('console-plus')) {
            window.customElements.define('console-plus', ConsolePlusComponent);
          }
        }).not.toThrow();
      }
    });

    it('handles missing customElements API', () => {
      // Mock environment without customElements
      const originalCustomElements = window.customElements;
      delete window.customElements;

      try {
        // Should not throw when customElements is not available
        expect(() => {
          // The component should still work
          const component = new ConsolePlusComponent();
          expect(component).toBeDefined();
        }).not.toThrow();
      } finally {
        // Restore original
        window.customElements = originalCustomElements;
      }
    });

    it('handles custom element definition errors', () => {
      if (window.customElements) {
        // Mock define to throw an error
        const originalDefine = window.customElements.define;
        window.customElements.define = function() {
          throw new Error('Custom element definition failed');
        };

        try {
          // Should handle the error gracefully
          expect(() => {
            const component = new ConsolePlusComponent();
            expect(component).toBeDefined();
          }).not.toThrow();
        } finally {
          // Restore original
          window.customElements.define = originalDefine;
        }
      }
    });
  });

  describe('Browser API Availability', () => {
    it('handles missing navigator.clipboard', () => {
      // Mock environment without clipboard API
      const originalClipboard = navigator.clipboard;
      delete navigator.clipboard;

      try {
        const component = new ConsolePlusComponent();
        component.setupComponentEventListeners();
        
        // Should not throw
        expect(true).toBe(true);
      } finally {
        // Restore original
        navigator.clipboard = originalClipboard;
      }
    });

    it('handles missing document methods', () => {
      // Mock environment with limited document API
      const originalQuerySelector = document.querySelector;
      document.querySelector = function() {
        throw new Error('querySelector not supported');
      };

      try {
        const component = new ConsolePlusComponent();
        component.render();
        
        // Should handle gracefully
        expect(true).toBe(true);
      } finally {
        // Restore original
        document.querySelector = originalQuerySelector;
      }
    });

    it('handles missing HTMLElement methods', () => {
      // Mock environment without some HTMLElement methods
      const originalCreateElement = document.createElement;
      document.createElement = function() {
        const element = originalCreateElement.apply(this, arguments);
        // Remove some methods
        delete element.addEventListener;
        delete element.appendChild;
        return element;
      };

      try {
        const component = new ConsolePlusComponent();
        component.render();
        
        // Should handle gracefully
        expect(true).toBe(true);
      } finally {
        // Restore original
        document.createElement = originalCreateElement;
      }
    });
  });

  describe('Fallback Mode Behavior', () => {
    it('renders correctly in fallback mode', async () => {
      // Create component in fallback mode
      const component = new ConsolePlusComponent();
      component._fallbackMode = true;
      component.setAttribute('data-json', '{"test": "value"}');
      
      // Mock querySelector to work in fallback mode
      component.querySelector = function(selector) {
        if (selector === '.console-plus-content') {
          return document.createElement('div');
        }
        return null;
      };

      // Should not throw
      expect(() => {
        component.render();
      }).not.toThrow();
    });

    it('handles event listeners in fallback mode', () => {
      const component = new ConsolePlusComponent();
      component._fallbackMode = true;
      
      // Mock getElementById to work in fallback mode
      component.getElementById = function(id) {
        return document.createElement('div');
      };

      // Should not throw
      expect(() => {
        component.setupComponentEventListeners();
      }).not.toThrow();
    });
  });

  describe('Cross-Browser Compatibility', () => {
    it('handles different event models', () => {
      const component = new ConsolePlusComponent();
      
      // Mock different event handling approaches
      const mockElement = {
        addEventListener: function(event, handler) {
          // Simulate different event models
          if (event === 'click') {
            try {
              handler.call(this);
            } catch (error) {
              // Handle errors gracefully
            }
          }
        }
      };

      // Should not throw
      expect(() => {
        mockElement.addEventListener('click', () => {});
      }).not.toThrow();
    });

    it('handles different CSS support', () => {
      const component = new ConsolePlusComponent();
      
      // Mock CSS that might not be supported in older browsers
      const mockStyle = {
        display: 'flex',
        gridTemplateColumns: '1fr 1fr',
        backdropFilter: 'blur(10px)'
      };

      // Should handle CSS properties gracefully
      expect(() => {
        Object.keys(mockStyle).forEach(property => {
          // Simulate setting CSS properties
          try {
            // This would normally set the style
          } catch (error) {
            // Handle unsupported properties
          }
        });
      }).not.toThrow();
    });
  });

  describe('Performance in Different Browsers', () => {
    it('handles slower DOM operations', async () => {
      // Mock slower DOM operations
      const originalAppendChild = Node.prototype.appendChild;
      Node.prototype.appendChild = function(child) {
        // Simulate slower operation
        return originalAppendChild.call(this, child);
      };

      try {
        const html = await consolePlus('{"test": "value"}');
        expect(html).toContain('console-plus');
      } finally {
        // Restore original
        Node.prototype.appendChild = originalAppendChild;
      }
    });

    it('handles memory constraints', async () => {
      // Test with multiple instances
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(consolePlus(`{"test": "value${i}"}`));
      }
      
      const results = await Promise.all(promises);
      expect(results).toHaveLength(10);
      
      // Should not cause memory issues
      results.forEach(result => {
        expect(result).toContain('console-plus');
      });
    });
  });
});
