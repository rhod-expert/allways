# Task Completion Checklist

When completing a task on this project, follow these steps:

## Backend Changes
1. Ensure `'use strict';` at top of new files
2. Use bind parameters in SQL queries (never interpolate)
3. Follow controller → service → model pattern
4. Add SQL queries as constants in `models/queries.js` if new queries needed
5. Test with: `pm2 restart allways-api && pm2 logs allways-api --lines 50`
6. Verify health: `curl http://localhost:3001/api/health`

## Frontend Changes
1. No semicolons in frontend files
2. Import from `react-router` (NOT `react-router-dom`)
3. Use TailwindCSS 3.4 classes with `allways-*` palette
4. Use `api` from `services/api.js` for HTTP calls
5. Build: `cd /var/www/html/allways/frontend && npm run build`
6. Verify build succeeded (check dist/ output)

## Database Changes
1. Add SQL scripts to `database/` directory with numbered prefix
2. Update `run-all.sql` if adding new scripts
3. Use `ALLWAYS_` prefix for all tables
4. Use Oracle syntax (IDENTITY, FETCH FIRST, DUAL, SYSDATE, etc.)

## After Any Change
1. Test the specific functionality modified
2. Rebuild frontend if frontend changes: `cd frontend && npm run build`
3. Restart backend if backend changes: `pm2 restart allways-api`
4. Check no console errors: `pm2 logs allways-api --lines 20`
