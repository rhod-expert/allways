# Business Logic & Domain Rules

## Registration Flow (Public)
1. reCAPTCHA v3 verifies bot score
2. Text fields sanitized (strip HTML tags)
3. Images validated with Sharp (real MIME, max 1920px width, JPG/PNG only)
4. If cedula exists → link to existing participant
5. Create registro with status `PENDIENTE` (Oracle transaction)
6. Files saved to `uploads/facturas/` and `uploads/productos/` with UUID names

## Validation Flow (Admin)
1. Admin views invoice image (full-size)
2. **ACCEPT** → generates N coupons (1 per declared product)
   - Format: `AW-2026-XXXXXX` (random 6 digits)
   - Month: current month in Spanish
3. **REJECT** → requires mandatory reason
4. All actions logged to `ALLWAYS_ADMIN_LOG`

## Coupon Lookup (Public)
- Search by cedula → list coupons with status and draw month
- reCAPTCHA required

## Prize Structure (30 prizes, April-October 2026)
- April: 4 prizes (TV 50", 2x Licuadora, Cupon Compra)
- May-September: 5 prizes each (mix of electronics, appliances)
- October: 1 prize → **Renault Kwid 0km** (final draw, all accumulated coupons)
- Campaign: March 1 - September 30, 2026
- TV 50" in April/May/June (before World Cup July 2026)

## Security Features
- reCAPTCHA v3 on all public POST endpoints
- Rate limiting per IP (express-rate-limit) with IETF draft-7 headers
- JWT (8h expiry) for admin panel
- Helmet (11 security headers including CSP)
- CORS restricted to configured domains
- Multer MIME validation + Sharp real MIME check
- bcrypt (salt=12) for admin passwords
- Bind parameters in ALL SQL queries
- HTML sanitization server-side (stripHtml)
- Path traversal protection (triple-layer)
- reCAPTCHA bypass blocked in production (NODE_ENV=production)

## Database Tables (Oracle 19C, prefix ALLWAYS_)
1. ALLWAYS_ADMIN - Admin users
2. ALLWAYS_PARTICIPANTES - Registered participants (UK: CEDULA)
3. ALLWAYS_REGISTROS - Invoice records (FK→PARTICIPANTES, ADMIN)
4. ALLWAYS_CUPONES - Generated coupons (FK→REGISTROS, PARTICIPANTES)
5. ALLWAYS_PREMIOS - Monthly campaign prizes
6. ALLWAYS_ADMIN_LOG - Admin action audit trail
