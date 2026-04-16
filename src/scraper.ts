import { chromium, Browser } from 'playwright';
import { DataSource, CollectedData } from './types.js';
import logger from './logger.js';

export class Scraper {
  private browser: Browser | null = null;

  async init(): Promise<void> {
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    logger.info('Playwright browser launched');
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async scrape(source: DataSource): Promise<CollectedData[]> {
    if (!this.browser) {
      await this.init();
    }

    const page = await this.browser!.newPage();
    const results: CollectedData[] = [];

    try {
      // Set headers if provided
      if (source.headers) {
        await page.setExtraHTTPHeaders(source.headers);
      }

      logger.info(`Scraping: ${source.url}`);
      
      await page.goto(source.url, {
        timeout: source.timeout,
        waitUntil: 'networkidle',
      });

      // If selector provided, extract matching elements
      if (source.selector) {
        const elements = await page.$$(source.selector);
        
        for (const element of elements) {
          const data: Partial<CollectedData> = {
            source: source.name,
            type: 'scraped',
            collectedAt: new Date(),
          };

          // Extract fields based on configuration
          if (source.fields) {
            for (const [field, selector] of Object.entries(source.fields)) {
              if (selector.startsWith('@')) {
                // Attribute
                const attr = selector.slice(1);
                data.content = data.content || {};
                (data.content as any)[field] = await element.getAttribute(attr);
              } else if (selector === 'text()') {
                // Text content
                data.content = data.content || {};
                (data.content as any)[field] = await element.textContent();
              } else {
                // Nested element
                const child = await element.$(selector);
                if (child) {
                  data.content = data.content || {};
                  (data.content as any)[field] = await child.textContent();
                }
              }
            }
          } else {
            // Default: get all text
            data.content = await element.textContent();
          }

          results.push(data as CollectedData);
        }
      } else {
        // No selector, get entire page content
        const content = await page.content();
        results.push({
          source: source.name,
          type: 'full-page',
          content,
          collectedAt: new Date(),
        });
      }

      logger.info(`Scraped ${results.length} items from ${source.name}`);
    } catch (error) {
      logger.error(`Error scraping ${source.name}:`, error);
      throw error;
    } finally {
      await page.close();
    }

    return results;
  }
}

// Singleton instance
export const scraper = new Scraper();
