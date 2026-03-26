# Code Style & Conventions

## Backend (Node.js/Express)
- **Module system**: CommonJS (`require`/`module.exports`)
- **Strict mode**: `'use strict';` at top of every file
- **No TypeScript** — plain JavaScript only
- **Naming**: camelCase for variables/functions, UPPER_SNAKE for SQL query constants
- **Architecture**: MVC pattern (controllers → services → models/queries → database)
- **Error handling**: Controllers use try/catch → next(err) → global errorHandler middleware
- **SQL queries**: Centralized in `src/models/queries.js` as named constants with bind parameters (:paramName)
- **Database access**: Via `src/config/database.js` module (execute, executeTransaction, etc.)
- **Response format**: `{ success: true/false, message: "...", data: {...}, pagination?: {...} }`
- **Console logging**: `[TAG]` prefix style, e.g. `[SERVER]`, `[DB]`, `[AUTH]`
- **No semicolons in frontend**, **semicolons in backend**

## Frontend (React/Vite)
- **Module system**: ES Modules (`import`/`export`)
- **No TypeScript** — JSX only
- **React Router v7**: Import from `react-router` (NOT `react-router-dom`)
- **State management**: React Context (AuthContext) + local state
- **HTTP client**: Axios instance at `src/services/api.js` (baseURL: `/allways/api`)
- **JWT storage**: `localStorage` keys: `allways_token`, `allways_user`
- **Styling**: TailwindCSS 3.4.17 with custom `allways-*` color palette
- **No semicolons** in frontend files
- **Functional components** only (no class components)
- **Custom hooks**: useAuth, useApi, useRecaptcha
- **Icons**: lucide-react
- **Animations**: framer-motion
- **Charts**: recharts
- **Notifications**: react-toastify

## Color Palette (tailwind.config.js)
```
allways-dark: '#0A1628'       (main background)
allways-navy: '#1A3A5C'       (gradients, alternating sections)
allways-blue: '#2563EB'       (links, interactive elements)
allways-cyan: '#4DB8FF'       (highlights, glows)
allways-gold: '#D4A843'       (CTA buttons, badges)
allways-gold-light: '#F0D78C' (hover states)
allways-green: '#2D7A3A'      (success badges, secondary buttons)
allways-gray-light: '#E8EDF2' (light section backgrounds)
```

## Database Conventions
- All table names: `ALLWAYS_` prefix
- Column names: UPPERCASE (Oracle convention)
- IDs: `NUMBER GENERATED ALWAYS AS IDENTITY`
- Boolean-like: `CHAR(1)` → `'S'`/`'N'`
- Status values: `'PENDIENTE'` | `'ACEPTADO'` | `'RECHAZADO'`
- Coupon format: `AW-2026-XXXXXX` (6 random digits)
- Timestamps: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
