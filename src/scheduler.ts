import cron from 'node-cron';
import { DataSource, CollectorResult } from './types.js';
import { collector } from './collector.js';
import { getEnabledSources } from './config.js';
import logger from './logger.js';

export class Scheduler {
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private isRunning = false;

  start(): void {
    if (this.isRunning) {
      logger.warn('Scheduler is already running');
      return;
    }

    this.isRunning = true;
    const sources = getEnabledSources();

    for (const source of sources) {
      if (source.schedule) {
        this.schedule(source);
      }
    }

    logger.info(`Scheduler started with ${this.jobs.size} scheduled jobs`);
  }

  stop(): void {
    for (const [name, job] of this.jobs.entries()) {
      job.stop();
      logger.info(`Stopped scheduled job: ${name}`);
    }
    this.jobs.clear();
    this.isRunning = false;
    logger.info('Scheduler stopped');
  }

  schedule(source: DataSource): void {
    if (!source.schedule) {
      logger.warn(`No schedule defined for ${source.name}`);
      return;
    }

    // Validate cron expression
    if (!cron.validate(source.schedule)) {
      logger.error(`Invalid cron expression for ${source.name}: ${source.schedule}`);
      return;
    }

    const job = cron.schedule(source.schedule, async () => {
      logger.info(`Scheduled collection triggered for: ${source.name}`);
      try {
        const result = await collector.collect(source);
        if (result.success) {
          logger.info(`Scheduled collection success: ${source.name}`);
        } else {
          logger.error(`Scheduled collection failed: ${source.name}`, result.error);
        }
      } catch (error) {
        logger.error(`Scheduled collection error: ${source.name}`, error);
      }
    });

    this.jobs.set(source.name, job);
    logger.info(`Scheduled job: ${source.name} (${source.schedule})`);
  }

  async triggerNow(source: DataSource): Promise<CollectorResult> {
    logger.info(`Manual trigger for: ${source.name}`);
    return collector.collect(source);
  }

  getStatus() {
    return {
      running: this.isRunning,
      jobCount: this.jobs.size,
      jobs: Array.from(this.jobs.keys()),
    };
  }
}

export const scheduler = new Scheduler();
