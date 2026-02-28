#!/usr/bin/env node

/**
 * FTS5 Processing Script - Pass 1: Simple Load
 * Processes 44MB Anthropic conversation export into SQLite FTS5 database
 *
 * Usage: node process-conversations.js [source-json-path] [output-db-path]
 * Default: ~/@@-0228.../data.../conversations.json → ./conversations.db
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Expand ~ in paths
String.prototype.expandUser = function() {
  return this.replace(/^~/, process.env.HOME);
};

// Configuration
const SOURCE_JSON = process.argv[2] || '~/@@-0228-MASSIVE-CLAUDE-DOWNLOAD-OF-AL-NINE-MONTHS-OF-CONVERSATIIONS/data-2026-02-28-17-43-32-batch-0000/conversations.json'.expandUser();
const OUTPUT_DB = process.argv[3] || './conversations.db';

console.log('🚀 FTS5 PASS 1: Complete File Load');
console.log('='.repeat(60));
console.log(`📂 Source: ${SOURCE_JSON}`);
console.log(`💾 Output: ${OUTPUT_DB}`);
console.log('');

// Check source file exists
if (!fs.existsSync(SOURCE_JSON)) {
  console.error(`❌ Source file not found: ${SOURCE_JSON}`);
  process.exit(1);
}

const fileSize = fs.statSync(SOURCE_JSON).size;
console.log(`📊 File size: ${(fileSize / 1024 / 1024).toFixed(1)} MB`);
console.log('');

// Initialize database
const db = new sqlite3.Database(OUTPUT_DB);

// Create tables
console.log('📋 Creating database schema...');
db.serialize(() => {
  // Main conversations table
  db.run(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      uuid TEXT UNIQUE,
      name TEXT,
      summary TEXT,
      created_at TEXT,
      updated_at TEXT,
      full_text TEXT,
      message_count INTEGER,
      created_date DATE,
      created_year_month TEXT,
      created_year INT
    )
  `);

  // Full-text search virtual table (standalone, not external content)
  db.run(`
    CREATE VIRTUAL TABLE IF NOT EXISTS conversations_fts USING fts5(
      full_text,
      name,
      summary
    )
  `);

  // Indexes for filtering
  db.run(`CREATE INDEX IF NOT EXISTS idx_created_at ON conversations(created_at)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_created_date ON conversations(created_date)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_created_year_month ON conversations(created_year_month)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_name ON conversations(name)`);

  console.log('✅ Schema created');
  console.log('');
});

// Process JSON file
console.log('📥 Reading conversations.json...');

let totalConversations = 0;
let totalMessages = 0;

// Read and parse entire JSON file
const jsonData = fs.readFileSync(SOURCE_JSON, 'utf8');

console.log('⏳ Parsing JSON array...');
let conversations = [];
try {
  conversations = JSON.parse(jsonData);
  if (!Array.isArray(conversations)) {
    throw new Error('JSON root is not an array');
  }
  console.log(`✅ Parsed ${conversations.length} conversations from JSON\n`);
} catch (err) {
  console.error('❌ Failed to parse JSON:', err.message);
  process.exit(1);
}

// Process conversations
console.log('💾 Processing conversations...');
let insertCount = 0;
let errorCount = 0;

conversations.forEach((obj, idx) => {
  try {
    processConversation(obj);
    insertCount++;

    // Progress indicator every 100 conversations
    if (insertCount % 100 === 0) {
      process.stdout.write(`\r⏳ Processed ${insertCount}/${conversations.length} conversations...`);
    }
  } catch (e) {
    errorCount++;
    if (errorCount <= 5) { // Only show first 5 errors
      console.error(`\n❌ Error processing conversation ${idx}:`, e.message);
    }
  }
});

console.log(`\r⏳ Processed ${insertCount}/${conversations.length} conversations\n`);

// Finalize and close database
db.serialize(() => {
  db.run('PRAGMA optimize;');

  // Wait a moment for all inserts to complete, then close
  setTimeout(() => {
    db.close(() => {
      console.log('═'.repeat(60));
      console.log('✅ PROCESSING COMPLETE');
      console.log('═'.repeat(60));
      console.log(`📊 Total conversations indexed: ${totalConversations}`);
      console.log(`💬 Total messages indexed: ${totalMessages}`);
      console.log(`💾 Database: ${OUTPUT_DB}`);
      console.log('');
      console.log('📝 Search examples:');
      console.log(`   node search.js ${OUTPUT_DB} --date 2025-06-29`);
      console.log(`   node search.js ${OUTPUT_DB} --search "voice interface"`);
      console.log(`   node search.js ${OUTPUT_DB} --month 2025-06`);
      console.log('');
      process.exit(0);
    });
  }, 1000);
});

// Process individual conversation
function processConversation(obj) {
  const uuid = obj.uuid || '';
  const name = obj.name || '';
  const summary = obj.summary || '';
  const createdAt = obj.created_at || '';
  const updatedAt = obj.updated_at || '';

  // Skip invalid entries
  if (!uuid || !createdAt) {
    throw new Error('Missing required fields (uuid or created_at)');
  }

  // Extract date components
  const createdDate = createdAt.split('T')[0]; // YYYY-MM-DD
  const createdYearMonth = createdDate.substring(0, 7); // YYYY-MM
  const createdYear = createdDate.substring(0, 4); // YYYY

  // Extract message count
  const messages = obj.chat_messages || [];
  const messageCount = messages.length;
  totalMessages += messageCount;

  // Combine all text for full-text search
  const fullText = [
    name,
    summary,
    messages.map(msg => {
      if (msg.text) return msg.text;
      if (msg.content && Array.isArray(msg.content)) {
        return msg.content.map(c => c.text || '').join(' ');
      }
      if (typeof msg.content === 'string') return msg.content;
      return '';
    }).join('\n')
  ].join('\n\n');

  // Insert into main table
  db.run(
    `INSERT OR REPLACE INTO conversations
     (id, uuid, name, summary, created_at, updated_at, full_text, message_count, created_date, created_year_month, created_year)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [uuid, uuid, name, summary, createdAt, updatedAt, fullText, messageCount, createdDate, createdYearMonth, createdYear],
    (err) => {
      if (err && err.message.includes('UNIQUE constraint failed')) {
        // Duplicate, skip silently
      } else if (err) {
        console.error(`❌ Database error inserting ${uuid}:`, err.message);
      }
    }
  );

  totalConversations++;
}
