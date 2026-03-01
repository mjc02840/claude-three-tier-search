-- THREE-TIER SEARCH SYSTEM DATABASE SCHEMA
-- Created: 2026-03-01
-- License: MIT

-- ====================
-- TIER 1: QUICK INDEX
-- ====================
CREATE TABLE IF NOT EXISTS conversations_tier1_quick (
  id TEXT PRIMARY KEY,
  timestamp TEXT,
  project TEXT,
  one_paragraph_summary TEXT,
  created_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_tier1_timestamp ON conversations_tier1_quick(timestamp);
CREATE INDEX IF NOT EXISTS idx_tier1_project ON conversations_tier1_quick(project);

-- ====================
-- TIER 2: CONTEXTUAL METADATA
-- ====================
CREATE TABLE IF NOT EXISTS conversations_tier2_context (
  id TEXT PRIMARY KEY,
  timestamp TEXT,
  topics TEXT,
  subjects_discussed TEXT,
  key_decisions TEXT,
  message_count INTEGER,
  created_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_tier2_timestamp ON conversations_tier2_context(timestamp);
CREATE INDEX IF NOT EXISTS idx_tier2_topics ON conversations_tier2_context(topics);

-- ====================
-- TIER 3: FULL-TEXT SEARCH (FTS5)
-- ====================
CREATE VIRTUAL TABLE IF NOT EXISTS conversations_fts USING fts5(
  full_text,
  content=conversations_full,
  content_rowid=id
);

CREATE TABLE IF NOT EXISTS conversations_full (
  id TEXT PRIMARY KEY,
  full_text TEXT
);

-- ====================
-- MAIN CONVERSATIONS TABLE
-- ====================
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
  created_year INTEGER
);

CREATE INDEX IF NOT EXISTS idx_created_at ON conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_created_date ON conversations(created_date);
CREATE INDEX IF NOT EXISTS idx_created_year_month ON conversations(created_year_month);
CREATE INDEX IF NOT EXISTS idx_name ON conversations(name);
