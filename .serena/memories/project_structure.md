# Project Structure

## Root: /var/www/html/allways/
```
├── backend/                    # Express API (port 3001)
│   ├── server.js               # Entry point (starts DB pool, seeds admin, listens)
│   ├── .env                    # Environment variables
│   ├── uploads/                # User uploads (facturas/, productos/)
│   └── src/
│       ├── app.js              # Express app setup (helmet, cors, routes)
│       ├── config/
│       │   ├── database.js     # Oracle pool (initialize, execute, executeTransaction)
│       │   └── env.js          # dotenv + validation
│       ├── controllers/        # Request handlers (thin, delegate to services)
│       │   ├── authController.js       # Login, password change, seed admin
│       │   ├── adminController.js      # CRUD for registros, participantes
│       │   ├── registrationController.js # POST /registro
│       │   ├── couponController.js     # Coupon queries
│       │   └── dashboardController.js  # Stats, charts
│       ├── middleware/
│       │   ├── auth.js         # JWT verification (verifyToken)
│       │   ├── rateLimiter.js  # Rate limits per endpoint
│       │   ├── recaptcha.js    # reCAPTCHA v3 verification
│       │   ├── upload.js       # Multer config (imagenFactura, imagenProductos)
│       │   └── errorHandler.js # Global error handler
│       ├── models/
│       │   └── queries.js      # 30+ SQL queries as constants (bind params)
│       ├── routes/
│       │   ├── public.js       # /registro, /cupones/consulta, /premios
│       │   ├── admin.js        # /admin/* (JWT required)
│       │   └── uploads.js      # /uploads/:type/:filename
│       └── services/           # Business logic
│           ├── registrationService.js  # Registration + image processing (sharp)
│           ├── couponService.js        # Coupon generation AW-2026-XXXXXX
│           ├── dashboardService.js     # Aggregations for admin dashboard
│           └── recaptchaService.js     # Google reCAPTCHA API
│
├── frontend/                   # React 18 + Vite 6 + TailwindCSS 3.4
│   ├── vite.config.js          # base: '/allways/', proxy config
│   ├── tailwind.config.js      # Custom allways-* colors, animations
│   ├── dist/                   # Production build (served by Nginx)
│   └── src/
│       ├── App.jsx             # Router (public + admin routes)
│       ├── main.jsx            # Entry point (AuthProvider, BrowserRouter, ToastContainer)
│       ├── index.css           # TailwindCSS + custom styles
│       ├── context/AuthContext.jsx  # Auth state (JWT + localStorage)
│       ├── services/api.js     # Axios instance (baseURL: /allways/api)
│       ├── hooks/              # useAuth, useApi, useRecaptcha
│       ├── utils/validators.js # Client-side validation
│       ├── components/
│       │   ├── layout/         # Header, Footer, AdminLayout
│       │   ├── landing/        # Hero, Prizes, HowTo, Brands, CTA, FinalDraw, GoldParticles
│       │   ├── admin/          # StatsCard
│       │   ├── charts/         # LineChartCard, BarChartCard (Recharts)
│       │   ├── form/           # ImageDropzone
│       │   └── ui/             # Badge, Button, Card, Input, Modal, Spinner
│       └── pages/
│           ├── HomePage.jsx          # Landing page
│           ├── RegisterPage.jsx      # Registration form
│           ├── CouponCheckPage.jsx   # Coupon lookup
│           ├── LoginPage.jsx         # Admin login
│           ├── DashboardPage.jsx     # Admin dashboard
│           ├── ClientsPage.jsx       # Admin: registration list
│           ├── ClientDetailPage.jsx  # Admin: registration detail/validation
│           ├── RulesPage.jsx         # Bases y condiciones
│           ├── PrivacyPage.jsx       # Privacy policy
│           ├── LegalNoticePage.jsx   # Legal notice
│           └── NotFoundPage.jsx      # 404
│
├── database/                   # Oracle 19C SQL scripts
│   ├── 00-drop-tables.sql     # DROP (dev only)
│   ├── 01-create-tables.sql   # 6 tables: ADMIN, PARTICIPANTES, REGISTROS, CUPONES, PREMIOS, ADMIN_LOG
│   ├── 02-create-indexes.sql  # Performance indexes
│   ├── 05-seed-prizes.sql     # 30 prizes (April-October)
│   └── run-all.sql            # Execute all scripts in order
│
├── nginx/allways.conf          # Nginx config (SPA + API proxy + SSL)
├── imgs/                       # Original assets
├── README.md                   # Full documentation
└── PROMPT-ALLWAYS.md           # Original project specification
```

## Key API Routes
- Public: POST /api/registro, POST /api/cupones/consulta, GET /api/premios
- Admin: POST /api/admin/login, GET/PUT /api/admin/registros, GET /api/admin/dashboard/*
