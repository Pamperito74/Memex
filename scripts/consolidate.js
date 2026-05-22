#!/usr/bin/env node
const path = require('path');
const { execFileSync } = require('child_process');

const { resolveEngramPath } = require('./paths');
const ENGRAM_PATH = process.env.ENGRAM_PATH || resolveEngramPath(__dirname);

const CHECK_INTERVAL_MS = (parseInt(process.env.ENGRAM_CONSOLIDATE_INTERVAL) || 300) * 1000;
const BATTERY_OK = process.env.ENGRAM_CONSOLIDATE_BATTERY_OK === 'true';

function log(msg) {
  console.log(`[consolidate] ${msg}`);
}

function isOnBattery() {
  try {
    if (process.platform === 'darwin') {
      const out = execFileSync('pmset', ['-g', 'batterystate'], { encoding: 'utf8', timeout: 2000 });
      if (out.includes('discharging')) return true;
    }
  } catch {
    /* not a Mac or pmset unavailable */
  }
  return false;
}

async function consolidate(tasks) {
  tasks = tasks || { bloom: true };

  if (tasks.bloom) {
    log('Rebuilding bloom filter...');
    try {
      const { buildEngramBloomFilter } = require('./bloom-filter');
      await buildEngramBloomFilter();
      log('Bloom filter rebuilt');
    } catch (e) {
      log('Bloom filter rebuild failed: ' + e.message);
    }
  }

  if (tasks.manifest) {
    log('Regenerating manifest...');
    try {
      execFileSync(process.execPath, [
        path.join(__dirname, 'manifest-manager.js'), 'generate',
      ], { cwd: ENGRAM_PATH, stdio: 'pipe' });
      log('Manifest regenerated');
    } catch (e) {
      log('Manifest regeneration failed: ' + e.message);
    }
  }

  if (tasks.embeddings) {
    log('Generating embeddings (this may take a while)...');
    if (isOnBattery() && !BATTERY_OK) {
      log('Skipping embeddings — on battery. Set ENGRAM_CONSOLIDATE_BATTERY_OK=true to override.');
      return;
    }
    try {
      execFileSync(process.execPath, [
        path.join(__dirname, 'vector-search.js'), 'generate',
      ], { cwd: ENGRAM_PATH, stdio: 'pipe' });
      log('Embeddings generated');
    } catch (e) {
      log('Embedding generation failed: ' + e.message);
    }
  }
}

function startWatcher() {
  log(`Auto-consolidation active (interval: ${CHECK_INTERVAL_MS / 1000}s)`);
  const timer = setInterval(async () => {
    try {
      await consolidate({ bloom: true, manifest: false, embeddings: false });
    } catch (e) {
      log('Consolidation error: ' + e.message);
    }
  }, CHECK_INTERVAL_MS);

  if (typeof timer.unref === 'function') timer.unref();

  process.on('SIGINT', () => {
    clearInterval(timer);
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    clearInterval(timer);
    process.exit(0);
  });
}

if (require.main === module) {
  const isWatcher = process.argv.includes('--watch');
  const tasks = {
    bloom: !process.argv.includes('--no-bloom'),
    manifest: process.argv.includes('--manifest'),
    embeddings: process.argv.includes('--embeddings'),
  };

  if (isWatcher) {
    consolidate(tasks)
      .then(() => startWatcher())
      .catch(e => { console.error(e.message); process.exit(1); });
  } else {
    consolidate(tasks).catch(e => { console.error(e.message); process.exit(1); });
  }
}

module.exports = { consolidate, startWatcher };
