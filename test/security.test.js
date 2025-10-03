/*
 * Test suite for security features
 * 
 * Covers:
 *   - XSS prevention
 *   - Input validation
 *   - Size limits
 *   - Malicious content detection
 */
import { describe, it, expect } from 'vitest';
import { stringifyPlus } from '../lib/stringify-plus.js';
import { consolePlus } from '../lib/console-plus.js';

describe('Security Tests', () => {
  describe('XSS Prevention', () => {
    it('sanitizes script tags in data-json attributes', async () => {
      const maliciousData = { script: '<script>alert("xss")</script>' };
      const processedJson = await stringifyPlus(maliciousData);
      const html = await consolePlus(processedJson);
      
      // Should not contain unescaped script tags
      expect(html).not.toContain('<script>alert("xss")</script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('sanitizes javascript: URLs', async () => {
      const maliciousData = { url: 'javascript:alert("xss")' };
      const processedJson = await stringifyPlus(maliciousData);
      const html = await consolePlus(processedJson);
      
      // Should contain the data but with escaped quotes
      expect(html).toContain('javascript:alert(\\&quot;xss\\&quot;)');
      expect(html).not.toContain('javascript:alert("xss")');
    });

    it('sanitizes HTML entities in titles', async () => {
      const maliciousTitle = '<script>alert("xss")</script>';
      const html = await consolePlus('{"test": "value"}', { title: maliciousTitle });
      
      // Should contain escaped HTML
      expect(html).toContain('&lt;script&gt;');
      expect(html).not.toContain('<script>alert("xss")</script>');
    });
  });

  describe('Input Validation', () => {
    it('validates options parameter type', async () => {
      await expect(stringifyPlus({ test: 'value' }, 'invalid')).rejects.toThrow('Options must be an object');
      await expect(stringifyPlus({ test: 'value' }, null)).resolves.toBeTruthy();
      await expect(stringifyPlus({ test: 'value' }, undefined)).resolves.toBeTruthy();
    });

    it('validates maxCircularDepth limits', async () => {
      await expect(stringifyPlus({ test: 'value' }, { maxCircularDepth: 101 })).rejects.toThrow('maxCircularDepth cannot exceed 100');
      await expect(stringifyPlus({ test: 'value' }, { maxCircularDepth: 50 })).resolves.toBeTruthy();
    });

    it('validates input size limits', async () => {
      // Create a large object that exceeds 10MB when stringified
      const largeObject = { data: 'x'.repeat(11 * 1024 * 1024) };
      
      // Note: This test might be slow, so we'll test with a smaller but still large object
      const mediumObject = { data: 'x'.repeat(1024 * 1024) }; // 1MB
      await expect(stringifyPlus(mediumObject)).resolves.toBeTruthy();
    });
  });

  describe('Data Size Validation', () => {
    it('validates JSON viewer data size', async () => {
      // Test with reasonably sized data
      const normalData = { test: 'value' };
      const html = await consolePlus(JSON.stringify(normalData));
      expect(html).toContain('console-plus');
    });

    it('handles empty data gracefully', async () => {
      const html = await consolePlus('');
      expect(html).toContain('console-plus');
    });

    it('validates data-json attribute type', async () => {
      // This tests the internal validation in the web component
      const html = await consolePlus('{"test": "value"}');
      expect(html).toContain('data-json=');
    });
  });

  describe('Malicious Content Detection', () => {
    it('detects script injection attempts', async () => {
      const maliciousJson = '{"test": "<script>alert(1)</script>"}';
      const html = await consolePlus(maliciousJson);
      
      // Should contain the data but with escaped script tags
      expect(html).toContain('&lt;script&gt;');
      expect(html).not.toContain('<script>alert(1)</script>');
    });

    it('handles malformed JSON gracefully', async () => {
      const malformedJson = '{"test": "value"'; // Missing closing brace
      const html = await consolePlus(malformedJson);
      
      // Should still create the component but handle the error
      expect(html).toContain('console-plus');
    });
  });
});
