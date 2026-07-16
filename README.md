# Allways Show de Premios

Sistema web completo de campanha de sorteio de premios para **San Jose Import Export S.A. + Allways Health** (Paraguay).

Los participantes compran productos Allways, cargan su factura, y reciben cupones para sorteos mensuales (mayo-octubre) con **30 premios** que van desde electrodomesticos hasta un **Fiat Mobi 0 KM** en el sorteo final de noviembre.

---

## Stack Tecnologica

| Capa | Tecnologia | Version |
|------|-----------|---------|
| **Runtime** | Node.js | 20.20.0 |
| **Backend** | Express.js | 4.21.2 |
| **Frontend** | React + Vite | 18.3 / 6.x |
| **CSS** | TailwindCSS | 3.4.17 |
| **Base de datos** | Oracle 19C | Client 19.25 |
| **ORM/Driver** | node-oracledb | 6.7.1 (thick mode) |
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
│   ├── public/
│   │   └── images/
│   │       ├── prizes/         # Imagenes de premios (10 archivos PNG)
│   │       ├── brands/         # Logos de marcas Allways
│   │       ├── logo-allways-blanco.png  # Logo blanco (fondos oscuros)
│   │       └── logo-allways-dark.png    # Logo oscuro (fondos claros)
│   ├── dist/                   # Build de produccion (vite build)
│   └── src/
│       ├── App.jsx             # Router principal
│       ├── main.jsx            # Entry point React
│       ├── index.css           # TailwindCSS + custom styles
│       ├── components/
│       │   ├── layout/         # Header, Footer, AdminLayout
│       │   ├── landing/        # HeroSection, PrizesSection, HowToSection,
│       │   │                   #   BrandsSection, CTASection, FinalDrawSection, GoldParticles
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

### Admin (JWT required, 120 req/min rate limit)

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| `POST` | `/api/admin/login` | Autenticacion → JWT (5/15min rate limit) |
| `PUT` | `/api/admin/cambiar-password` | Cambiar contrasena admin (requiere actual) |
| `GET` | `/api/admin/dashboard/stats` | Estadisticas generales |
| `GET` | `/api/admin/dashboard/chart` | Datos para graficos (diario + mensual) |
| `GET` | `/api/admin/dashboard/top-clientes` | Top 10 clientes por cupones |
| `GET` | `/api/admin/dashboard/mapa` | Distribucion por departamento |
| `GET` | `/api/admin/registros` | Listar registros (filtros: estado, fecha, busqueda, paginacion) |
| `GET` | `/api/admin/registros/:id` | Detalle de registro + cupones + participante |
| `PUT` | `/api/admin/registros/:id/validar` | Aceptar o rechazar registro (solo PENDIENTE) |
| `PUT` | `/api/admin/registros/:id` | Editar datos de factura (solo PENDIENTE) |
| `PUT` | `/api/admin/registros/:id/revertir` | Revertir registro ACEPTADO → RECHAZADO y anular sus cupones |
| `GET` | `/api/admin/participantes` | Listar participantes con totales |
| `GET` | `/api/admin/participantes/:id` | Detalle participante + registros |
| `POST` | `/api/admin/participantes/:id/revocar-sesiones` | Invalida todas las sesiones JWT activas del cliente |
| `GET` | `/api/admin/cupones` | Listar todos los cupones |
| `GET` | `/api/admin/whatsapp/instancia` | Estado de la instancia Evolution + QR almacenado |
| `POST` | `/api/admin/whatsapp/instancia/conectar` | Iniciar/refrescar pareo (genera QR) |
| `POST` | `/api/admin/whatsapp/instancia/desconectar` | Logout del dispositivo vinculado |
| `GET` | `/api/admin/whatsapp/chats` | Listar chats con ultimo mensaje (paginado) |
| `GET` | `/api/admin/whatsapp/chats/:chatId/mensajes` | Listar mensajes del chat |
| `POST` | `/api/admin/whatsapp/chats/:chatId/mensajes` | Enviar mensaje manual al chat |
| `POST` | `/api/admin/whatsapp/chats/:chatId/leido` | Marcar chat como leido (NO_LEIDOS = 0) |
| `GET` | `/api/admin/whatsapp/plantillas` | Listar plantillas de notificacion |
| `PUT` | `/api/admin/whatsapp/plantillas/:codigo` | Actualizar plantilla (texto/nombre/activo) |
| `POST` | `/api/admin/whatsapp/plantillas/:codigo/preview` | Renderizar plantilla con variables `{{x}}` |
| `GET` | `/api/uploads/:type/:filename` | Servir imagenes (facturas/productos) |

### Cliente (area del cliente, JWT separado de admin)

Login: 5 intentos / 15 min por IP. Recuperación: 3 / hora por IP. API autenticada: 60 / min.

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| `POST` | `/api/cliente/login` | CI + password (+ recordarme) → JWT (8h o 30d) |
| `POST` | `/api/cliente/password/recuperar` | Solicita magic-link reset por WhatsApp (anti-enumeration) |
| `POST` | `/api/cliente/password/setup` | Setea password inicial via token enviado tras 1er registro |
| `POST` | `/api/cliente/password/reset` | Setea nueva password via token de recuperación |
| `GET`  | `/api/cliente/me` | Datos completos del participante (auth) |
| `GET`  | `/api/cliente/registros` | Mis registros con tienda/vendedor/estado/cupones (auth) |
| `GET`  | `/api/cliente/cupones` | Mis cupones + premios del mes vigente + totales (auth) |
| `POST` | `/api/cliente/password/cambiar` | Cambio autenticado (actual + nueva) |
| `POST` | `/api/cliente/logout` | Logout (drop client-side, log audit) |
| `POST` | `/api/cliente/logout-everywhere` | Cierra todas las sesiones del cliente en todos los dispositivos |

### WhatsApp Webhook (publico, llamado por Evolution API en localhost)

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| `POST` | `/api/whatsapp/webhook` | Recibe eventos `connection.update`, `qrcode.updated`, `messages.upsert` |
| `POST` | `/api/whatsapp/webhook/*` | Acepta subpath por evento (Evolution v2) |

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

### Rate Limit Headers (IETF draft-7)

Todas las respuestas incluyen headers de rate limit:
```
RateLimit: limit=30, remaining=29, reset=60
RateLimit-Policy: 30;w=60
```
En respuestas 429 (Too Many Requests) se incluye tambien `Retry-After: <seconds>`.

### Ejemplos de Request/Response

**Registrar participante:**
```bash
curl -X POST http://localhost:3001/api/registro \
  -F "nombre=Juan Perez" \
  -F "cedula=4567890" \
  -F "telefono=0981123456" \
  -F "email=juan@test.com" \
  -F "ciudad=Asuncion" \
  -F "departamento=Central" \
  -F "numeroFactura=001-001-0001234" \
  -F "cantidadProductos=3" \
  -F "recaptchaToken=<token>" \
  -F "imagenFactura=@factura.jpg" \
  -F "imagenProductos=@productos.jpg"
# → 201 { success: true, data: { registroId: 1, participanteId: 1 } }
```

**Aceptar registro (genera cupones):**
```bash
curl -X PUT http://localhost:3001/api/admin/registros/1/validar \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{"accion":"ACEPTAR"}'
# → 200 { success: true, data: { estado: "ACEPTADO", cupones: ["AW-2026-435923","AW-2026-590491"] } }
```

**Rechazar registro:**
```bash
curl -X PUT http://localhost:3001/api/admin/registros/2/validar \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{"accion":"RECHAZAR","motivo":"Factura ilegible"}'
# → 200 { success: true, data: { estado: "RECHAZADO", cupones: [] } }
```

**Revertir registro aceptado (anula sus cupones):**
```bash
# Pasa un registro ya ACEPTADO de vuelta a RECHAZADO, elimina los cupones que
# generó (en una transacción) y notifica al participante por WhatsApp.
# `motivo` es obligatorio.
curl -X PUT http://localhost:3001/api/admin/registros/3/revertir \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{"motivo":"Aceptado por error - datos de factura no coinciden"}'
# → 200 { success: true, data: { estado: "RECHAZADO", cuponesAnulados: 2 } }
#
# Errores posibles:
#   400 → falta motivo, o el registro no esta ACEPTADO
#   404 → registro no encontrado
#   409 → algun cupon ya resulto ganador o respalda un premio (no borra nada)
```

**Cambiar contrasena:**
```bash
curl -X PUT http://localhost:3001/api/admin/cambiar-password \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{"passwordActual":"Admin2026!","passwordNueva":"NuevaPassword123!"}'
# → 200 { success: true, message: "Contrasena actualizada exitosamente." }
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
| `ALLWAYS_WA_INSTANCIA` | Estado de la instancia Evolution (1 fila: nombre, estado, QR, ultima conexion) |
| `ALLWAYS_WA_PLANTILLAS` | Plantillas de mensajes (`RECIBIDO`, `ACEPTADO`, `RECHAZADO`) con variables `{{x}}` |
| `ALLWAYS_WA_CHATS` | Chats de WhatsApp (FK opcional → PARTICIPANTES, UK: REMOTE_JID) |
| `ALLWAYS_WA_MENSAJES` | Historial de mensajes IN/OUT (FK → CHATS, REGISTROS, ADMIN) |
| `ALLWAYS_WA_LOG_NOTIF` | Log de notificaciones automaticas (RECIBIDO/ACEPTADO/RECHAZADO) por registro |
| `ALLWAYS_PARTICIPANTE_TOKEN` | Tokens SHA-256 para magic-link (SETUP) y reset password (RESET) |
| `ALLWAYS_CLIENTE_LOG` | Audit trail de logins, recuperaciones y cambios de password del cliente |

`ALLWAYS_REGISTROS` ahora incluye `TIENDA` (obligatorio) y `VENDEDOR` (opcional).
`ALLWAYS_PARTICIPANTES` ahora incluye `PASSWORD_HASH`, `PASSWORD_SET_AT`, `ULTIMO_LOGIN`,
`INTENTOS_FALLIDOS` y `BLOQUEADO_HASTA` (lockout 15 min tras 5 fallos).
UK `(PARTICIPANTE_ID, NUMERO_FACTURA)` impide cargar la misma factura dos veces.

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
1. reCAPTCHA v3 verifica que no es un bot
2. Campos de texto se sanitizan (strip HTML tags)
3. Imagenes se validan con Sharp (MIME real, max 1920px ancho, solo JPG/PNG)
4. El documento se normaliza a la CI (ver "Documento del participante") antes de buscar
5. Si cedula ya existe, se vincula al participante existente
6. Se crea registro con estado `PENDIENTE` (transaccion Oracle)
7. Archivos se guardan en `uploads/facturas/` y `uploads/productos/` con nombre UUID
8. **Notificacion WhatsApp** (fire-and-forget): plantilla `RECIBIDO` al telefono del participante

### Documento del participante (CI / RUC / C. Extranjeria)
El campo acepta tres formatos y los **normaliza a la CI** antes de tocar la base
(`backend/src/utils/cedula.js`, espejado en `frontend/src/utils/validators.js`):

| Formato | Ejemplo | Se guarda como |
|---|---|---|
| CI (5-8 digitos) | `4836971` | `4836971` |
| RUC (CI + digito verificador) | `4836971-3` | `4836971` |
| C. Extranjeria (alfanumerico, min. 1 letra) | `AB123456` | `AB123456` (uppercase) |

Un RUC paraguayo es la CI del titular mas un digito verificador, asi que ambos
colapsan al **mismo participante** y sus cupones se acumulan en un solo registro.
La normalizacion vive en el backend (no solo en el form) porque la API es publica:
aplica en registro, consulta de cupones y login del area de cliente.

**El digito verificador no se guarda: se calcula.** Es un checksum base-11 de la
propia CI, asi que descartarlo no pierde informacion. Para reconstruir el RUC
completo (ej.: acta de entrega de premio) hay `formatRuc()`:

```js
const { formatRuc } = require('./utils/cedula');
formatRuc('4836971');   // '4836971-3'
formatRuc('AB123456');  // null — una C. Extranjeria no tiene RUC
```

`calcDV()` **no se usa para validar**: fue verificado contra un solo RUC real, y
rechazar un documento por DV "incorrecto" reintroduciria el bug que este campo ya
tuvo. Si en algun momento se valida contra un set amplio de RUCs reales, ahi si
puede pasar a rechazar tipeos.

### Validacion de Registro (admin)
1. Admin ve factura en detalle ampliado
2. **ACEPTAR** → genera N cupones (1 por producto declarado)
   - Formato cupon: `AW-2026-XXXXXX`
   - Mes sorteo: mes actual en espanol
   - **Notificacion WhatsApp**: plantilla `ACEPTADO` con la lista de cupones y los premios del mes
3. **RECHAZAR** → requiere motivo obligatorio
   - **Notificacion WhatsApp**: plantilla `RECHAZADO` con el motivo
4. **ACEPTAR/RECHAZAR** solo aplican a registros `PENDIENTE`
5. **REVERTIR** (`PUT /registros/:id/revertir`) → corrige una aceptacion equivocada:
   - Solo sobre registros `ACEPTADO`; pasa el estado a `RECHAZADO` con motivo obligatorio
   - **Elimina** los cupones que el registro genero (en una transaccion). No hay
     columna de anulado: cancelar un cupon = borrar la fila de `ALLWAYS_CUPONES`
   - **Bloqueado (409)** si algun cupon ya resulto ganador (`GANADOR='S'`) o respalda
     un premio (`ALLWAYS_PREMIOS.CUPON_GANADOR_ID`) — en ese caso no borra nada
   - **Notificacion WhatsApp**: misma plantilla `RECHAZADO` con el motivo
6. Toda accion se registra en `ALLWAYS_ADMIN_LOG` (incluye `REVERTIR_REGISTRO`)

### WhatsApp / Notificaciones automaticas (Evolution API + Baileys)

Las notificaciones se envian con [Evolution API v2](https://doc.evolution-api.com) corriendo en `localhost:8080` (PM2: `allways-evolution`). Usa `WHATSAPP-BAILEYS` como integracion → un dispositivo vinculado por QR, sin WhatsApp Business API oficial.

**Vinculacion inicial (una sola vez):**
1. Ir a `/admin/whatsapp` en el panel.
2. Pulsar **Conectar / QR** → backend llama a `GET /instance/connect/<instance>` y persiste el QR en BD (`ALLWAYS_WA_INSTANCIA.QR_CODE`).
3. Abrir WhatsApp en el celular de la campana → **Configuracion → Dispositivos vinculados → Vincular un dispositivo** → escanear (QR caduca a ~60s; el polling cada 3s + el evento `qrcode.updated` traen QR nuevo automaticamente).
4. Cuando llega `connection.update` con `state=open`, el estado pasa a `CONECTADA` y `NUMERO` se popula con el JID propio.

**Eventos manejados (webhook `/api/whatsapp/webhook`):**
- `connection.update` → upsert estado en `ALLWAYS_WA_INSTANCIA`
- `qrcode.updated` → guarda nuevo QR en `ALLWAYS_WA_INSTANCIA.QR_CODE`
- `messages.upsert` → ignora `fromMe` y grupos (`@g.us`); crea/actualiza chat por `REMOTE_JID`, intenta vincular a `ALLWAYS_PARTICIPANTES.TELEFONO`, incrementa `NO_LEIDOS`

**Plantillas:** `ALLWAYS_WA_PLANTILLAS` con codigos `RECIBIDO`, `ACEPTADO`, `RECHAZADO`. Variables soportadas: `{{nombre}}`, `{{numeroFactura}}`, `{{cantidadProductos}}`, `{{cuponesLista}}`, `{{mesActual}}`, `{{premiosMes}}`, `{{motivo}}`. El admin puede editar y previsualizar desde la UI.

**Normalizacion telefono** (`backend/src/utils/phone.js`): elimina no-digitos, soporta prefijo `00`, antepone `595` si falta. JID = `<numero>@s.whatsapp.net`.

**Auditoria:** cada intento de notificacion automatica deja una fila en `ALLWAYS_WA_LOG_NOTIF` con `EXITOSO=S/N` y `ERROR_DETALLE` (response cruda de Evolution truncada a 1900 chars). Las fallas NUNCA abortan el flujo de registro/validacion (try/catch fire-and-forget).

### Area del Cliente (login propio + PWA)

Cada participante tiene login propio con CI + password. Endpoints en `/api/cliente/*`, JWT separado del admin (`JWT_SECRET_CLIENTE`).

**Onboarding (magic link):** cuando se crea un participante nuevo via registro publico, `registrationService` dispara `notifySetupPassword` con un token SETUP de 24 h. El cliente recibe por WhatsApp:

> Hola {{nombre}}, ya recibimos tu primer registro. Crea tu contraseña aquí: {{link}}

El link apunta a `/cliente/setup-password?t=<token>` donde el cliente define email + password. El token se almacena hasheado (SHA-256) y se invalida tras uso.

**Recuperación de contraseña por WhatsApp:**
1. Cliente entra a `/cliente/recuperar` y manda CI.
2. Backend responde 200 genérico (anti-enumeration). Si la CI existe, genera token RESET (30 min) y manda link por WhatsApp.
3. Cliente abre link → setea nueva password → backend invalida los demás tokens activos del usuario.
4. Notificación automática `PASSWORD_CAMBIADA` confirma el cambio (defensa en profundidad).

**Lockout:** 5 intentos fallidos → `BLOQUEADO_HASTA = now + 15 min`. Login devuelve 423 con `Retry-After`.

**PWA:** `vite-plugin-pwa` genera service worker (NetworkFirst para `/api/*`, CacheFirst para imágenes). El manifest apunta a `/cliente/login` como `start_url`. Banner de instalación se muestra en el área autenticada.

**Datos en el dashboard:**
- Mis cupones (con tienda, mes de sorteo, badge ganador)
- Premios del mes vigente
- Mis registros (todas las facturas con estado, tienda, vendedor)
- Mis datos personales (read-only, contacto soporte para modificar)

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
| `EVOLUTION_API_URL` | URL de Evolution API (Baileys) | `http://localhost:8080` |
| `EVOLUTION_API_KEY` | API key global de Evolution | `***` |
| `EVOLUTION_INSTANCE_NAME` | Nombre de la instancia | `allways-campana` |
| `EVOLUTION_DEFAULT_COUNTRY_CODE` | Codigo de pais para normalizacion | `595` |
| `JWT_SECRET_CLIENTE` | Secret separado para JWTs del area del cliente (64+ chars) | `(auto-generado)` |
| `CLIENTE_JWT_EXPIRES_SHORT` | Duración de sesión sin "recordarme" | `8h` |
| `CLIENTE_JWT_EXPIRES_LONG` | Duración de sesión con "recordarme" | `30d` |
| `CLIENTE_SETUP_TOKEN_MIN` | Validez del magic-link inicial en minutos | `1440` (24 h) |
| `CLIENTE_RESET_TOKEN_MIN` | Validez del token de reset en minutos | `30` |
| `PUBLIC_BASE_URL` | URL base usada en los magic-links de WhatsApp | `https://www.sanjosesa.com.py/allways` |

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

# Purgar logs de auditoria viejos (default 12 meses)
node /var/www/html/allways/scripts/purge-old-logs.js --dry-run    # ver qué borraría
node /var/www/html/allways/scripts/purge-old-logs.js              # ejecutar
node /var/www/html/allways/scripts/purge-old-logs.js --months=6   # retencion personalizada
```

### Retencion de logs de auditoria

Las tablas `ALLWAYS_ADMIN_LOG`, `ALLWAYS_CLIENTE_LOG` y `ALLWAYS_WA_LOG_NOTIF` crecen indefinidamente. Recomendamos correr `scripts/purge-old-logs.js` semanalmente vía cron (12 meses de retención por defecto):

```cron
0 4 * * 0  /usr/bin/node /var/www/html/allways/scripts/purge-old-logs.js >> /var/log/allways-purge.log 2>&1
```

### Backups

| Archivo | Función |
|---|---|
| `scripts/backup-daily.js` | Dump Oracle (logical SQL) + uploads tar + Evolution Postgres + Redis RDB |
| `scripts/verify-backup.js` | Verificación: gunzip + cuenta INSERTs por tabla vs manifest |

**Variables `.env`:**
| Variable | Default | Uso |
|---|---|---|
| `BACKUP_RETENTION_DAYS` | `30` | Días de retención local (y por extensión, off-site) |
| `RSYNC_TARGET` | — | Destino off-site (`user@host:/path`). Sin valor = no off-site |
| `RSYNC_SSH_OPTS` | — | Opciones SSH (ej: `-p 2809` para puerto custom) |
| `RSYNC_OPTS` | `-az --delete-after` | Flags de rsync |
| `BACKUP_ALERT_PHONE` | — | Teléfono para alerts WhatsApp cuando backup/verify falla |

**Cron recomendado:**
```cron
# Backup diario 03:00 (local + off-site)
0 3 * * *      /usr/bin/node /var/www/html/allways/scripts/backup-daily.js >> /var/log/allways-backup.log 2>&1
# Verificación: primer domingo de cada mes, 04:00
0 4 1-7 * 0    /usr/bin/node /var/www/html/allways/scripts/verify-backup.js --latest >> /var/log/allways-verify.log 2>&1
```

**Alerting:** si cualquier artefacto del backup falla, o si `verify-backup.js` detecta un mismatch, se envía un WhatsApp al `BACKUP_ALERT_PHONE` vía la misma instancia Evolution que usan las notificaciones del cliente. Si Evolution está caído, el error queda en `/var/log/allways-backup.log` (no se pierde, solo no llega push).

---

## Premios Mensuales (30 premios — Mayo a Noviembre 2026)

> Vigencia: 1 de mayo a 30 de noviembre de 2026. Sorteo final: lunes 30 de noviembre de 2026.
> Los sorteos mensuales se realizan en lunes segun el calendario publicado.

| Mes | Fecha | Cant. | Premios |
|-----|-------|-------|---------|
| **Mayo** | Lun 25/05 | 4 | TV Smart Audisat 50", Licuadora XION 600ml, Licuadora XION 380ml, Cupon de Compra 500.000Gs |
| **Junio** | Lun 29/06 | 5 | TV Smart Audisat 50", Air Fryer XION 5L, Licuadora XION 600ml, Licuadora XION 380ml, Cupon de Compra 500.000Gs |
| **Julio** | Lun 27/07 | 5 | TV Smart Audisat 50", Aspiradora Robot XION, Licuadora XION 600ml, Licuadora XION 380ml, Cupon de Compra 500.000Gs |
| **Agosto** | Lun 31/08 | 5 | Motoneta Kenton Viva 110, Air Fryer XION 5L, Licuadora XION 600ml, 2x Cupon de Compra 500.000Gs |
| **Septiembre** | Lun 28/09 | 5 | iPhone 16 128GB, Air Fryer XION 5L, Scooter Electrico HYE, Patineta Electrica, Cupon de Compra 500.000Gs |
| **Octubre** | Lun 26/10 | 5 | Motoneta Kenton Viva 110, iPhone 16 128GB, Aspiradora Robot XION, Licuadora XION 380ml, Cupon de Compra 500.000Gs |
| **Noviembre** | Lun 30/11 | 1 | **Fiat Mobi 0km** (sorteo final — todos los cupones acumulados participan) |

---

## Credenciales por Defecto

| Componente | Usuario | Password | Rol |
|-----------|---------|----------|-----|
| Admin Panel | `admin` | `Admin2026!` | ADMIN |
| Admin Panel | `marketing@sanjosesa.com.py` | `Mkt@2809` | ADMIN (marketing) |
| Admin Panel | `mkt.redessociales2@sanjosesa.com.py` | `Mkt09@75` | ADMIN (redes sociales) |
| Oracle DB | `allways` | `Q1Kpvif9RTs4` | — |

> Las cuentas marketing se aprovisionan automaticamente en cada boot del backend via `seedAdmin()` (idempotente: si ya existen, no hace nada).

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

## Dependencias Principales

### Backend (package.json)

| Paquete | Version | Uso |
|---------|---------|-----|
| express | ^4.21.2 | Framework HTTP |
| oracledb | ^6.7.1 | Driver Oracle (thick mode) |
| jsonwebtoken | ^9.0.2 | JWT auth |
| bcryptjs | ^2.4.3 | Hash de passwords |
| helmet | ^8.0.0 | Headers de seguridad HTTP |
| cors | ^2.8.5 | Cross-Origin Resource Sharing |
| multer | ^1.4.5-lts.1 | Upload de archivos multipart |
| sharp | ^0.33.5 | Validacion y procesamiento de imagenes |
| express-rate-limit | ^7.5.0 | Rate limiting por IP |
| dotenv | ^16.4.7 | Variables de entorno |
| uuid | ^11.0.5 | Nombres unicos para uploads |
| axios | ^1.7.9 | HTTP client (reCAPTCHA verify) |

### Frontend (package.json)

| Paquete | Version | Uso |
|---------|---------|-----|
| react | ^18.3.0 | UI framework |
| react-router | ^7.0.0 | Routing SPA |
| axios | ^1.7.0 | HTTP client API |
| recharts | ^2.12.0 | Graficos dashboard |
| framer-motion | ^11.0.0 | Animaciones |
| lucide-react | ^0.400.0 | Iconos |
| react-toastify | ^10.0.0 | Notificaciones toast |
| react-dropzone | ^14.2.0 | Drag & drop de imagenes |
| tailwindcss | 3.4.17 | CSS utility-first |
| vite | ^6.0.0 | Bundler + dev server |

---

## Changelog

### v1.5.0 — 2026-06-09 (Revertir registros aceptados)

- **FEAT** Nuevo `PUT /api/admin/registros/:id/revertir`: pasa un registro `ACEPTADO`
  a `RECHAZADO` y anula (elimina) los cupones que genero, en una transaccion, con
  motivo obligatorio y notificacion WhatsApp `RECHAZADO`
- **FEAT** Guard de seguridad: bloquea (409) la reversion si algun cupon ya resulto
  ganador o respalda un premio
- **FEAT** Panel: boton "Rechazar y anular cupones" en el detalle de un registro aceptado
- Antes solo se podian rechazar registros `PENDIENTE`; corregir una aceptacion
  equivocada requeria intervencion manual en la base de datos

### v1.4.0 — 2026-04-16 (Campaign Shift + Marketing Admins)

- **CHANGE** Campana desplazada de Abril-Octubre a **Mayo-Noviembre** (7 sorteos mensuales)
- **CHANGE** Fechas fijas de sorteo (lunes): 25/05, 29/06, 27/07, 31/08, 28/09, 26/10, 30/11
- **CHANGE** Premio final: **Fiat Mobi 0km** (reemplaza Renault Kwid); imagen en `/images/prizes/mobi.png`
- **NEW** Script de migracion `database/06-migration-shift-months.sql` (limpia sorteo, remapea MES_SORTEO, re-seed)
- **NEW** Dos cuentas administrativas de marketing con email como username (provisionadas en boot)
- **NEW** Fechas de sorteo visibles en `PrizesSection` y calendario detallado en `RulesPage`
- **UX** Empty state de `CouponCheckPage` rescrito: "Facturas en Analisis" con orientacion dual (aguardando validacion / no registrado)
- **UPDATE** `seedAdmin()` ahora garante idempotentemente la existencia de las cuentas de marketing, ademas del admin principal

### v1.3.0 — 2026-04-15 (Admin Sorteos + Participantes)

- **NEW** Sistema de sorteo mensual admin (`/admin/sorteos`): resumen, detalle por mes, ejecutar y resetear
- **NEW** Seleccion aleatoria de cupon ganador via `DBMS_RANDOM.VALUE` entre cupones elegibles (ACEPTADO + no ganadores)
- **NEW** Pagina admin Clientes (lista + detalle) con JOINs a tablas geo (departamento/distrito/ciudad/barrio)
- **NEW** Mapa de Google Maps embebido en detalle de registro (`ClientDetailPage`)
- **NEW** Co-branding: logo San Jose junto al Allways Health en Header, Footer y Hero
- **UPDATE** CSP frame-ancestors amplia dominios `allways.com.py` (helmet + nginx)

### v1.2.0 — 2026-02-26 (Prize Structure Update)

- **CHANGE** Campana ahora va de Abril a Octubre (antes Abril-Diciembre)
- **CHANGE** Sorteo final Kwid en Octubre (antes Diciembre)
- **CHANGE** TV 50" se sortea en Abril/Mayo/Junio (antes de Copa del Mundo julio 2026)
- **NEW** 30 premios mensuales (antes 10): incluye Patineta Electrica, Cupon de Compra 500.000Gs
- **UPDATE** Base de datos ALLWAYS_PREMIOS con 30 registros
- **UPDATE** Frontend PrizesSection, FinalDrawSection, RulesPage actualizados
- **UPDATE** SQL seed 05-seed-prizes.sql reescrito

### v1.1.0 — 2026-02-25 (Security Hardening)

Resultado de pruebas automatizadas con 4 agentes de IA (85 tests, 100% aprobados):

- **FIX** reCAPTCHA bypass token bloqueado en produccion (`NODE_ENV=production`)
- **FIX** Stack traces solo visibles en `NODE_ENV=development` (opt-in)
- **FIX** Mensajes genericos para errores de JSON parse
- **FIX** CORS rejection retorna 403 (antes 500)
- **FIX** Health endpoint ya no expone `environment`
- **NEW** `PUT /api/admin/cambiar-password` — cambio de contrasena admin
- **NEW** Headers de rate limit IETF draft-7 (`RateLimit`, `RateLimit-Policy`)
- **NEW** Sanitizacion HTML server-side (`stripHtml()`) en inputs de texto
- **NEW** Limite de parametros URL (max 20)

### v1.0.0 — 2026-02-25 (Initial Release)

- Sistema completo: registro, validacion, cupones, dashboard
- Frontend React SPA con TailwindCSS
- Backend Express + Oracle 19C
- Panel admin con JWT auth
- reCAPTCHA v3 + rate limiting + Helmet

---

*Proyecto creado para San Jose Import Export S.A. — Allways Health, Paraguay 2026.*
