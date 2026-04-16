import { z } from 'zod';

// Data source schema
export const DataSourceSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url(),
  enabled: z.boolean().default(true),
  schedule: z.string().optional(), // cron expression
  selector: z.string().optional(), // CSS selector for HTML parsing
  fields: z.record(z.string()).optional(),
  headers: z.record(z.string()).optional(),
  timeout: z.number().default(30000),
  retries: z.number().default(3),
});

export type DataSource = z.infer<typeof DataSourceSchema>;

// Collected data schema
export const CollectedDataSchema = z.object({
  id: z.string().uuid().optional(),
  source: z.string(),
  type: z.string(),
  title: z.string().optional(),
  content: z.any(),
  url: z.string().url().optional(),
  metadata: z.record(z.any()).optional(),
  collectedAt: z.date(),
  createdAt: z.date().optional(),
});

export type CollectedData = z.infer<typeof CollectedDataSchema>;

// Collector result
export interface CollectorResult {
  success: boolean;
  source: string;
  data?: CollectedData[];
  error?: string;
  duration: number;
}

// Storage interface
export interface StorageAdapter {
  save(data: CollectedData): Promise<void>;
  saveBatch(data: CollectedData[]): Promise<void>;
  findBySource(source: string, since?: Date): Promise<CollectedData[]>;
  findLatest(source: string): Promise<CollectedData | null>;
  deleteOlderThan(date: Date): Promise<number>;
}

// Queue item for Redis
export interface QueueItem {
  source: string;
  data: CollectedData;
  queuedAt: Date;
}
