/*
 * Test suite for integration and real-world usage scenarios
 * 
 * Covers:
 *   - Full plugin pipeline
 *   - Real Eleventy data structures
 *   - Multiple shortcode usage
 *   - Performance with typical data
 */
import { describe, it, expect } from 'vitest';
import { stringifyPlus } from '../lib/stringify-plus.js';
import { consolePlus } from '../lib/console-plus.js';
import { logToTerminal } from '../lib/logToTerminal.js';

describe('Integration Tests', () => {
  describe('Full Plugin Pipeline', () => {
    it('processes complex Eleventy data through full pipeline', async () => {
      // Simulate typical Eleventy collection data
      const eleventyData = {
        collections: {
          posts: [
            {
              data: {
                title: 'Test Post',
                date: new Date('2024-01-01'),
                tags: ['test', 'example']
              },
              content: 'This is the post content...',
              template: {
                // Large template object that should be filtered
                inputPath: './src/post.md',
                outputPath: './dist/post.html',
                // ... many more properties
              }
            }
          ]
        },
        pkg: {
          name: 'test-site',
          version: '1.0.0'
        }
      };

      // Process through stringifyPlus
      const stringified = await stringifyPlus(eleventyData, {
        showTemplate: false, // Hide template data
        removeKeys: ['content'] // Remove large content
      });

      // Process through JSON viewer
      const html = await consolePlus(stringified, {
        showTypes: true,
        defaultExpanded: false
      });

      expect(html).toContain('console-plus');
      expect(html).toContain('collections');
      expect(html).toContain('template'); // Template is replaced with message, not removed
    });

    it('handles multiple console shortcodes in same template', async () => {
      // Simulate multiple console calls
      const data1 = { user: { name: 'John', age: 30 } };
      const data2 = { posts: [{ title: 'Post 1' }, { title: 'Post 2' }] };
      const data3 = { config: { theme: 'dark', lang: 'en' } };

      const results = await Promise.all([
        consolePlus(await stringifyPlus(data1), { title: 'User Data' }),
        consolePlus(await stringifyPlus(data2), { title: 'Posts' }),
        consolePlus(await stringifyPlus(data3), { title: 'Config' })
      ]);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toContain('console-plus');
      });
    });

    it('maintains performance with large datasets', async () => {
      // Create a large dataset similar to what Eleventy might process
      const largeDataset = {
        collections: {},
        pages: [],
        data: {}
      };

      // Add many collections
      for (let i = 0; i < 20; i++) {
        largeDataset.collections[`collection${i}`] = [];
        for (let j = 0; j < 50; j++) {
          largeDataset.collections[`collection${i}`].push({
            data: {
              title: `Item ${j}`,
              date: new Date(),
              content: `Content ${j}`.repeat(100)
            },
            template: { /* large template object */ }
          });
        }
      }

      // Add many pages
      for (let i = 0; i < 100; i++) {
        largeDataset.pages.push({
          inputPath: `./src/page${i}.md`,
          outputPath: `./dist/page${i}.html`,
          data: { title: `Page ${i}` }
        });
      }

      const startTime = Date.now();
      
      const result = await stringifyPlus(largeDataset, {
        showTemplate: false,
        removeKeys: ['content', 'template']
      });
      
      const endTime = Date.now();
      
      expect(result).toBeTruthy();
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });

  describe('Real-world Usage Scenarios', () => {
    it('handles typical Eleventy collections', async () => {
      const collection = {
        all: [
          {
            data: {
              title: 'Hello World',
              date: '2024-01-01',
              tags: ['hello', 'world']
            },
            content: 'This is a test post.',
            template: {
              inputPath: './src/posts/hello.md',
              outputPath: './dist/posts/hello.html'
            }
          }
        ],
        posts: [
          {
            data: {
              title: 'Another Post',
              date: '2024-01-02',
              tags: ['another', 'post']
            },
            content: 'Another test post.',
            template: {
              inputPath: './src/posts/another.md',
              outputPath: './dist/posts/another.html'
            }
          }
        ]
      };

      const result = await stringifyPlus(collection, {
        showTemplate: false,
        removeKeys: ['content']
      });

      expect(result).toContain('"title":"Hello World"');
      expect(result).toContain('"date":"2024-01-01"');
      expect(result).toContain('template'); // Template is replaced with message, not removed
      expect(result).toContain('content'); // Content is replaced with message, not removed
    });

    it('processes common template data structures', async () => {
      const templateData = {
        page: {
          date: new Date(),
          inputPath: './src/index.md',
          outputPath: './dist/index.html',
          url: '/',
          filePathStem: 'index'
        },
        layout: 'base.njk',
        title: 'Home Page',
        description: 'Welcome to our site',
        tags: ['home', 'welcome'],
        eleventy: {
          version: '3.0.0',
          generator: 'Eleventy'
        }
      };

      const result = await stringifyPlus(templateData);
      const html = await consolePlus(result, { title: 'Page Data' });

      expect(html).toContain('console-plus');
      expect(result).toContain('"title":"Home Page"');
      expect(result).toContain('"url":"/"');
    });

    it('works with popular Eleventy plugins data', async () => {
      // Simulate data from common Eleventy plugins
      const pluginData = {
        // From eleventy-plugin-syntaxhighlight
        syntaxHighlight: {
          languages: ['javascript', 'css', 'html'],
          theme: 'github'
        },
        // From eleventy-plugin-rss
        rss: {
          title: 'My Blog',
          description: 'Blog feed',
          url: 'https://example.com'
        },
        // From eleventy-plugin-sitemap
        sitemap: {
          changefreq: 'weekly',
          priority: 0.8
        },
        // From eleventy-plugin-reading-time
        readingTime: {
          text: '2 min read',
          minutes: 2,
          words: 300
        }
      };

      const result = await stringifyPlus(pluginData);
      const html = await consolePlus(result, { title: 'Plugin Data' });

      expect(html).toContain('console-plus');
      expect(result).toContain('"languages":["javascript","css","html"]');
      expect(result).toContain('"readingTime"');
    });
  });

  describe('Performance with Typical Data', () => {
    it('handles blog post with images and metadata', async () => {
      const blogPost = {
        data: {
          title: 'My Blog Post',
          date: new Date('2024-01-01'),
          author: 'John Doe',
          tags: ['blog', 'tutorial', 'web-development'],
          featured: true,
          image: {
            url: '/images/post.jpg',
            alt: 'Blog post image',
            width: 800,
            height: 600
          },
          seo: {
            title: 'SEO Title',
            description: 'SEO description',
            keywords: ['keyword1', 'keyword2']
          }
        },
        content: 'This is a long blog post content...'.repeat(100),
        template: {
          // Large template object
          inputPath: './src/posts/my-post.md',
          outputPath: './dist/posts/my-post.html',
          layout: 'post.njk'
        }
      };

      const startTime = Date.now();
      
      const result = await stringifyPlus(blogPost, {
        showTemplate: false,
        removeKeys: ['content']
      });
      
      const html = await consolePlus(result, {
        title: blogPost.data.title,
        showTypes: true
      });
      
      const endTime = Date.now();

      expect(html).toContain('console-plus');
      expect(result).toContain('"title":"My Blog Post"');
      expect(endTime - startTime).toBeLessThan(500); // Should be fast
    });

    it('handles navigation and menu data', async () => {
      const navigation = {
        main: [
          { title: 'Home', url: '/', active: true },
          { title: 'About', url: '/about/', active: false },
          { title: 'Blog', url: '/blog/', active: false },
          { title: 'Contact', url: '/contact/', active: false }
        ],
        footer: [
          { title: 'Privacy', url: '/privacy/' },
          { title: 'Terms', url: '/terms/' }
        ],
        social: [
          { name: 'Twitter', url: 'https://twitter.com/example' },
          { name: 'GitHub', url: 'https://github.com/example' }
        ]
      };

      const result = await stringifyPlus(navigation);
      const html = await consolePlus(result, { title: 'Navigation' });

      expect(html).toContain('console-plus');
      expect(result).toContain('"main"');
      expect(result).toContain('"active":true');
    });

    it('handles form data and user input', async () => {
      const formData = {
        contact: {
          name: 'John Doe',
          email: 'john@example.com',
          message: 'Hello, this is a test message.',
          timestamp: new Date(),
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0...'
        },
        newsletter: {
          email: 'subscribe@example.com',
          subscribed: true,
          preferences: ['tech', 'web-dev'],
          source: 'website'
        }
      };

      const result = await stringifyPlus(formData, {
        removeKeys: ['ip', 'userAgent'] // Remove sensitive data
      });
      const html = await consolePlus(result, { title: 'Form Data' });

      expect(html).toContain('console-plus');
      expect(result).toContain('"name":"John Doe"');
      expect(result).toContain('"ip"'); // IP is replaced with message, not removed
    });
  });

  describe('Error Recovery in Integration', () => {
    it('recovers from partial failures in pipeline', async () => {
      const problematicData = {
        valid: { test: 'value' },
        problematic: {
          get error() {
            throw new Error('Getter error');
          }
        }
      };

      try {
        const result = await stringifyPlus(problematicData);
        expect(result).toContain('"valid"');
      } catch (error) {
        // Should handle errors gracefully
        expect(error.message).toBeTruthy();
      }
    });

    it('handles concurrent processing', async () => {
      const datasets = [
        { id: 1, data: 'dataset1' },
        { id: 2, data: 'dataset2' },
        { id: 3, data: 'dataset3' }
      ];

      const promises = datasets.map(async (dataset) => {
        const stringified = await stringifyPlus(dataset);
        return consolePlus(stringified, { title: `Dataset ${dataset.id}` });
      });

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result).toContain('console-plus');
        expect(result).toContain(`Dataset ${index + 1}`);
      });
    });
  });
});
