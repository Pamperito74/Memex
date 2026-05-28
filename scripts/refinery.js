'use strict';
const ledger = require('./ledger');

function ingest(sessionRecord) {
  if (!sessionRecord || !sessionRecord.plane) {
    throw new Error('refinery: sessionRecord with plane is required');
  }

  const { plane, assertions, source_span } = sessionRecord;
  const results = { created: 0, reinforced: 0, tensions_seeded: 0 };

  if (!Array.isArray(assertions)) return results;

  for (const a of assertions) {
    const params = {
      plane,
      class_: a.class || 'episodic',
      claim: a.claim,
      body: a.body,
      confidence: a.confidence || 0.5,
      source_spans: [source_span || `session:${sessionRecord.session_id || 'unknown'}`],
      staleness_model: a.staleness_model || 'flat',
    };

    const result = ledger.ingest(params);
    if (result.action === 'created') results.created++;
    else if (result.action === 'reinforced') results.reinforced++;
    if (result.negations && result.negations.length > 0) {
      results.tensions_seeded += result.negations.length;
    }
  }

  return results;
}

module.exports = { ingest };
