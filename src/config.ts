import { DataSource } from './types.js';

// Application configuration
export const config = {
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  enableScheduler: process.env.ENABLE_SCHEDULER !== 'false',
  database: {
    url: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/sourcemesh',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
};

// Predefined data sources
export const sources: DataSource[] = [
  {
    name: 'example-news',
    url: 'https://example.com/news',
    enabled: false, // Disabled by default, enable after configuration
    timeout: 30000,
    retries: 3,
  },
  // Add more sources here
];

// Get source by name
export function getSource(name: string): DataSource | undefined {
  return sources.find(s => s.name === name);
}

// Get enabled sources
export function getEnabledSources(): DataSource[] {
  return sources.filter(s => s.enabled);
}
