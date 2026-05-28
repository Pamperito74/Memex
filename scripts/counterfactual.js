'use strict';
const ledger = require('./ledger');

function computeWeights(plane, { window_days = 30 } = {}) {
  const assertions = ledger.queryActiveByPlane(plane, { limit: 1000 });
  const now = new Date();

  for (const a of assertions) {
    const created = new Date(a.created_at);
    const ageDays = (now - created) / (1000 * 60 * 60 * 24);
    const recency = Math.max(0, 1 - ageDays / window_days);
    const quorumFactor = Math.min(a.quorum_count / 5, 1.0);
    const connectivity = a.supersedes ? (Array.isArray(a.supersedes) ? a.supersedes.length : 0) : 0;
    const connectivityFactor = Math.min(connectivity / 3, 1.0);
    const rarity = a.confidence < 0.3 ? 1.2 : a.confidence > 0.8 ? 0.8 : 1.0;

    const weight = Math.max(0.1, Math.min(2.0,
      (0.4 * recency) + (0.3 * quorumFactor) + (0.2 * connectivityFactor) + (0.1 * rarity)
    ));

    ledger.setCounterfactualWeight(a.id, weight);
  }

  return { plane, computed: assertions.length };
}

module.exports = { computeWeights };

if (require.main === module) {
  const args = process.argv.slice(2);
  let plane = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--plane' && args[i + 1]) plane = args[++i];
  }
  if (!plane) { console.error('Usage: node scripts/counterfactual.js --plane <plane>'); process.exit(1); }
  console.log(JSON.stringify(computeWeights(plane)));
}
