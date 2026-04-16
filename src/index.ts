import { config } from './config.js';
import { scheduler } from './scheduler.js';
import logger from './logger.js';

async function main() {
  logger.info('SourceMesh starting...');
  logger.info(`Environment: ${config.nodeEnv}`);

  // Start scheduler if enabled
  if (config.enableScheduler) {
    scheduler.start();
    
    // Graceful shutdown
    process.on('SIGINT', () => {
      logger.info('Received SIGINT, shutting down...');
      scheduler.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      logger.info('Received SIGTERM, shutting down...');
      scheduler.stop();
      process.exit(0);
    });
  }

  logger.info('SourceMesh is running. Use CLI commands to interact.');
  logger.info('Examples:');
  logger.info('  npm run collect -- --all');
  logger.info('  npm run collect -- <source-name>');
  logger.info('  npm run trigger -- <source-name>');
}

main().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});
