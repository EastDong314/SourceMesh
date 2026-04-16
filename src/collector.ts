import { DataSource, CollectorResult, CollectedData } from './types.js';
import { scraper } from './scraper.js';
import { storage } from './storage.js';
import logger from './logger.js';

export class Collector {
  async collect(source: DataSource): Promise<CollectorResult> {
    const startTime = Date.now();
    
    try {
      logger.info(`Starting collection for: ${source.name}`);
      
      // Scrape data
      const rawData = await scraper.scrape(source);
      
      // Transform and validate data
      const collectedData: CollectedData[] = rawData.map(item => ({
        ...item,
        id: crypto.randomUUID(),
        createdAt: new Date(),
      }));

      // Save to storage
      await storage.saveBatch(collectedData);

      const duration = Date.now() - startTime;
      
      logger.info(`Collection completed for ${source.name}: ${collectedData.length} items in ${duration}ms`);
      
      return {
        success: true,
        source: source.name,
        data: collectedData,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      logger.error(`Collection failed for ${source.name}:`, error);
      
      return {
        success: false,
        source: source.name,
        error: errorMessage,
        duration,
      };
    }
  }

  async collectAll(sources: DataSource[]): Promise<CollectorResult[]> {
    logger.info(`Starting collection for ${sources.length} sources`);
    
    const results: CollectorResult[] = [];
    
    for (const source of sources) {
      const result = await this.collect(source);
      results.push(result);
    }
    
    const successCount = results.filter(r => r.success).length;
    logger.info(`Collection completed: ${successCount}/${sources.length} successful`);
    
    return results;
  }
}

export const collector = new Collector();
