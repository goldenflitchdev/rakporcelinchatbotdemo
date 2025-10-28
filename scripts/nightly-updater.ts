#!/usr/bin/env tsx
/**
 * Nightly Database Sync Scheduler
 * Automatically updates vector database every night at configured time
 */

import cron from 'node-cron';
import { syncDatabase } from './sync-database';

const NIGHTLY_UPDATE_TIME = process.env.NIGHTLY_UPDATE_TIME || '02:00';

function scheduleNightlyUpdate() {
  // Parse time (format: "HH:MM")
  const [hour, minute] = NIGHTLY_UPDATE_TIME.split(':');
  
  // Create cron expression: minute hour * * * (every day at specified time)
  const cronExpression = `${minute} ${hour} * * *`;

  console.log('🌙 Nightly Database Updater Started');
  console.log(`⏰ Scheduled for: ${NIGHTLY_UPDATE_TIME} (${cronExpression})`);
  console.log(`📅 Next run: ${getNextRunTime(parseInt(hour), parseInt(minute))}\n`);

  // Schedule the task
  cron.schedule(cronExpression, async () => {
    console.log('\n🌙 Starting nightly database sync...');
    console.log(`⏰ Time: ${new Date().toISOString()}\n`);

    try {
      await syncDatabase();
      console.log('✅ Nightly sync completed successfully!');
    } catch (error) {
      console.error('❌ Nightly sync failed:', error);
    }
  });

  // Also run immediately on startup
  console.log('🔄 Running initial sync on startup...\n');
  syncDatabase().catch(error => {
    console.error('❌ Initial sync failed:', error);
  });

  // Keep process alive
  console.log('✅ Scheduler is running. Press Ctrl+C to stop.\n');
}

function getNextRunTime(hour: number, minute: number): string {
  const now = new Date();
  const next = new Date();
  next.setHours(hour, minute, 0, 0);

  // If the time has already passed today, schedule for tomorrow
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  return next.toLocaleString();
}

// Run if called directly
if (require.main === module) {
  scheduleNightlyUpdate();
}

export { scheduleNightlyUpdate };

