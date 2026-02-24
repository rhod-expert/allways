# 🎯 Projeto: Allways Show de Premios — Site Completo de Sorteio

## Visão Geral

Criar um site completo de campanha de sorteio de prêmios para **San José Import Export S.A. + Allways Health**, em **espanhol**, com landing page, formulário de registro, upload de imagens, consulta de cupons, painel administrativo com dashboard, e backend integrado a Oracle 19C.

O site será hospedado em um VPS Linux em `/var/www/html/allways/`.

---

## 1. STACK TECNOLÓGICA

### Frontend
- **React 18+** com **Vite**
- **TailwindCSS 3** (custom theme com paleta da marca)
- **React Router v6** (SPA com rotas)
- **Recharts** (gráficos do dashboard)
- **React Google Maps** ou **@vis.gl/react-google-maps** (mapa de clientes)
- **react-google-recaptcha-v3** (reCAPTCHA v3)
- **axios** (HTTP client)
- **react-dropzone** (upload de imagens)
- **react-toastify** (notificações)
- **lucide-react** (ícones)
- **framer-motion** (animações suaves)

### Backend
- **Node.js 20+** com **Express**
- **oracledb** (Oracle DB thick/thin client)
- **multer** (upload de arquivos)
- **jsonwebtoken + bcryptjs** (autenticação admin)
- **express-rate-limit** (rate limiting)
- **helmet** (segurança headers)
- **cors** (configurável via .env)
- **dotenv** (variáveis de ambiente)
- **sharp** (redimensionar/comprimir imagens de upload)
- **uuid** (geração de IDs únicos)

---

## 2. PALETA DE CORES (extraída do material oficial)

Configurar no `tailwind.config.js`:

```js
colors: {
  allways: {
    dark: '#0A1628',      // Background principal (azul escuro/navy profundo)
    navy: '#1A3A5C',      // Gradientes, seções alternadas
    blue: '#2563EB',      // Links, elementos interativos
    cyan: '#4DB8FF',      // Destaques, brilhos, acentos luminosos
    gold: '#D4A843',      // Botões CTA, badges, títulos destaque
    'gold-light': '#F0D78C', // Hover em botões gold
    green: '#2D7A3A',     // Botão secundário, badges de sucesso
    'gray-light': '#E8EDF2', // Background seções claras (formulário)
    white: '#FFFFFF',     // Texto principal sobre fundo escuro
  }
}
```

**Design visual de referência:**
- Background com gradiente radial azul escuro → navy, com partículas/brilhos dourados sutis (CSS puro, sem lib pesada)
- Botões CTA com gradiente dourado, border-radius arredondado, sombra suave
- Cards de prêmios com glassmorphism sutil (backdrop-blur + borda semi-transparente)
- Tipografia: fonte sans-serif moderna (Inter ou Montserrat via Google Fonts)
- Títulos grandes em branco bold, palavras-chave em dourado
- Estilo premium/luxuoso mas clean

---

## 3. ESTRUTURA DO PROJETO

```
/var/www/html/allways/
├── frontend/                  # React + Vite
│   ├── public/
│   │   ├── images/
│   │   │   ├── prizes/        # Imagens dos prêmios (copiar manualmente)
│   │   │   ├── brands/        # Logos das marcas parceiras
│   │   │   └── logo-allways.png
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/        # Header, Footer, Navbar
│   │   │   ├── landing/       # Hero, HowToParticipate, PrizeCards, PrizeTimeline, BrandsBar
│   │   │   ├── form/          # RegistrationForm, ImageUpload, ReCaptcha
│   │   │   ├── coupon/        # CouponLookup, CouponCard
│   │   │   ├── admin/         # Dashboard, ClientTable, ClientDetail, ValidationPanel
│   │   │   ├── charts/        # RegistrationChart, CouponChart, TopClients, MapView
│   │   │   └── ui/            # Button, Card, Input, Modal, Spinner, Badge
│   │   ├── pages/
│   │   │   ├── HomePage.jsx          # Landing page completa
│   │   │   ├── RegisterPage.jsx      # Formulário de registro
│   │   │   ├── RulesPage.jsx         # Bases y condiciones
│   │   │   ├── PrivacyPage.jsx       # Política de privacidad
│   │   │   ├── LegalNoticePage.jsx   # Aviso legal
│   │   │   ├── CouponCheckPage.jsx   # Consulta de cupons
│   │   │   ├── LoginPage.jsx         # Login admin
│   │   │   ├── DashboardPage.jsx     # Dashboard admin
│   │   │   ├── ClientsPage.jsx       # Lista de clientes/registros
│   │   │   ├── ClientDetailPage.jsx  # Detalle + validação
│   │   │   └── NotFoundPage.jsx      # 404
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   └── useApi.js
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── services/
│   │   │   └── api.js          # Axios instance com baseURL
│   │   ├── utils/
│   │   │   └── validators.js   # Validação de cédula, teléfono, etc.
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css           # TailwindCSS imports + custom styles
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── backend/                   # Node.js + Express
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js     # Oracle connection pool
│   │   │   └── env.js          # dotenv loader + validation
│   │   ├── middleware/
│   │   │   ├── auth.js         # JWT verification
│   │   │   ├── rateLimiter.js  # Rate limiting configs
│   │   │   ├── recaptcha.js    # reCAPTCHA v3 verification
│   │   │   ├── upload.js       # Multer config
│   │   │   └── errorHandler.js # Global error handler
│   │   ├── routes/
│   │   │   ├── public.js       # Registro, consulta cupons
│   │   │   ├── admin.js        # Login, dashboard, validação
│   │   │   └── uploads.js      # Servir imagens (com auth para admin)
│   │   ├── controllers/
│   │   │   ├── registrationController.js
│   │   │   ├── couponController.js
│   │   │   ├── authController.js
│   │   │   ├── adminController.js
│   │   │   └── dashboardController.js
│   │   ├── services/
│   │   │   ├── registrationService.js
│   │   │   ├── couponService.js
│   │   │   ├── dashboardService.js
│   │   │   └── recaptchaService.js
│   │   ├── models/
│   │   │   └── queries.js      # SQL queries centralizadas
│   │   └── app.js              # Express app setup
│   ├── uploads/                # Diretório de uploads (facturas + productos)
│   │   ├── facturas/
│   │   └── productos/
│   ├── .env                    # Variáveis de ambiente
│   ├── server.js               # Entry point
│   └── package.json
│
├── database/                  # Scripts SQL
│   ├── 01-create-tables.sql
│   ├── 02-create-indexes.sql
│   ├── 03-create-sequences.sql
│   ├── 04-seed-admin.sql
│   └── 05-seed-prizes.sql
│
├── nginx/                     # Config do nginx
│   └── allways.conf
│
└── README.md
```

---

## 4. BASE DE DADOS — Oracle 19C

### Tabelas

```sql
-- Participantes
CREATE TABLE ALLWAYS_PARTICIPANTES (
    ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    NOMBRE VARCHAR2(200) NOT NULL,
    CEDULA VARCHAR2(20) NOT NULL,
    TELEFONO VARCHAR2(20) NOT NULL,
    EMAIL VARCHAR2(200),
    CIUDAD VARCHAR2(100),
    DEPARTAMENTO VARCHAR2(100),
    LATITUD NUMBER(10,7),
    LONGITUD NUMBER(10,7),
    FECHA_REGISTRO TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ACTIVO CHAR(1) DEFAULT 'S',
    CONSTRAINT UK_CEDULA UNIQUE (CEDULA)
);

-- Registros (cada factura subida)
CREATE TABLE ALLWAYS_REGISTROS (
    ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    PARTICIPANTE_ID NUMBER NOT NULL,
    NUMERO_FACTURA VARCHAR2(50) NOT NULL,
    CANTIDAD_PRODUCTOS NUMBER NOT NULL,
    IMAGEN_FACTURA VARCHAR2(500) NOT NULL,
    IMAGEN_PRODUCTOS VARCHAR2(500),
    ESTADO VARCHAR2(20) DEFAULT 'PENDIENTE', -- PENDIENTE, ACEPTADO, RECHAZADO
    MOTIVO_RECHAZO VARCHAR2(500),
    VALIDADO_POR NUMBER,
    FECHA_VALIDACION TIMESTAMP,
    FECHA_REGISTRO TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    IP_REGISTRO VARCHAR2(45),
    CONSTRAINT FK_REG_PART FOREIGN KEY (PARTICIPANTE_ID) REFERENCES ALLWAYS_PARTICIPANTES(ID),
    CONSTRAINT FK_REG_ADMIN FOREIGN KEY (VALIDADO_POR) REFERENCES ALLWAYS_ADMIN(ID),
    CONSTRAINT CK_ESTADO CHECK (ESTADO IN ('PENDIENTE','ACEPTADO','RECHAZADO'))
);

-- Cupones (generados al aceptar un registro)
CREATE TABLE ALLWAYS_CUPONES (
    ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    REGISTRO_ID NUMBER NOT NULL,
    PARTICIPANTE_ID NUMBER NOT NULL,
    NUMERO_CUPON VARCHAR2(20) NOT NULL UNIQUE,
    MES_SORTEO VARCHAR2(20),
    GANADOR CHAR(1) DEFAULT 'N',
    FECHA_GENERACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_CUP_REG FOREIGN KEY (REGISTRO_ID) REFERENCES ALLWAYS_REGISTROS(ID),
    CONSTRAINT FK_CUP_PART FOREIGN KEY (PARTICIPANTE_ID) REFERENCES ALLWAYS_PARTICIPANTES(ID)
);

-- Premios
CREATE TABLE ALLWAYS_PREMIOS (
    ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    MES VARCHAR2(20) NOT NULL,
    DESCRIPCION VARCHAR2(200) NOT NULL,
    IMAGEN VARCHAR2(500),
    CUPON_GANADOR_ID NUMBER,
    FECHA_SORTEO DATE,
    ACTIVO CHAR(1) DEFAULT 'S',
    CONSTRAINT FK_PREMIO_CUPON FOREIGN KEY (CUPON_GANADOR_ID) REFERENCES ALLWAYS_CUPONES(ID)
);

-- Administradores
CREATE TABLE ALLWAYS_ADMIN (
    ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    USERNAME VARCHAR2(50) NOT NULL UNIQUE,
    PASSWORD_HASH VARCHAR2(200) NOT NULL,
    NOMBRE VARCHAR2(200),
    ROL VARCHAR2(20) DEFAULT 'ADMIN',
    ACTIVO CHAR(1) DEFAULT 'S',
    FECHA_CREACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ULTIMO_LOGIN TIMESTAMP
);

-- Log de accesos admin
CREATE TABLE ALLWAYS_ADMIN_LOG (
    ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ADMIN_ID NUMBER,
    ACCION VARCHAR2(100),
    DETALLE VARCHAR2(500),
    IP VARCHAR2(45),
    FECHA TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_LOG_ADMIN FOREIGN KEY (ADMIN_ID) REFERENCES ALLWAYS_ADMIN(ID)
);
```

### Índices
```sql
CREATE INDEX IDX_REG_PARTICIPANTE ON ALLWAYS_REGISTROS(PARTICIPANTE_ID);
CREATE INDEX IDX_REG_ESTADO ON ALLWAYS_REGISTROS(ESTADO);
CREATE INDEX IDX_REG_FECHA ON ALLWAYS_REGISTROS(FECHA_REGISTRO);
CREATE INDEX IDX_CUP_PARTICIPANTE ON ALLWAYS_CUPONES(PARTICIPANTE_ID);
CREATE INDEX IDX_CUP_NUMERO ON ALLWAYS_CUPONES(NUMERO_CUPON);
CREATE INDEX IDX_PART_CEDULA ON ALLWAYS_PARTICIPANTES(CEDULA);
```

### Seed Admin
```sql
-- Password: Admin2026! (bcrypt hash gerado pelo backend no primeiro deploy)
INSERT INTO ALLWAYS_ADMIN (USERNAME, PASSWORD_HASH, NOMBRE, ROL)
VALUES ('admin', '$2b$10$PLACEHOLDER', 'Administrador', 'SUPERADMIN');
```

### Seed Premios
```sql
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN) VALUES ('ABRIL', 'Licuadora Personal XION 600ml', '/images/prizes/licuadora-personal.png');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN) VALUES ('ABRIL', 'Licuadora Personal XION 380ml', '/images/prizes/licuadora-2.png');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN) VALUES ('MAYO', 'Freidora Air Fryer XION 5L', '/images/prizes/air-fryer.png');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN) VALUES ('JUNIO', 'Aspiradora Robot XION', '/images/prizes/robo-aspirador.png');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN) VALUES ('JULIO', 'TV Smart Audisat 50"', '/images/prizes/tv.png');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN) VALUES ('AGOSTO', 'Motoneta Kenton Viva 110', '/images/prizes/moto.png');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN) VALUES ('SEPTIEMBRE', 'Scooter Eléctrico HYE HY-SC8.5', '/images/prizes/scooter.png');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN) VALUES ('OCTUBRE', 'iPhone 16 128GB', '/images/prizes/iphone.png');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN) VALUES ('NOVIEMBRE', 'Renault Kwid 0km', '/images/prizes/kwid.png');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN) VALUES ('DICIEMBRE', 'Renault Kwid 0km (Sorteo Final)', '/images/prizes/kwid.png');
COMMIT;
```

---

## 5. BACKEND — API Endpoints

### Públicos (com reCAPTCHA + rate limit)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/registro` | Registrar participante + factura + imagens |
| POST | `/api/cupones/consulta` | Consultar cupons por cédula (com reCAPTCHA) |
| GET | `/api/premios` | Listar prêmios da campanha |
| GET | `/api/reglas` | Retornar bases y condiciones (texto) |

### Admin (JWT required)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/admin/login` | Login admin → JWT |
| GET | `/api/admin/registros` | Listar registros (filtros: estado, fecha, busca) |
| GET | `/api/admin/registros/:id` | Detalle de registro + imagens |
| PUT | `/api/admin/registros/:id/validar` | Aceptar/Rechazar registro |
| GET | `/api/admin/dashboard/stats` | Stats gerais (totais, dia, semana, mês) |
| GET | `/api/admin/dashboard/chart` | Dados para gráficos (registros por período) |
| GET | `/api/admin/dashboard/top-clientes` | Top 10 clientes por cupons |
| GET | `/api/admin/dashboard/mapa` | Dados de geolocalização dos clientes |
| GET | `/api/admin/participantes` | Listar participantes |
| GET | `/api/admin/participantes/:id` | Detalle participante + seus registros |
| GET | `/api/admin/cupones` | Listar todos os cupons |

### Rate Limiting
- `/api/registro`: 5 requests por IP a cada 15 minutos
- `/api/cupones/consulta`: 10 requests por IP a cada 15 minutos
- `/api/admin/*`: 30 requests por IP por minuto
- `/api/admin/login`: 5 tentativas por IP a cada 15 minutos

---

## 6. FRONTEND — Páginas e Componentes

### Landing Page (HomePage)
Seções na ordem:
1. **Hero** — "COMPRÁ. CARGÁ TU FACTURA. GANÁ." + Logo Allways Health + botão CTA dourado "CARGAR FACTURA" + background gradiente azul escuro com partículas douradas
2. **¿Cómo participar?** — 3 passos com ícones: Comprá → Cargá → Sumá cupones
3. **Premios** — Timeline/carousel dos prêmios por mês com cards (imagem + mês + descrição). Cards com efeito glassmorphism
4. **Sorteo Final** — Destaque especial para o Renault Kwid com animação sutil
5. **Formulário rápido** — CTA para ir à página de registro
6. **Marcas participantes** — Logos: Empalux, Scotch-Brite, Wyda, Allways, Allways Health, Guapo, Trento
7. **Footer** — Links legales, "Somos San José Import Export S.A.", copyright

### Página de Registro (RegisterPage)
- Formulário com validação client-side:
  - **Nombre completo** (min 3 chars)
  - **Cédula de Identidad** (numérico, formato paraguayo)
  - **Teléfono** (formato +595...)
  - **Email** (opcional)
  - **Ciudad / Departamento** (select com departamentos do Paraguay)
  - **Número de factura** (alfanumérico)
  - **Cantidad de productos Allways** (numérico, min 1)
  - **Foto de la factura** (upload, max 5MB, jpg/png)
  - **Foto de los productos** (upload, max 5MB, jpg/png, opcional)
- reCAPTCHA v3 invisible antes do submit
- Preview das imagens antes de enviar
- Confirmação com número de cupón gerado após validação
- Se o participante já existe (mesma cédula), vincular novo registro ao existente

### Página de Consulta de Cupones (CouponCheckPage)
- Input: Cédula de Identidad
- reCAPTCHA v3 antes da consulta
- Resultado: lista de cupons com número, data, estado (pendiente/aceptado/rechazado), mês do sorteo
- Mostrar total de cupons válidos

### Páginas Legales
- **Bases y Condiciones** — conteúdo estático (texto completo abaixo)
- **Política de Privacidad** — conteúdo estático
- **Aviso Legal** — conteúdo estático

### Login Admin (LoginPage)
- Formulário: usuario + contraseña
- Rate limited
- Redireciona ao dashboard

### Dashboard Admin (DashboardPage)
- **Cards de stats**: Total participantes, Registros hoje, Registros semana, Registros mês, Total cupons, Pendientes de validación
- **Gráfico de linha**: Registros por dia (últimos 30 dias)
- **Gráfico de barras**: Registros por mês
- **Top 10 Clientes**: Tabela com nome, cédula, total cupons
- **Mapa de calor**: Google Maps mostrando regiões dos clientes (agrupar por departamento/ciudad)

### Gestión de Registros (ClientsPage)
- Tabela paginada com: ID, Nombre, Cédula, Factura, Cantidad, Estado, Fecha
- Filtros: estado (PENDIENTE/ACEPTADO/RECHAZADO), busca por nombre/cédula, rango de fechas
- Click para ver detalle

### Detalle de Registro (ClientDetailPage)
- Dados do participante
- Dados do registro (factura, quantidade)
- **Imagen da factura** (visualização ampliada, zoom)
- **Imagen dos produtos** (se houver)
- Botões: **ACEPTAR** (verde) / **RECHAZAR** (vermelho + campo motivo)
- Ao aceitar: gerar cupons (1 por produto) automaticamente
- Histórico de outros registros do mesmo participante

---

## 7. TEXTOS LEGALES (incluir como conteúdo estático)

### Bases y Condiciones
```
BASES Y CONDICIONES – PROMOCIÓN ALLWAYS 2026

1. ORGANIZADOR
La promoción es organizada por San José Import Export S.A y Allways Health, con matriz en Ciudad del Este, Paraguay.

2. VIGENCIA
Desde 1 de marzo de 2026 hasta 30 de noviembre de 2026.
Sorteo final: diciembre 2026.

3. PARTICIPANTES
Podrán participar personas físicas mayores de 18 años residentes en Paraguay.
No participan: empleados de las empresas organizadoras, agencias vinculadas, familiares directos.

4. MECÁNICA
Por cada producto ALLWAYS Health adquirido durante la vigencia: 1 producto = 1 cupón.
El participante deberá:
1. Comprar productos ALLWAYS.
2. Registrar la factura en la landing oficial.
3. Subir foto legible de la factura.
4. Indicar cantidad de productos.
Las facturas podrán cargarse múltiples veces si corresponden a compras distintas.
Facturas duplicadas o adulteradas serán anuladas.

5. PREMIOS
Sorteos mensuales:
- Abril: Licuadora Personal XION 600ml + Licuadora Personal XION 380ml
- Mayo: Freidora Air Fryer XION 5L
- Junio: Aspiradora Robot XION
- Julio: TV Smart Audisat 50"
- Agosto: Motoneta Kenton Viva 110
- Septiembre: Scooter eléctrico HYE HY-SC8.5
- Octubre: iPhone 16 128GB
- Noviembre: Renault Kwid
Sorteo final: Auto 0 km (Renault Kwid). Todos los cupones acumulados participan.

6. SORTEOS
Los sorteos se realizarán mediante sistema aleatorio certificado en presencia de escribano o autoridad competente.
Ganadores serán publicados en redes oficiales.

7. ENTREGA DE PREMIOS
El ganador será contactado vía teléfono/email.
Si no responde en 7 días, se elegirá suplente.
Impuestos, matriculación o gastos adicionales serán responsabilidad del ganador salvo aclaración contraria.

8. RESPONSABILIDAD
La empresa no se responsabiliza por: fallas de internet, errores de carga del usuario, facturas ilegibles.

9. ACEPTACIÓN
Participar implica aceptar todas las bases.
```

### Política de Privacidad
```
POLÍTICA DE PRIVACIDAD

1. DATOS RECOPILADOS: nombre, cédula, teléfono, factura, datos de compra.
2. FINALIDAD: validar participación, contactar ganadores.
3. PROTECCIÓN: Los datos serán almacenados en servidores seguros y no se compartirán con terceros sin autorización, salvo requerimiento legal.
4. DERECHOS DEL USUARIO: El participante podrá solicitar acceso, modificación o eliminación de sus datos mediante email oficial de la campaña.
5. CONSERVACIÓN: Los datos serán conservados por hasta 24 meses.
```

### Aviso Legal
```
AVISO LEGAL DEL SORTEO
Esta promoción es válida únicamente en Paraguay.
No requiere compra mínima distinta a productos ALLWAYS.
No acumulable con otras promociones.
El premio no es transferible ni canjeable por dinero.
Imágenes ilustrativas.
```

---

## 8. CONFIGURAÇÃO .env (Backend)

```env
# Server
PORT=3001
NODE_ENV=production

# Oracle Database
ORACLE_USER=allways
ORACLE_PASSWORD=Q1Kpvif9RTs4
ORACLE_CONNECTION_STRING=192.168.1.240:1521/ORCL
ORACLE_POOL_MIN=2
ORACLE_POOL_MAX=10

# JWT
JWT_SECRET=gerar_um_secret_seguro_aqui_com_64_chars
JWT_EXPIRES_IN=8h

# reCAPTCHA v3
RECAPTCHA_SITE_KEY=6Lf4l3YsAAAAAET3AdzFI9486UWXI2z4wUzBgplH
RECAPTCHA_SECRET_KEY=6Lf4l3YsAAAAADvSSaq9iFubgfhsIDWODh13qAP0
RECAPTCHA_MIN_SCORE=0.5

# CORS
CORS_ORIGINS=https://www.sanjosesa.com.py,http://192.168.1.225

# Upload
UPLOAD_MAX_SIZE=5242880
UPLOAD_DIR=./uploads

# Admin seed (primeiro deploy)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Admin2026!
```

---

## 9. CONFIGURAÇÃO NGINX

```nginx
server {
    listen 80;
    server_name 192.168.1.225;

    # Frontend (SPA)
    location /allways {
        alias /var/www/html/allways/frontend/dist;
        try_files $uri $uri/ /allways/index.html;
    }

    # API Backend
    location /allways/api {
        proxy_pass http://127.0.0.1:3001/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 10M;
    }

    # Uploads (admin only served through API)
    location /allways/uploads {
        deny all;
    }
}
```

---

## 10. VITE CONFIG

```js
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/allways/',
  server: {
    proxy: {
      '/allways/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/allways/, '')
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
```

---

## 11. LÓGICA DE NEGÓCIO IMPORTANTE

### Geração de Cupons
- Formato: `AW-2026-XXXXXX` (AW + ano + 6 dígitos aleatórios únicos)
- Gerar N cupons = quantidade de produtos informados
- Cupons só são gerados quando admin ACEITA o registro
- Todos cupons participam do sorteo do mês corrente + sorteo final

### Validação de Registro (Admin)
- Admin vê a imagem da factura em tamanho grande
- Compara quantidade de produtos declarados vs visível na factura
- Se aceita: gera cupons automaticamente
- Se rechaza: deve informar motivo (campo obrigatório)
- Log de toda ação administrativa

### Consulta de Cupons (Público)
- Buscar por cédula
- Mostrar: lista de cupons, estado de cada registro, total de cupons válidos
- reCAPTCHA obrigatório
- Rate limit: 10 consultas por IP a cada 15 min

### Geolocalização
- Usar departamento/ciudad selecionados no formulário para geolocação aproximada
- No dashboard admin: agrupar por departamento e mostrar no mapa
- Não pedir GPS do navegador (simplicidade)

---

## 12. SEGURANÇA

- reCAPTCHA v3 em TODOS os endpoints públicos POST
- Rate limiting por IP em todos os endpoints
- JWT com expiração para admin
- Helmet para headers de segurança
- CORS restrito aos domínios configurados
- Upload: validar MIME type real (não confiar na extensão), max 5MB
- SQL: usar bind parameters SEMPRE (oracledb já faz isso nativamente)
- Sanitizar inputs (trim, escape)
- Imagens de upload: NÃO servir diretamente — servir via API com auth para admin
- bcrypt com salt rounds = 12 para senhas admin
- Logs de acesso admin

---

## 13. RESPONSIVIDADE

- **Mobile first** (TailwindCSS breakpoints: sm, md, lg, xl)
- Landing page: hero full-width, cards de prêmios em carrossel horizontal no mobile, grid no desktop
- Formulário: full-width mobile, max-w-2xl centered desktop
- Dashboard admin: sidebar colapsável no mobile, gráficos empilhados
- Tabelas admin: scroll horizontal no mobile com colunas priorizadas
- Testar em: 375px (iPhone SE), 768px (iPad), 1024px (laptop), 1440px (desktop)

---

## 14. DEPLOY

1. No VPS (192.168.1.225):
   - Instalar Node.js 20 LTS, npm, nginx
   - Instalar Oracle Instant Client (para oracledb thick mode)
   - Criar diretório `/var/www/html/allways/`
   - Clonar/copiar o projeto
   - `cd frontend && npm install && npm run build`
   - `cd backend && npm install`
   - Configurar `.env` do backend
   - Executar scripts SQL no Oracle 19C (192.168.1.240)
   - Configurar nginx com `allways.conf`
   - Usar PM2 para rodar o backend: `pm2 start server.js --name allways-api`
   - Copiar imagens dos prêmios para `frontend/public/images/prizes/`

2. Acesso via: `http://192.168.1.225/allways/`
3. Redirecionamento de `www.sanjosesa.com.py/allways` → configurar no DNS/proxy deles

---

## 15. INSTRUÇÕES PARA O AGENTE

1. **Criar toda a estrutura de diretórios** conforme seção 3
2. **Começar pelo backend**: config DB, models, routes, controllers, middleware
3. **Depois frontend**: configurar Vite + Tailwind, criar componentes UI base, depois páginas
4. **Scripts SQL**: criar todos os scripts de banco separados e ordenados
5. **Config nginx**: criar o arquivo de configuração
6. **README.md**: documentação de instalação e deploy
7. **Testar localmente** antes de considerar pronto
8. **Todo o site deve estar em ESPANHOL** (Paraguai)
9. **Código limpo**: ESLint, comentários em pontos-chave, sem código morto
10. **Não usar TypeScript** (manter simples com JavaScript/JSX)
11. **As imagens dos prêmios serão copiadas manualmente** — usar placeholders com nomes corretos
12. **Gerar um JWT_SECRET seguro** no .env automaticamente (crypto.randomBytes)
13. **Seed do admin**: no primeiro boot, se não existir admin, criar com ADMIN_USERNAME/ADMIN_PASSWORD do .env

### Diretório de trabalho
O projeto deve ser criado em: `/var/www/html/allways/`

O agente tem acesso SSH ao VPS: `192.168.1.225:2809` (root).

### Imagens dos prêmios disponíveis (copiar de D:\desenv\sites\always show de premios\imgs\):
- AIR FRYER.png → air-fryer.png
- IPHONE.png → iphone.png
- KWID.png → kwid.png
- KWID4.png → kwid4.png
- MOTO.png → moto.png
- SCOOTER.png → scooter.png
- TV.png → tv.png
- ROBO ASPIRADOR.png → robo-aspirador.png
- PATINETE (1).png → patinete.png
- LUCIADORA PERSONAL.png → licuadora-personal.png
- LUCUADORA 2 (1).png → licuadora-2.png
