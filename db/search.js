#!/usr/bin/env node

/**
 * CLI Search Tool for FTS5 Conversation Database
 *
 * Usage:
 *   node search.js --date 2026-02-19
 *   node search.js --search "voice interface"
 *   node search.js --month 2026-02
 *   node search.js --year 2026
 *   node search.js --date-range 2026-02-15 2026-02-25
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.argv[2] || './conversations.db';

// Parse command line arguments
const args = process.argv.slice(2);
let searchType = null;
let searchValue = null;
let searchValue2 = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--date' && args[i + 1]) {
    searchType = 'date';
    searchValue = args[++i];
  } else if (args[i] === '--month' && args[i + 1]) {
    searchType = 'month';
    searchValue = args[++i];
  } else if (args[i] === '--year' && args[i + 1]) {
    searchType = 'year';
    searchValue = args[++i];
  } else if (args[i] === '--search' && args[i + 1]) {
    searchType = 'search';
    searchValue = args[++i];
  } else if (args[i] === '--date-range' && args[i + 1] && args[i + 2]) {
    searchType = 'daterange';
    searchValue = args[++i];
    searchValue2 = args[++i];
  }
}

if (!searchType) {
  showHelp();
  process.exit(1);
}

const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY);

console.log('🔍 Searching conversations database...\n');

let query = '';
let params = [];

switch (searchType) {
  case 'date':
    console.log(`📅 Searching for conversations on ${searchValue}:\n`);
    query = `SELECT uuid, name, created_at, message_count FROM conversations
             WHERE created_date = ? ORDER BY created_at DESC`;
    params = [searchValue];
    break;

  case 'month':
    console.log(`📅 Searching for conversations in ${searchValue}:\n`);
    query = `SELECT uuid, name, created_at, message_count FROM conversations
             WHERE created_year_month = ? ORDER BY created_at DESC`;
    params = [searchValue];
    break;

  case 'year':
    console.log(`📅 Searching for conversations in ${searchValue}:\n`);
    query = `SELECT uuid, name, created_at, message_count FROM conversations
             WHERE created_year = ? ORDER BY created_at DESC`;
    params = [searchValue];
    break;

  case 'search':
    console.log(`🔎 Full-text search: "${searchValue}"\n`);
    query = `SELECT uuid, name, created_at, message_count
             FROM conversations
             WHERE full_text LIKE ? OR name LIKE ? OR summary LIKE ?
             ORDER BY created_at DESC LIMIT 50`;
    params = [`%${searchValue}%`, `%${searchValue}%`, `%${searchValue}%`];
    break;

  case 'daterange':
    console.log(`📅 Searching for conversations between ${searchValue} and ${searchValue2}:\n`);
    query = `SELECT uuid, name, created_at, message_count FROM conversations
             WHERE created_date BETWEEN ? AND ? ORDER BY created_at DESC`;
    params = [searchValue, searchValue2];
    break;
}

db.all(query, params, (err, rows) => {
  if (err) {
    console.error('❌ Database error:', err.message);
    process.exit(1);
  }

  if (!rows || rows.length === 0) {
    console.log('❌ No conversations found.\n');
  } else {
    console.log(`✅ Found ${rows.length} conversation(s):\n`);

    rows.forEach((row, idx) => {
      console.log(`${idx + 1}. "${row.name}"`);
      console.log(`   UUID: ${row.uuid}`);
      console.log(`   Date: ${row.created_at}`);
      console.log(`   Messages: ${row.message_count}`);
      console.log('');
    });
  }

  // Show summary stats
  db.get(`SELECT COUNT(*) as total FROM conversations`, (err, stat) => {
    if (!err && stat) {
      console.log('─'.repeat(60));
      console.log(`📊 Database total: ${stat.total} conversations`);
    }
    db.close();
  });
});

function showHelp() {
  console.log(`
🔍 Conversation Search Tool - CLI Interface

Usage:
  node search.js <database.db> --date YYYY-MM-DD
  node search.js <database.db> --month YYYY-MM
  node search.js <database.db> --year YYYY
  node search.js <database.db> --search "keywords"
  node search.js <database.db> --date-range YYYY-MM-DD YYYY-MM-DD

Examples:
  node search.js conversations.db --date 2026-02-19
  node search.js conversations.db --month 2026-02
  node search.js conversations.db --year 2026
  node search.js conversations.db --search "voice interface"
  node search.js conversations.db --date-range 2026-02-15 2026-02-25

  `);
}
