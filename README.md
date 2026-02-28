# FTS5 Conversation Archive GUI

**Status:** Early Development - Iteration 002

## Vision
Build a beautiful, functional UI/UX-first interface for searching 9 months of Claude conversation history (44MB of JSON conversations).

## Design Philosophy
- **UI First**: Design the interface we want, then build the database and backend to support it
- **Incremental Versions**: Each iteration numbered (002.html, 003.html, 004.html, etc.)
- **Beautiful Design**: Pastel multi-color scheme, modern responsive layout
- **Powerful Search**: Full-text search across all conversations with filters and facets

## Directory Structure
```
/var/www/html/@@_BIG_BEAUTIFUL_FTS5/
├── html/          - HTML GUI iterations
├── css/           - Extracted styles (when refactored)
├── js/            - JavaScript/API handlers
├── db/            - SQLite3 FTS5 database files
├── sql/           - SQL schema and migration scripts
├── data/          - Raw conversation data exports
├── docs/          - Design docs and specifications
└── assets/        - Images, icons, fonts
```

## Iteration Log

### 002.html (Current)
- Beautiful pastel gradient header
- Full-text search bar with filters
- Date range picker
- Project selector (Voice Interface, Q8, Q10, Q11, Q12, Q19)
- Sidebar with faceted search (Projects, Topics, Status)
- Result cards with preview
- Responsive design (mobile, tablet, desktop)
- Pagination controls
- Sort options (Newest, Oldest, Relevance)

## Next Steps
1. Design database schema based on UI needs
2. Build SQLite3 FTS5 backend
3. Create API endpoints for search
4. Implement JavaScript event handlers
5. Bootstrap all 44MB of conversation data
6. Iterate on UI based on real data

## Technical Stack
- Frontend: HTML5, CSS3, Vanilla JavaScript
- Backend: Node.js (TBD)
- Database: SQLite3 with FTS5 (Full-Text Search)
- Version Control: Fossil SCM + Git
- Deployment: Apache localhost + GitHub (MIT License)

## License
MIT License - Will be published to GitHub
