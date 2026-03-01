#!/usr/bin/env node

/**
 * THREE-TIER SEARCH SYSTEM: Tier 2 Metadata Extraction
 * Analyzes conversation full_text to extract topics, subjects, and decisions
 * Created: 2026-03-01
 *
 * Usage: node extract-tier2-metadata.js [path/to/database.db]
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.argv[2] || './conversations.db';

console.log(`📖 THREE-TIER METADATA EXTRACTOR`);
console.log(`📂 Database: ${DB_PATH}`);
console.log('');

// Topic detection patterns
const TOPIC_PATTERNS = {
  'VPS': /VPS|server|deployment|host|infrastructure|failover/gi,
  'security': /security|authentication|SSH|encryption|password|key|vault|token/gi,
  'database': /database|sqlite|FTS5|index|query|table|schema|migration/gi,
  'testing': /test|verify|check|debug|reproduce|validate|confirm/gi,
  'API': /API|endpoint|REST|request|response|route|handler/gi,
  'voice': /voice|audio|speech|transcript|conversation/gi,
  'git': /git|commit|branch|merge|push|pull|repository|fossil/gi,
  'automation': /automation|script|cron|workflow|pipeline|CI|CD/gi,
  'email': /email|SMTP|send|mail|notification|alert/gi,
  'performance': /performance|optimize|speed|latency|throughput|cache/gi,
};

// Decision pattern keywords
const DECISION_KEYWORDS = [
  'decided', 'decided to', 'will use', 'will implement',
  'going to', "let's", 'solution:', 'resolved:', 'fix:',
  'approach:', 'strategy:', 'implemented', 'created', 'deployed',
  'recommendation:', 'should', 'must', 'critical'
];

/**
 * Extract topics from text based on pattern matching
 */
function extractTopics(text) {
  if (!text) return 'general';

  const topics = [];
  for (const [topic, pattern] of Object.entries(TOPIC_PATTERNS)) {
    if (pattern.test(text)) {
      topics.push(topic);
    }
  }

  return topics.length > 0 ? topics.join(',') : 'general';
}

/**
 * Extract subjects discussed (scan for key phrases)
 */
function extractSubjects(text, name) {
  if (!text) return 'Unknown subject';

  const preview = text.substring(0, 500);
  const topics = extractTopics(text);

  return `Topics: ${topics}. Summary: ${preview.replace(/\n/g, ' ')}`;
}

/**
 * Extract key decisions from text
 */
function extractDecisions(text) {
  if (!text) return 'No decisions extracted';

  const lines = text.split('\n');
  const decisions = [];

  lines.forEach((line, idx) => {
    const hasBold = line.includes('**');
    const hasKeyword = DECISION_KEYWORDS.some(kw =>
      line.toLowerCase().includes(kw)
    );

    if ((hasBold || hasKeyword) && line.length < 300) {
      const cleaned = line.replace(/[*_#]/g, '').trim();
      if (cleaned.length > 10) {
        decisions.push(cleaned);
      }
    }
  });

  return decisions.length > 0
    ? decisions.slice(0, 3).join(' | ')
    : 'Implementation work completed';
}

/**
 * Main processing function
 */
async function processConversations() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);

    console.log('📊 Starting Tier 2 metadata extraction...');

    db.all(`
      SELECT id, name, created_at, full_text, message_count
      FROM conversations
      ORDER BY created_at DESC
    `, (err, rows) => {
      if (err) {
        console.error('❌ Query error:', err);
        reject(err);
        return;
      }

      if (!rows || rows.length === 0) {
        console.error('❌ No conversations found in database');
        reject(new Error('Empty database'));
        return;
      }

      console.log(`📝 Found ${rows.length} conversations to process`);
      console.log('');

      let processed = 0;
      let failed = 0;

      rows.forEach((row, index) => {
        const topics = extractTopics(row.full_text);
        const subjects = extractSubjects(row.full_text, row.name);
        const decisions = extractDecisions(row.full_text);
        const timestamp = new Date(row.created_at).toISOString().split('T')[0];

        db.run(`
          INSERT OR REPLACE INTO conversations_tier2_context
          (id, timestamp, topics, subjects_discussed, key_decisions, message_count, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          row.id,
          timestamp,
          topics,
          subjects,
          decisions,
          row.message_count,
          row.created_at
        ], (insertErr) => {
          if (insertErr) {
            console.error(`❌ Insert error for ${row.id}:`, insertErr);
            failed++;
          } else {
            processed++;
            if (processed % 50 === 0) {
              const percent = Math.round((processed / rows.length) * 100);
              console.log(`   ✓ ${processed}/${rows.length} (${percent}%) processed...`);
            }
          }

          // When all done
          if (processed + failed === rows.length) {
            console.log('');
            console.log(`✅ Tier 2 extraction complete: ${processed} successful, ${failed} failed`);
            console.log('');

            db.get(`
              SELECT COUNT(*) as count FROM conversations_tier2_context
            `, (countErr, result) => {
              if (!countErr) {
                console.log(`📊 Tier 2 Database Statistics:`);
                console.log(`   Total records: ${result.count}`);
              }

              db.close((closeErr) => {
                if (closeErr) reject(closeErr);
                else resolve(processed);
              });
            });
          }
        });
      });
    });
  });
}

// Run
processConversations()
  .then((count) => {
    console.log('');
    console.log('✅ THREE-TIER SEARCH SYSTEM READY');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Add search aliases to ~/.bashrc');
    console.log('  2. Run: source ~/.bashrc');
    console.log('  3. Try: search-status');
    console.log('  4. Start searching: search-smart');
    console.log('');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ ERROR:', err.message);
    process.exit(1);
  });
