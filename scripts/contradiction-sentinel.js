'use strict';
// Contradiction Sentinel — samples assertion pairs and seeds tension_pairs for contradictions
// Exports: scanPlane(plane, { sampleSize, threshold }) => { tensions_found }
// CLI: node scripts/contradiction-sentinel.js --plane <plane> [--sample-size <n>]

const { detectNegation } = require('./dedup');

function createSentinel(getLedgerFn, getDb) {
  function getWatermark(plane) {
    try {
      const db = typeof getDb === 'function' ? getDb() : null;
      if (!db) return null;
      const row = db.prepare(
        'SELECT last_scanned_at FROM sentinel_watermark WHERE plane = ?'
      ).get(plane);
      return row ? row.last_scanned_at : null;
    } catch {
      try {
        const db = getDb();
        db.exec(`CREATE TABLE IF NOT EXISTS sentinel_watermark (
          plane TEXT PRIMARY KEY,
          last_scanned_at TEXT NOT NULL
        )`);
      } catch { /* table may already exist */ }
      return null;
    }
  }

  function setWatermark(plane, timestamp) {
    const db = getDb();
    db.prepare(
      `INSERT OR REPLACE INTO sentinel_watermark (plane, last_scanned_at) VALUES (?, ?)`
    ).run(plane, timestamp);
  }

  async function scanPlane(plane, { sampleSize = 50, threshold = 0.7 } = {}) {
    const ledger = getLedgerFn();
    const watermark = getWatermark(plane);
    const now = new Date().toISOString();

    const rows = ledger.queryActiveByPlane(plane, {
      limit: sampleSize * 2,
      since: watermark ?? undefined,
    });

    if (rows.length === 0) {
      setWatermark(plane, now);
      return { tensions_found: 0, skipped: true, reason: 'no new assertions since last scan' };
    }

    let sample = rows;
    if (rows.length > sampleSize) {
      sample = rows.slice();
      for (let i = sample.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [sample[i], sample[j]] = [sample[j], sample[i]];
      }
      sample = sample.slice(0, sampleSize);
    }

    let tensions_found = 0;

    for (let i = 0; i < sample.length; i++) {
      for (let j = i + 1; j < sample.length; j++) {
        const a = sample[i];
        const b = sample[j];
        if (detectNegation(a.claim, b.claim, threshold)) {
          ledger.linkSupersession(a.id, b.id, 'contradicts');
          ledger.linkSupersession(b.id, a.id, 'contradicts');
          tensions_found += 1;
        }
      }
    }

    setWatermark(plane, now);

    return { tensions_found, new_assertions: rows.length };
  }

  return { scanPlane };
}

// Production singleton backed by real ledger
let _sentinel = null;
function getSentinel() {
  if (!_sentinel) {
    const ledger = require('./ledger');
    _sentinel = createSentinel(() => ledger, () => ledger.getDb());
  }
  return _sentinel;
}

function scanPlane(plane, opts) {
  return getSentinel().scanPlane(plane, opts);
}

module.exports = {
  scanPlane,
  _createForTesting: (ledger, getDb) => createSentinel(() => ledger, getDb),
};

if (require.main === module) {
  const args = process.argv.slice(2);
  let plane = null;
  let sampleSize = 50;
  let threshold = 0.7;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--plane' && args[i + 1]) {
      plane = args[++i];
    } else if (args[i] === '--sample-size' && args[i + 1]) {
      sampleSize = parseInt(args[++i], 10);
    } else if (args[i] === '--threshold' && args[i + 1]) {
      threshold = parseFloat(args[++i]);
    }
  }

  if (!plane) {
    console.error('Usage: node contradiction-sentinel.js --plane <plane> [--sample-size <n>] [--threshold <f>]');
    process.exit(1);
  }

  scanPlane(plane, { sampleSize, threshold })
    .then(result => console.log(JSON.stringify(result, null, 2)))
    .catch(err => {
      console.error(err.message);
      process.exit(1);
    });
}
