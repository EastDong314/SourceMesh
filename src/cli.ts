#!/usr/bin/env node

import { sources, getSource, getEnabledSources } from './config.js';
import { collector } from './collector.js';
import { scheduler } from './scheduler.js';
import { storage } from './storage.js';
import logger from './logger.js';

// CLI commands
type Command = 'collect' | 'trigger' | 'status' | 'list';

async function main() {
  const args = process.argv.slice(2);
  const command = (args[0] as Command) || 'list';
  const options = args.slice(1);

  logger.info(`Command: ${command}`, { options });

  switch (command) {
    case 'collect':
      await handleCollect(options);
      break;
    
    case 'trigger':
      await handleTrigger(options);
      break;
    
    case 'status':
      await handleStatus();
      break;
    
    case 'list':
    default:
      await handleList();
      break;
  }

  // Cleanup
  scheduler.stop();
}

async function handleCollect(options: string[]) {
  const sourceName = options.find(o => !o.startsWith('--'));
  const allFlag = options.includes('--all');

  if (allFlag) {
    const enabled = getEnabledSources();
    const results = await collector.collectAll(enabled);
    console.log('\n=== Collection Results ===');
    results.forEach(r => {
      const status = r.success ? '✅' : '❌';
      console.log(`${status} ${r.source}: ${r.duration}ms`);
      if (r.error) console.log(`   Error: ${r.error}`);
    });
  } else if (sourceName) {
    const source = getSource(sourceName);
    if (!source) {
      console.error(`Source not found: ${sourceName}`);
      process.exit(1);
    }
    const result = await collector.collect(source);
    console.log('\n=== Collection Result ===');
    console.log(`Source: ${result.source}`);
    console.log(`Status: ${result.success ? '✅ Success' : '❌ Failed'}`);
    console.log(`Duration: ${result.duration}ms`);
    if (result.error) console.log(`Error: ${result.error}`);
    if (result.data) console.log(`Items collected: ${result.data.length}`);
  } else {
    console.log('Usage: npm run collect -- <source-name> OR npm run collect -- --all');
  }
}

async function handleTrigger(options: string[]) {
  const sourceName = options[0];
  if (!sourceName) {
    console.error('Usage: npm run trigger -- <source-name>');
    process.exit(1);
  }

  const source = getSource(sourceName);
  if (!source) {
    console.error(`Source not found: ${sourceName}`);
    process.exit(1);
  }

  const result = await scheduler.triggerNow(source);
  console.log('\n=== Trigger Result ===');
  console.log(`Source: ${result.source}`);
  console.log(`Status: ${result.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`Duration: ${result.duration}ms`);
}

async function handleStatus() {
  const schedulerStatus = scheduler.getStatus();
  const storageStats = (storage as any).getStats?.() || { total: 0, bySource: {} };

  console.log('\n=== SourceMesh Status ===');
  console.log(`Scheduler: ${schedulerStatus.running ? '🟢 Running' : '🔴 Stopped'}`);
  console.log(`Scheduled Jobs: ${schedulerStatus.jobCount}`);
  
  console.log('\nStorage Stats:');
  console.log(`Total Items: ${storageStats.total}`);
  if (storageStats.bySource) {
    for (const [source, count] of Object.entries(storageStats.bySource)) {
      console.log(`  ${source}: ${count}`);
    }
  }
}

async function handleList() {
  console.log('\n=== Available Sources ===');
  if (sources.length === 0) {
    console.log('No sources configured. Add sources in src/config.ts');
    return;
  }
  
  for (const source of sources) {
    const status = source.enabled ? '🟢' : '🔴';
    const schedule = source.schedule || '(no schedule)';
    console.log(`${status} ${source.name}`);
    console.log(`   URL: ${source.url}`);
    console.log(`   Schedule: ${schedule}`);
    if (source.selector) {
      console.log(`   Selector: ${source.selector}`);
    }
    console.log();
  }
}

main().catch(console.error);
