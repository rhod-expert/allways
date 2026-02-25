# Allways Show de Premios

Sistema web completo de campanha de sorteio de premios para **San Jose Import Export S.A. + Allways Health** (Paraguay).

Los participantes compran productos Allways, cargan su factura, y reciben cupones para sorteos mensuales con premios que van desde electrodomesticos hasta un **Renault Kwid 0 KM**.

---

## Stack Tecnologica

| Capa | Tecnologia | Version |
|------|-----------|---------|
| **Runtime** | Node.js | 20.20.0 |
| **Backend** | Express.js | 4.21.x |
| **Frontend** | React + Vite | 18.3 / 6.x |
| **CSS** | TailwindCSS | 3.4.17 |
| **Base de datos** | Oracle 19C | Client 19.25 |
| **Servidor web** | Nginx | Reverse proxy |
| **Proceso** | PM2 | Daemon |
| **SO** | Debian 13 (trixie) | x86_64 |

---

## Arquitectura

```
                    ┌─────────────┐
   Navegador ──────►│   Nginx:80  │
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              │                         │
     /allways/*                /allways/api/*
              │                         │
   ┌──────────▼──────────┐   ┌─────────▼─────────┐
   │  Frontend (SPA)     │   │  Backend API       │
   │  React + Vite       │   │  Express :3001     │
   │  dist/ servido por  │   │  PM2 managed       │
   │  Nginx (alias)      │   │                    │
   └─────────────────────┘   └─────────┬──────────┘
                                       │
                              ┌────────▼────────┐
                              │  Oracle 19C     │
                              │  192.168.1.240  │
                              │  :1521/wint     │
                              └─────────────────┘
```

---

## Estructura del Proyecto

```
/var/www/html/allways/
├── backend/                    # API Node.js + Express
│   ├── server.js               # Entry point
│   ├── .env                    # Variables de entorno
│   ├── uploads/                # Imagenes subidas
│   │   ├── facturas/           # Fotos de facturas
│   │   └── productos/          # Fotos de productos
│   └── src/
│       ├── app.js              # Express app setup (helmet, cors, routes)
│       ├── config/
│       │   ├── database.js     # Oracle connection pool (thick mode)
│       │   └── env.js          # Carga y validacion de .env
│       ├── controllers/
│       │   ├── authController.js        # POST /admin/login + PUT /cambiar-password + seed admin
│       │   ├── adminController.js       # CRUD registros, participantes
│       │   ├── registrationController.js # POST /registro
│       │   ├── couponController.js      # Consulta cupones, premios
│       │   └── dashboardController.js   # Stats, charts, top clientes, mapa
│       ├── middleware/
│       │   ├── auth.js          # JWT verification (verifyToken)
│       │   ├── rateLimiter.js   # Rate limits por endpoint
│       │   ├── recaptcha.js     # reCAPTCHA v3 verification
│       │   ├── upload.js        # Multer config (imagenFactura, imagenProductos)
│       │   └── errorHandler.js  # Global error handler con logging
│       ├── models/
│       │   └── queries.js       # 30+ SQL queries centralizadas (ALLWAYS_*)
│       ├── routes/
│       │   ├── public.js        # /registro, /cupones/consulta, /premios
│       │   ├── admin.js         # /admin/* (JWT required)
│       │   └── uploads.js       # /uploads/:type/:filename (JWT required)
│       └── services/
│           ├── registrationService.js  # Logica de registro + sharp
│           ├── couponService.js        # Generacion cupones AW-2026-XXXXXX
│           ├── dashboardService.js     # Agregaciones de stats
│           └── recaptchaService.js     # Google reCAPTCHA API
│
├── frontend/                   # React 18 + Vite 6 + TailwindCSS 3.4
│   ├── public/allways/
│   │   └── images/
│   │       ├── prizes/         # Imagenes de premios (11 archivos PNG)
│   │       ├── logo-allways-blanco.png  # Logo blanco (fondos oscuros)
│   │       └── logo-allways-dark.png    # Logo oscuro (fondos claros)
│   ├── dist/                   # Build de produccion (vite build)
│   └── src/
│       ├── App.jsx             # Router principal
│       ├── main.jsx            # Entry point React
│       ├── index.css           # TailwindCSS + custom styles
│       ├── components/
│       │   ├── layout/         # Header, Footer, AdminLayout
│       │   ├── landing/        # HeroSection, PrizesSection, HowToSection...
│       │   ├── admin/          # StatsCard
│       │   ├── charts/         # LineChartCard, BarChartCard (Recharts)
│       │   ├── form/           # ImageDropzone
│       │   └── ui/             # Badge, Button, Card, Input, Modal, Spinner
│       ├── pages/
│       │   ├── HomePage.jsx           # Landing page
│       │   ├── RegisterPage.jsx       # Formulario de registro
│       │   ├── CouponCheckPage.jsx    # Consulta de cupones
│       │   ├── LoginPage.jsx          # Login admin
│       │   ├── DashboardPage.jsx      # Dashboard admin
│       │   ├── ClientsPage.jsx        # Lista de registros
│       │   ├── ClientDetailPage.jsx   # Detalle + validacion
│       │   ├── RulesPage.jsx          # Bases y condiciones
│       │   ├── PrivacyPage.jsx        # Politica de privacidad
│       │   ├── LegalNoticePage.jsx    # Aviso legal
│       │   └── NotFoundPage.jsx       # 404
│       ├── context/AuthContext.jsx     # Auth state (JWT + localStorage)
│       ├── hooks/                      # useApi, useAuth
│       ├── services/api.js             # Axios instance (baseURL: /allways/api)
│       └── utils/validators.js         # Validaciones client-side
│
├── database/                   # Scripts SQL para Oracle 19C
│   ├── 00-drop-tables.sql      # DROP tables (solo desarrollo)
│   ├── 01-create-tables.sql    # 6 tablas: ALLWAYS_ADMIN, _PARTICIPANTES,
│   │                           #   _REGISTROS, _CUPONES, _PREMIOS, _ADMIN_LOG
│   ├── 02-create-indexes.sql   # Indices de performance
│   ├── 03-create-sequences.sql # (Oracle IDENTITY columns, no sequences)
│   ├── 04-seed-admin.sql       # Admin seed (bcrypt via backend)
│   ├── 05-seed-prizes.sql      # 10 premios mensuales
│   ├── run-all.sql             # Ejecutar todos los scripts en orden
│   ├── setup.sh                # Script shell para setup DB
│   └── setup_db.py             # Script Python para setup DB
│
├── nginx/
│   └── allways.conf            # Config nginx (SPA + API proxy)
│
├── imgs/                       # Assets originales (logos, fotos premios)
│   ├── logo-allways-01.png     # Logo oscuro original
│   ├── logo-allways-blanco.png # Logo blanco original (5391x3379)
│   ├── landpage/               # Referencias de diseño
│   └── *.png                   # Fotos originales de premios
│
└── PROMPT-ALLWAYS.md           # Especificacion original del proyecto
```

---

## API Endpoints

### Publicos (reCAPTCHA + rate limit)

| Metodo | Ruta | Descripcion | Rate Limit |
|--------|------|-------------|------------|
| `POST` | `/api/registro` | Registrar participante + factura + imagenes (multipart) | 5/15min |
| `POST` | `/api/cupones/consulta` | Consultar cupones por cedula | 10/15min |
| `GET` | `/api/premios` | Listar premios de la campanha | - |
| `GET` | `/api/health` | Health check | - |

### Admin (JWT required)

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| `POST` | `/api/admin/login` | Autenticacion → JWT (5/15min rate limit) |
| `PUT` | `/api/admin/cambiar-password` | Cambiar contrasena admin (requiere actual) |
| `GET` | `/api/admin/dashboard/stats` | Estadisticas generales |
| `GET` | `/api/admin/dashboard/chart` | Datos para graficos (diario + mensual) |
| `GET` | `/api/admin/dashboard/top-clientes` | Top 10 clientes por cupones |
| `GET` | `/api/admin/dashboard/mapa` | Distribucion por departamento |
| `GET` | `/api/admin/registros` | Listar registros (filtros: estado, fecha, busqueda) |
| `GET` | `/api/admin/registros/:id` | Detalle de registro + cupones |
| `PUT` | `/api/admin/registros/:id/validar` | Aceptar o rechazar registro |
| `GET` | `/api/admin/participantes` | Listar participantes |
| `GET` | `/api/admin/participantes/:id` | Detalle participante + registros |
| `GET` | `/api/admin/cupones` | Listar todos los cupones |
| `GET` | `/api/uploads/:type/:filename` | Servir imagenes (facturas/productos) |

### Formato de respuesta

Todas las respuestas siguen el formato:
```json
{
  "success": true,
  "message": "Descripcion opcional",
  "data": { ... },
  "pagination": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
}
```

---

## Base de Datos — Oracle 19C

### Tablas (prefijo ALLWAYS_)

| Tabla | Descripcion |
|-------|-------------|
| `ALLWAYS_ADMIN` | Usuarios administradores |
| `ALLWAYS_PARTICIPANTES` | Participantes registrados (UK: CEDULA) |
| `ALLWAYS_REGISTROS` | Registros de facturas (FK → PARTICIPANTES, ADMIN) |
| `ALLWAYS_CUPONES` | Cupones generados (FK → REGISTROS, PARTICIPANTES) |
| `ALLWAYS_PREMIOS` | Premios mensuales de la campanha |
| `ALLWAYS_ADMIN_LOG` | Auditoria de acciones administrativas |

### Columnas clave

- **ESTADO** (ALLWAYS_REGISTROS): `'PENDIENTE'` | `'ACEPTADO'` | `'RECHAZADO'`
- **ACTIVO** (varias tablas): `CHAR(1)` → `'S'` / `'N'`
- **NUMERO_CUPON**: Formato `AW-2026-XXXXXX` (6 digitos aleatorios)
- **IDs**: `NUMBER GENERATED ALWAYS AS IDENTITY` (auto-increment Oracle)

### Conexion

```
Host: 192.168.1.240
Puerto: 1521
Service Name: wint
Usuario: allways
TNS Alias: WINT
```

Oracle Instant Client 19.25 configurado en `/usr/lib/oracle/19.25/client64/`.

---

## Logica de Negocio

### Flujo de Registro (publico)
1. Participante completa formulario + sube foto factura
2. Si cedula ya existe, se vincula al participante existente
3. Se crea registro con estado `PENDIENTE`
4. Imagenes se validan con Sharp (MIME real, max 1920px ancho)
5. Archivos se guardan en `uploads/facturas/` y `uploads/productos/`

### Validacion de Registro (admin)
1. Admin ve factura en detalle ampliado
2. **ACEPTAR** → genera N cupones (1 por producto declarado)
   - Formato cupon: `AW-2026-XXXXXX`
   - Mes sorteo: mes actual en espanol
3. **RECHAZAR** → requiere motivo obligatorio
4. Toda accion se registra en `ALLWAYS_ADMIN_LOG`

### Consulta de Cupones (publico)
- Busqueda por cedula → lista cupones con estado y mes de sorteo
- reCAPTCHA requerido

---

## Configuracion

### Variables de Entorno (backend/.env)

| Variable | Descripcion | Ejemplo |
|----------|-------------|---------|
| `PORT` | Puerto del API | `3001` |
| `NODE_ENV` | Entorno (`production` o `development`) | `production` |
| `ORACLE_USER` | Usuario Oracle | `allways` |
| `ORACLE_PASSWORD` | Password Oracle | `***` |
| `ORACLE_CONNECTION_STRING` | Conexion Oracle | `192.168.1.240:1521/wint` |
| `ORACLE_POOL_MIN` | Pool minimo | `2` |
| `ORACLE_POOL_MAX` | Pool maximo | `10` |
| `JWT_SECRET` | Secret para JWT (64+ chars) | `(auto-generado)` |
| `JWT_EXPIRES_IN` | Expiracion JWT | `8h` |
| `RECAPTCHA_SITE_KEY` | reCAPTCHA v3 site key | `6Lf4l3Ys...` |
| `RECAPTCHA_SECRET_KEY` | reCAPTCHA v3 secret key | `6Lf4l3Ys...` |
| `RECAPTCHA_MIN_SCORE` | Score minimo reCAPTCHA | `0.5` |
| `CORS_ORIGINS` | Origenes permitidos (comma-separated) | `https://www.sanjosesa.com.py,http://192.168.1.225` |
| `UPLOAD_MAX_SIZE` | Tamano maximo upload (bytes) | `5242880` |
| `UPLOAD_DIR` | Directorio de uploads | `./uploads` |
| `ADMIN_USERNAME` | Usuario admin inicial | `admin` |
| `ADMIN_PASSWORD` | Password admin inicial | `***` |

### Nginx

Archivo: `/var/www/html/allways/nginx/allways.conf`
Symlink: `/etc/nginx/sites-enabled/allways.conf`

```
http://192.168.1.225/allways/      → Frontend SPA (dist/)
http://192.168.1.225/allways/api/* → Proxy a Express :3001
```

### Oracle Client

```bash
# /etc/profile.d/oracle.sh
export ORACLE_HOME=/usr/lib/oracle/19.25/client64
export LD_LIBRARY_PATH=$ORACLE_HOME/lib:$LD_LIBRARY_PATH
export PATH=$ORACLE_HOME/bin:$PATH
export TNS_ADMIN=$ORACLE_HOME/lib/network/admin
export NLS_LANG=AMERICAN_AMERICA.AL32UTF8
```

TNS config: `/usr/lib/oracle/19.25/client64/lib/network/admin/tnsnames.ora`

---

## Seguridad

### Protecciones Implementadas

- **reCAPTCHA v3** en todos los endpoints publicos POST
- **Rate limiting** por IP en todos los endpoints (express-rate-limit) con headers IETF draft-7 (`RateLimit`, `RateLimit-Policy`)
- **JWT** con expiracion de 8h para panel admin
- **Helmet** para 11 headers de seguridad HTTP (CSP, HSTS, X-Frame-Options, etc.)
- **CORS** restringido a dominios configurados (retorna 403 para origenes no autorizados)
- **Multer** con validacion MIME + limite 5MB
- **Sharp** valida MIME real de imagenes (no confia en extension)
- **bcrypt** con salt rounds = 12 para passwords admin
- **Bind parameters** en TODAS las queries SQL (prevencion SQL injection)
- **Uploads** servidos via API con autenticacion JWT (no acceso directo)
- **Auditoria** de todas las acciones admin en ALLWAYS_ADMIN_LOG
- **Sanitizacion HTML** server-side en inputs de texto (defense-in-depth)
- **Error handler seguro** — stack traces solo en modo `development` (opt-in), mensajes genericos para errores de parse JSON
- **Endpoint de cambio de contrasena** — permite al admin cambiar su password (requiere la actual)
- **reCAPTCHA bypass bloqueado en produccion** — token de testing solo funciona con `NODE_ENV !== 'production'`
- **Path traversal protection** — triple capa: basename, dot-dot check, resolve bounds
- **Limite de parametros URL** — maximo 20 parametros en requests urlencoded

### Resultado de Pruebas de Seguridad (2026-02-25)

Se ejecutaron **85 pruebas automatizadas** con 4 agentes de IA en paralelo:

| Categoria | Testes | Aprobados | Tasa |
|-----------|--------|-----------|------|
| Registro & Cupones | 20 | 20 | 100% |
| Admin Dashboard & Gestion | 17 | 17 | 100% |
| Rate Limiting | 6 | 6 | 100% |
| Seguridad (SQL injection, XSS, auth bypass, file upload, path traversal, CORS, headers) | 42 | 42 | 100% |
| **Total** | **85** | **85** | **100%** |

**0 vulnerabilidades criticas. 0 vulnerabilidades altas.** Todos los problemas encontrados fueron corregidos en commit `8d887b8`.

---

## Instalacion y Deploy

### Prerrequisitos

- Debian 13+ (o similar Linux x86_64)
- Node.js 20 LTS
- Nginx
- Oracle Instant Client 19.x (thick mode)
- Acceso a Oracle 19C (192.168.1.240:1521/wint)

### 1. Oracle Instant Client

```bash
# Instalar dependencias
apt install -y libaio1t64 alien

# Instalar RPMs convertidos (basic + sqlplus + tools)
# Crear symlink para libaio
ln -sf /lib/x86_64-linux-gnu/libaio.so.1t64 /lib/x86_64-linux-gnu/libaio.so.1

# Configurar variables de entorno en /etc/profile.d/oracle.sh
source /etc/profile.d/oracle.sh
```

### 2. Base de Datos

```bash
cd /var/www/html/allways/database

# Ejecutar scripts en Oracle (via sqlplus o setup.sh)
sqlplus allways/Q1Kpvif9RTs4@WINT @run-all.sql

# O individualmente:
# @01-create-tables.sql
# @02-create-indexes.sql
# @05-seed-prizes.sql
# (Admin se crea automaticamente al primer boot del backend)
```

### 3. Backend

```bash
cd /var/www/html/allways/backend

# Instalar dependencias
npm install

# Configurar .env (copiar ejemplo y ajustar)
# Generar JWT_SECRET:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Crear directorios de upload
mkdir -p uploads/facturas uploads/productos

# Iniciar con PM2
pm2 start server.js --name allways-api
pm2 save
pm2 startup  # Para auto-start en boot
```

### 4. Frontend

```bash
cd /var/www/html/allways/frontend

# Instalar dependencias
npm install

# Build de produccion
npm run build
# Output en dist/
```

### 5. Nginx

```bash
# Symlink de la config
ln -sf /var/www/html/allways/nginx/allways.conf /etc/nginx/sites-enabled/

# Verificar y recargar
nginx -t && nginx -s reload
```

### 6. Verificacion

```bash
# Health check API
curl http://localhost:3001/api/health

# Test login (via Node.js por tema de shell escaping)
node -e "
const http = require('http');
const d = JSON.stringify({username:'admin',password:'Admin2026!'});
const r = http.request({hostname:'localhost',port:3001,path:'/api/admin/login',
  method:'POST',headers:{'Content-Type':'application/json','Content-Length':d.length}},
  res => {let b='';res.on('data',c=>b+=c);res.on('end',()=>console.log(b))});
r.write(d);r.end();"

# Verificar PM2
pm2 status

# Acceso web
# http://192.168.1.225/allways/           → Sitio publico
# http://192.168.1.225/allways/admin      → Panel admin
```

---

## URLs de Acceso

| URL | Descripcion |
|-----|-------------|
| `http://192.168.1.225/allways/` | Landing page publica |
| `http://192.168.1.225/allways/participar` | Formulario de registro |
| `http://192.168.1.225/allways/mis-cupones` | Consulta de cupones |
| `http://192.168.1.225/allways/bases-y-condiciones` | Bases y condiciones |
| `http://192.168.1.225/allways/privacidad` | Politica de privacidad |
| `http://192.168.1.225/allways/aviso-legal` | Aviso legal |
| `http://192.168.1.225/allways/admin` | Login admin |
| `http://192.168.1.225/allways/admin/dashboard` | Dashboard admin |
| `http://192.168.1.225/allways/admin/registros` | Gestion de registros |

---

## Comandos Utiles

```bash
# Ver logs del API en tiempo real
pm2 logs allways-api

# Reiniciar API
pm2 restart allways-api

# Rebuild frontend
cd /var/www/html/allways/frontend && npm run build

# Recargar nginx
nginx -t && nginx -s reload

# Test conexion Oracle
sqlplus allways/Q1Kpvif9RTs4@WINT <<< "SELECT COUNT(*) FROM ALLWAYS_PARTICIPANTES;"

# Limpiar logs PM2
pm2 flush allways-api

# Ver estado PM2
pm2 monit
```

---

## Premios Mensuales

| Mes | Premio | Imagen |
|-----|--------|--------|
| Febrero | Licuadora Personal | licuadora-personal.png |
| Marzo | Air Fryer | air-fryer.png |
| Abril | Patinete Electrico | patinete.png |
| Mayo | Licuadora Oster | licuadora-2.png |
| Junio | Robo Aspirador | robo-aspirador.png |
| Julio | Smart TV 55" | tv.png |
| Agosto | iPhone 16 | iphone.png |
| Septiembre | Scooter Electrico | scooter.png |
| Octubre | Air Fryer | air-fryer.png |
| Noviembre | Moto 0 KM | moto.png |
| **Diciembre** | **Renault Kwid 0 KM** (sorteo final) | kwid.png |

---

## Credenciales por Defecto

| Componente | Usuario | Password |
|-----------|---------|----------|
| Admin Panel | `admin` | `Admin2026!` |
| Oracle DB | `allways` | `Q1Kpvif9RTs4` |

> **Importante:** Cambiar la contrasena del admin despues del primer login usando `PUT /api/admin/cambiar-password` o desde el panel administrativo. Cambiar las credenciales Oracle en produccion.

---

## Notas Tecnicas

- **Oracle column names**: Oracle devuelve nombres de columna en MAYUSCULAS (`ID`, `NOMBRE`, `ESTADO`, etc.). El frontend los referencia asi directamente.
- **Dashboard service**: Convierte manualmente las stats a camelCase (`totalParticipantes`, `registrosHoy`, etc.).
- **reCAPTCHA bypass**: El token de testing `v3_placeholder_token` solo funciona cuando `NODE_ENV !== 'production'`. En produccion se requiere un token real de Google reCAPTCHA v3.
- **NODE_ENV**: Controla comportamiento de seguridad critico:
  - `production`: reCAPTCHA bypass deshabilitado, stack traces ocultos, mensajes de error genericos.
  - `development`: permite bypass reCAPTCHA, muestra stack traces y detalles de error.
- **Rate limit headers**: Formato IETF draft-7 (`RateLimit: limit=30, remaining=29, reset=60` y `RateLimit-Policy: 30;w=60`).
- **Cambio de contrasena**: `PUT /api/admin/cambiar-password` con body `{ passwordActual, passwordNueva }`. Requiere minimo 8 caracteres. Se registra en audit log.
- **Imagenes de premios**: Se sirven como assets estaticos desde `/allways/images/prizes/`. Las imagenes de uploads se sirven via API con autenticacion.
- **TailwindCSS**: Fijado en v3.4.17 (no v4). Tema custom con paleta `allways-*`.
- **React Router**: v7 (importar desde `react-router`, no `react-router-dom`).
- **Sanitizacion HTML**: `stripHtml()` elimina tags HTML de inputs de texto (nombre, ciudad, departamento, numeroFactura) como defensa en profundidad adicional a CSP + React auto-escaping.

---

*Proyecto creado para San Jose Import Export S.A. — Allways Health, Paraguay 2026.*
