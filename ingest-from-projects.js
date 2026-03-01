#!/usr/bin/env node

/**
 * AUTO-INGEST SCRIPT: Read conversations from /home/aaa/.claude/projects/
 * and insert into conversations.db automatically
 *
 * Usage: node ingest-from-projects.js [optional-date-filter]
 * Example: node ingest-from-projects.js 2026-03-01
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const PROJECTS_DIR = '/home/aaa/.claude/projects';
const DB_PATH = './conversations.db';
const DATE_FILTER = process.argv[2] || null; // Optional: filter by date

console.log('');
console.log('📚 AUTO-INGEST: Claude Projects to Database');
console.log(`📂 Source: ${PROJECTS_DIR}`);
console.log(`📊 Database: ${DB_PATH}`);
if (DATE_FILTER) console.log(`📅 Filter: ${DATE_FILTER}`);
console.log('');

/**
 * Parse markdown conversation file
 */
function parseConversationFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);

    // Extract date from filename: claude-conversation-2026-03-01-*.md
    const dateMatch = fileName.match(/claude-conversation-(\d{4}-\d{2}-\d{2})/);
    const date = dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0];

    // Create unique ID from filename
    const id = fileName.replace('claude-conversation-', '').replace('.md', '');

    return {
      id: id,
      date: date,
      fileName: fileName,
      fullText: content,
      messageCount: (content.match(/\n/g) || []).length,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    console.error(`❌ Error parsing ${filePath}:`, err.message);
    return null;
  }
}

/**
 * Insert conversation into database
 */
function insertConversation(db, conv) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT OR REPLACE INTO conversations
       (id, name, summary, created_at, full_text, message_count, created_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        conv.id,
        `Claude Conversation ${conv.date}`,
        conv.fullText.substring(0, 200),
        conv.timestamp,
        conv.fullText,
        conv.messageCount,
        conv.date
      ],
      function(err) {
        if (err) reject(err);
        else resolve(conv.id);
      }
    );
  });
}

/**
 * Main ingestion function
 */
async function ingestFromProjects() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);

    // Read all .md files from projects directory
    try {
      const files = fs.readdirSync(PROJECTS_DIR)
        .filter(f => f.startsWith('claude-conversation-') && f.endsWith('.md'))
        .sort()
        .reverse(); // Most recent first

      console.log(`📝 Found ${files.length} conversation files`);
      console.log('');

      if (files.length === 0) {
        console.log('⚠️ No conversation files found');
        db.close();
        resolve(0);
        return;
      }

      let processed = 0;
      let inserted = 0;
      let skipped = 0;
      let failed = 0;

      // Process each file
      files.forEach((file, index) => {
        const filePath = path.join(PROJECTS_DIR, file);
        const conv = parseConversationFile(filePath);

        if (!conv) {
          failed++;
          processed++;
          return;
        }

        // Apply date filter if specified
        if (DATE_FILTER && !conv.date.startsWith(DATE_FILTER)) {
          skipped++;
          processed++;
          return;
        }

        // Insert into database
        insertConversation(db, conv)
          .then((id) => {
            inserted++;
            processed++;

            if (processed % 10 === 0 || processed === files.length) {
              const percent = Math.round((processed / files.length) * 100);
              console.log(`   ✓ ${processed}/${files.length} (${percent}%) processed...`);
            }

            // When all done
            if (processed === files.length) {
              console.log('');
              console.log(`✅ INGESTION COMPLETE`);
              console.log(`   Inserted: ${inserted}`);
              console.log(`   Skipped:  ${skipped}`);
              console.log(`   Failed:   ${failed}`);
              console.log('');

              db.close((err) => {
                if (err) reject(err);
                else resolve(inserted);
              });
            }
          })
          .catch((err) => {
            console.error(`❌ Insert error for ${conv.id}:`, err.message);
            failed++;
            processed++;

            if (processed === files.length) {
              db.close();
              resolve(inserted);
            }
          });
      });
    } catch (err) {
      console.error('❌ ERROR:', err.message);
      db.close();
      reject(err);
    }
  });
}

// Run
ingestFromProjects()
  .then((count) => {
    console.log('🎯 Next steps:');
    console.log('   1. Run: node extract-tier2-metadata.js');
    console.log('   2. Try: search-smart "your-search"');
    console.log('');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ FATAL ERROR:', err.message);
    process.exit(1);
  });
