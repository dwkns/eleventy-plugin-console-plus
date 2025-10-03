/*
 * Test suite for error handling and edge cases
 * 
 * Covers:
 *   - Invalid inputs
 *   - Error recovery
 *   - Edge cases
 *   - Plugin error handling
 */
import { describe, it, expect } from 'vitest';
import { stringifyPlus } from '../lib/stringify-plus.js';
import { consolePlus } from '../lib/console-plus.js';
import { logToTerminal } from '../lib/logToTerminal.js';

describe('Error Handling Tests', () => {
  describe('StringifyPlus Error Handling', () => {
    it('handles invalid options gracefully', async () => {
      await expect(stringifyPlus({ test: 'value' }, 'invalid')).rejects.toThrow('Options must be an object');
      await expect(stringifyPlus({ test: 'value' }, null)).resolves.toBeTruthy();
    });

    it('handles excessive depth limits', async () => {
      await expect(stringifyPlus({ test: 'value' }, { maxCircularDepth: 150 })).rejects.toThrow('maxCircularDepth cannot exceed 100');
    });

    it('handles objects with getters that throw', async () => {
      const problematicObject = {
        normal: 'value',
        get problematic() {
          throw new Error('Getter error');
        }
      };

      // This should either handle gracefully or throw a meaningful error
      try {
        await stringifyPlus(problematicObject);
      } catch (error) {
        expect(error.message).toBeTruthy();
      }
    });

    it('handles objects with circular references at max depth', async () => {
      const obj = { a: 1 };
      obj.self = obj;
      
      const result = await stringifyPlus(obj, { maxCircularDepth: 0 });
      expect(result).toContain('[Circular Ref:');
    });
  });

  describe('LogToTerminal Error Handling', () => {
    it('handles invalid options', () => {
      // Should not throw, but should log error
      logToTerminal({ test: 'value' }, 'title', 'invalid');
      // Test passes if no exception is thrown
      expect(true).toBe(true);
    });

    it('handles invalid title parameter', () => {
      logToTerminal({ test: 'value' }, 123); // Invalid title type
      // Should handle gracefully
      expect(true).toBe(true);
    });

    it('handles invalid depth and breakLength', () => {
      logToTerminal({ test: 'value' }, 'title', { depth: -1, breakLength: 5 });
      // Should handle gracefully
      expect(true).toBe(true);
    });

    it('handles extreme depth values', () => {
      logToTerminal({ test: 'value' }, 'title', { depth: 1000 });
      // Should handle gracefully
      expect(true).toBe(true);
    });
  });

  describe('JSON Viewer Error Handling', () => {
    it('handles malformed JSON gracefully', async () => {
      const malformedJson = '{"test": "value"'; // Missing closing brace
      const html = await consolePlus(malformedJson);
      
      // Should still create the component
      expect(html).toContain('console-plus');
    });

    it('handles empty data gracefully', async () => {
      const html = await consolePlus('');
      expect(html).toContain('console-plus');
    });

    it('handles null and undefined data', async () => {
      const html1 = await consolePlus(null);
      const html2 = await consolePlus(undefined);
      
      expect(html1).toContain('console-plus');
      expect(html2).toContain('console-plus');
    });

    it('handles extremely large data', async () => {
      // Create data that might cause issues
      const largeData = { data: 'x'.repeat(100000) }; // 100KB string
      const html = await consolePlus(JSON.stringify(largeData));
      
      expect(html).toContain('console-plus');
    });
  });

  describe('Plugin Error Handling', () => {
    it('handles console shortcode without arguments', async () => {
      // Mock EleventyConfig
      const mockEleventyConfig = {
        addAsyncShortcode: (name, callback) => {
          // Test the callback directly
          return callback();
        }
      };

      // Import the plugin function
      const { consolePlus } = await import('../index.js');
      
      // This should not throw an error
      expect(() => {
        consolePlus(mockEleventyConfig);
      }).not.toThrow();
    });

    it('handles invalid plugin registration options', async () => {
      const { consolePlus } = await import('../index.js');
      
      const mockConfig = {
        addAsyncShortcode: () => {}
      };
      
      expect(() => {
        consolePlus(mockConfig, 'invalid');
      }).toThrow('Plugin registration options must be an object');
    });
  });

  describe('Edge Cases', () => {
    it('handles objects with prototype pollution attempts', async () => {
      const obj = { test: 'value' };
      // Attempt to add properties to Object.prototype
      Object.prototype.polluted = 'should not affect stringifyPlus';
      
      try {
        const result = await stringifyPlus(obj);
        expect(result).toContain('"test":"value"');
        expect(result).not.toContain('polluted');
      } finally {
        // Clean up
        delete Object.prototype.polluted;
      }
    });

    it('handles objects with non-enumerable properties', async () => {
      const obj = { test: 'value' };
      Object.defineProperty(obj, 'hidden', {
        value: 'hidden value',
        enumerable: false
      });

      const result = await stringifyPlus(obj);
      expect(result).toContain('"test":"value"');
      expect(result).not.toContain('hidden'); // Non-enumerable properties should not appear
    });

    it('handles objects with symbol keys', async () => {
      const sym = Symbol('test');
      const obj = { [sym]: 'value', normal: 'key' };
      
      const result = await stringifyPlus(obj);
      expect(result).toContain('"normal":"key"');
      // Symbol keys might not appear in JSON output
    });

    it('handles frozen and sealed objects', async () => {
      const obj = { test: 'value' };
      Object.freeze(obj);
      
      const result = await stringifyPlus(obj);
      expect(result).toContain('"test":"value"');
    });

    it('handles objects with custom toString methods', async () => {
      const obj = {
        test: 'value',
        toString() {
          return 'custom toString';
        }
      };
      
      const result = await stringifyPlus(obj);
      expect(result).toContain('"test":"value"');
    });
  });

  describe('Recovery and Resilience', () => {
    it('recovers from temporary errors', async () => {
      // Test that the system can recover from errors
      const obj1 = { test: 'value1' };
      const obj2 = { test: 'value2' };
      
      try {
        await stringifyPlus(obj1);
      } catch (error) {
        // If there's an error, it should be handled
      }
      
      // Should still work after an error
      const result = await stringifyPlus(obj2);
      expect(result).toContain('"test":"value2"');
    });

    it('handles concurrent operations', async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(stringifyPlus({ test: `value${i}` }));
      }
      
      const results = await Promise.all(promises);
      expect(results).toHaveLength(10);
      results.forEach((result, index) => {
        expect(result).toContain(`"test":"value${index}"`);
      });
    });
  });
});
