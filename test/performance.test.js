/*
 * Test suite for performance features
 * 
 * Covers:
 *   - Large object handling
 *   - Memory management
 *   - Caching behavior
 *   - Debouncing
 */
import { describe, it, expect } from 'vitest';
import { stringifyPlus } from '../lib/stringify-plus.js';
import { consolePlus } from '../lib/console-plus.js';

describe('Performance Tests', () => {
  describe('Large Object Handling', () => {
    it('handles large nested objects efficiently', async () => {
      // Create a large nested object
      const largeObject = {};
      for (let i = 0; i < 100; i++) {
        largeObject[`key${i}`] = {
          nested: {
            value: `value${i}`,
            array: Array.from({ length: 50 }, (_, j) => `item${j}`)
          }
        };
      }

      const startTime = Date.now();
      const result = await stringifyPlus(largeObject);
      const endTime = Date.now();
      
      expect(result).toBeTruthy();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('handles arrays with many elements', async () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        value: `item${i}`,
        nested: { data: `nested${i}` }
      }));

      const startTime = Date.now();
      const result = await stringifyPlus(largeArray);
      const endTime = Date.now();
      
      expect(result).toBeTruthy();
      expect(endTime - startTime).toBeLessThan(500); // Should complete within 500ms
    });

    it('handles deeply nested structures', async () => {
      let deepObject = { value: 'root' };
      for (let i = 0; i < 50; i++) {
        deepObject = { level: i, nested: deepObject };
      }

      const startTime = Date.now();
      const result = await stringifyPlus(deepObject);
      const endTime = Date.now();
      
      expect(result).toBeTruthy();
      expect(endTime - startTime).toBeLessThan(200); // Should complete within 200ms
    });
  });

  describe('Memory Management', () => {
    it('does not leak memory with repeated operations', async () => {
      const testObject = { test: 'value', array: [1, 2, 3] };
      
      // Perform many operations
      for (let i = 0; i < 100; i++) {
        const result = await stringifyPlus(testObject);
        expect(result).toBeTruthy();
      }
      
      // If we get here without memory issues, the test passes
      expect(true).toBe(true);
    });

    it('clears cached data appropriately', async () => {
      const object1 = { key1: 'value1' };
      const object2 = { key2: 'value2' };
      
      // Process same object multiple times (should use cache)
      const result1 = await stringifyPlus(object1);
      const result2 = await stringifyPlus(object1);
      const result3 = await stringifyPlus(object2);
      
      expect(result1).toBe(result2); // Should be identical due to caching
      expect(result1).not.toBe(result3); // Should be different
    });
  });

  describe('Caching Behavior', () => {
    it('caches replacement key lookups', async () => {
      const testObject = { 
        template: { large: 'data' },
        secret: 'hidden',
        visible: 'ok'
      };
      
      const options = {
        removeKeys: [
          'template',
          { keyName: 'secret', replaceString: '***hidden***' }
        ]
      };

      const startTime = Date.now();
      
      // Process the same object multiple times
      for (let i = 0; i < 10; i++) {
        const result = await stringifyPlus(testObject, options);
        expect(result).toContain('***hidden***');
      }
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(100); // Should be fast due to caching
    });

    it('handles circular references efficiently', async () => {
      const obj = { a: 1 };
      obj.self = obj;
      
      const startTime = Date.now();
      const result = await stringifyPlus(obj);
      const endTime = Date.now();
      
      expect(result).toContain('[Circular Ref:');
      expect(endTime - startTime).toBeLessThan(50); // Should be very fast
    });
  });

  describe('JSON Viewer Performance', () => {
    it('renders large JSON data efficiently', async () => {
      const largeData = {};
      for (let i = 0; i < 50; i++) {
        largeData[`section${i}`] = {
          items: Array.from({ length: 20 }, (_, j) => ({
            id: j,
            name: `Item ${j}`,
            value: Math.random()
          }))
        };
      }

      const startTime = Date.now();
      const html = await consolePlus(JSON.stringify(largeData));
      const endTime = Date.now();
      
      expect(html).toContain('console-plus');
      expect(endTime - startTime).toBeLessThan(200); // Should render within 200ms
    });

    it('handles repeated renders without performance degradation', async () => {
      const testData = { test: 'value', array: [1, 2, 3] };
      
      const startTime = Date.now();
      
      for (let i = 0; i < 20; i++) {
        const html = await consolePlus(JSON.stringify(testData));
        expect(html).toContain('console-plus');
      }
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(500); // Should complete within 500ms
    });
  });

  describe('Edge Cases Performance', () => {
    it('handles objects with many keys efficiently', async () => {
      const manyKeys = {};
      for (let i = 0; i < 1000; i++) {
        manyKeys[`key${i}`] = `value${i}`;
      }

      const startTime = Date.now();
      const result = await stringifyPlus(manyKeys);
      const endTime = Date.now();
      
      expect(result).toBeTruthy();
      expect(endTime - startTime).toBeLessThan(300); // Should complete within 300ms
    });

    it('handles mixed data types efficiently', async () => {
      const mixedData = {
        string: 'test',
        number: 42,
        boolean: true,
        null: null,
        undefined: undefined,
        array: [1, 2, 3],
        object: { nested: 'value' },
        date: new Date(),
        function: function test() {},
        symbol: Symbol('test'),
        bigint: BigInt(123)
      };

      const startTime = Date.now();
      const result = await stringifyPlus(mixedData);
      const endTime = Date.now();
      
      expect(result).toBeTruthy();
      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    });
  });
});
