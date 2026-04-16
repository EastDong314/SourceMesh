import { CollectedData, StorageAdapter } from './types.js';
import logger from './logger.js';

// In-memory storage for development
class MemoryStorage implements StorageAdapter {
  private data: Map<string, CollectedData[]> = new Map();

  async save(item: CollectedData): Promise<void> {
    const source = item.source;
    if (!this.data.has(source)) {
      this.data.set(source, []);
    }
    this.data.get(source)!.push(item);
    logger.debug(`Saved data for source: ${source}`);
  }

  async saveBatch(items: CollectedData[]): Promise<void> {
    for (const item of items) {
      await this.save(item);
    }
    logger.info(`Saved batch of ${items.length} items`);
  }

  async findBySource(source: string, since?: Date): Promise<CollectedData[]> {
    const items = this.data.get(source) || [];
    if (since) {
      return items.filter(item => item.collectedAt >= since);
    }
    return items;
  }

  async findLatest(source: string): Promise<CollectedData | null> {
    const items = this.data.get(source) || [];
    return items[items.length - 1] || null;
  }

  async deleteOlderThan(date: Date): Promise<number> {
    let count = 0;
    for (const [source, items] of this.data.entries()) {
      const filtered = items.filter(item => item.collectedAt >= date);
      count += items.length - filtered.length;
      this.data.set(source, filtered);
    }
    return count;
  }

  getStats() {
    let total = 0;
    const bySource: Record<string, number> = {};
    for (const [source, items] of this.data.entries()) {
      total += items.length;
      bySource[source] = items.length;
    }
    return { total, bySource };
  }
}

// Redis storage adapter
class RedisStorage implements StorageAdapter {
  private redis: any;
  private listName = 'queue:pending';
  private latestPrefix = 'data:';
  private timelinePrefix = 'timeline:';
  private redisUrl: string;

  constructor(redisUrl: string) {
    this.redis = null;
    this.redisUrl = redisUrl;
  }

  async connect(): Promise<void> {
    try {
      const { default: Redis } = await import('ioredis');
      this.redis = new Redis(this.redisUrl);
      await this.redis.ping();
      logger.info('Connected to Redis');
    } catch (error) {
      logger.warn('Redis connection failed, falling back to memory storage');
      throw error;
    }
  }

  async save(item: CollectedData): Promise<void> {
    const key = `${this.latestPrefix}${item.source}:latest`;
    const timelineKey = `${this.timelinePrefix}${item.source}`;
    const json = JSON.stringify(item);

    await this.redis.hset(key, { data: json, updatedAt: Date.now() });
    await this.redis.zadd(timelineKey, Date.now(), json);
    await this.redis.lpush(this.listName, json);
  }

  async saveBatch(items: CollectedData[]): Promise<void> {
    for (const item of items) {
      await this.save(item);
    }
    logger.info(`Saved batch of ${items.length} items to Redis`);
  }

  async findBySource(source: string, since?: Date): Promise<CollectedData[]> {
    const timelineKey = `${this.timelinePrefix}${source}`;
    const items = await this.redis.zrange(timelineKey, 0, -1);
    const parsed = items.map((i: string) => JSON.parse(i));
    if (since) {
      return parsed.filter((item: CollectedData) => item.collectedAt >= since);
    }
    return parsed;
  }

  async findLatest(source: string): Promise<CollectedData | null> {
    const key = `${this.latestPrefix}${source}:latest`;
    const data = await this.redis.hget(key, 'data');
    return data ? JSON.parse(data) : null;
  }

  async deleteOlderThan(_date: Date): Promise<number> {
    // Implementation for cleanup
    return 0;
  }
}

// Export singleton instance
export const storage = new MemoryStorage();
export { MemoryStorage, RedisStorage };
