-- ============================================================
-- Migration 08 - Cliente Area + Tienda/Vendedor
-- ============================================================
-- Idempotent: safe to re-run. Uses ANONYMOUS BLOCKS to swallow
-- "already exists" errors so partial re-runs converge.
--
-- Adds:
--   * ALLWAYS_REGISTROS.TIENDA (mandatory for new rows, nullable in DB
--     for backward compatibility with pre-migration rows)
--   * ALLWAYS_REGISTROS.VENDEDOR (optional)
--   * UK on (PARTICIPANTE_ID, NUMERO_FACTURA) to block duplicates
--   * ALLWAYS_PARTICIPANTES auth columns
--   * ALLWAYS_PARTICIPANTE_TOKEN (magic link + reset)
--   * ALLWAYS_CLIENTE_LOG (audit)
--   * 3 new ALLWAYS_WA_PLANTILLAS rows
-- ============================================================

SET DEFINE OFF;

-- ------------------------------------------------------------
-- 1. ALLWAYS_REGISTROS: TIENDA + VENDEDOR
-- ------------------------------------------------------------
DECLARE
  e_col_exists EXCEPTION;
  PRAGMA EXCEPTION_INIT(e_col_exists, -1430);
BEGIN
  EXECUTE IMMEDIATE 'ALTER TABLE ALLWAYS_REGISTROS ADD (TIENDA VARCHAR2(150))';
EXCEPTION
  WHEN e_col_exists THEN NULL;
END;
/

DECLARE
  e_col_exists EXCEPTION;
  PRAGMA EXCEPTION_INIT(e_col_exists, -1430);
BEGIN
  EXECUTE IMMEDIATE 'ALTER TABLE ALLWAYS_REGISTROS ADD (VENDEDOR VARCHAR2(150))';
EXCEPTION
  WHEN e_col_exists THEN NULL;
END;
/

-- Unique constraint to block duplicate factura uploads by the same participant
DECLARE
  e_uk_exists EXCEPTION;
  PRAGMA EXCEPTION_INIT(e_uk_exists, -2261);
BEGIN
  EXECUTE IMMEDIATE 'ALTER TABLE ALLWAYS_REGISTROS ADD CONSTRAINT UK_FACTURA_PART UNIQUE (PARTICIPANTE_ID, NUMERO_FACTURA)';
EXCEPTION
  WHEN e_uk_exists THEN NULL;
END;
/

-- ------------------------------------------------------------
-- 2. ALLWAYS_PARTICIPANTES: auth columns
-- ------------------------------------------------------------
DECLARE
  e_col_exists EXCEPTION;
  PRAGMA EXCEPTION_INIT(e_col_exists, -1430);
BEGIN
  EXECUTE IMMEDIATE 'ALTER TABLE ALLWAYS_PARTICIPANTES ADD (
    PASSWORD_HASH      VARCHAR2(200),
    PASSWORD_SET_AT    TIMESTAMP,
    ULTIMO_LOGIN       TIMESTAMP,
    INTENTOS_FALLIDOS  NUMBER DEFAULT 0,
    BLOQUEADO_HASTA    TIMESTAMP
  )';
EXCEPTION
  WHEN e_col_exists THEN NULL;
END;
/

-- ------------------------------------------------------------
-- 3. ALLWAYS_PARTICIPANTE_TOKEN
--    Stores SHA-256(token) — NEVER the plaintext token.
-- ------------------------------------------------------------
DECLARE
  e_table_exists EXCEPTION;
  PRAGMA EXCEPTION_INIT(e_table_exists, -955);
BEGIN
  EXECUTE IMMEDIATE 'CREATE TABLE ALLWAYS_PARTICIPANTE_TOKEN (
    ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    PARTICIPANTE_ID  NUMBER NOT NULL,
    TIPO             VARCHAR2(20) NOT NULL,
    TOKEN_HASH       VARCHAR2(64) NOT NULL,
    EXPIRA_EN        TIMESTAMP NOT NULL,
    USADO_EN         TIMESTAMP,
    IP_SOLICITUD     VARCHAR2(45),
    FECHA_CREACION   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_TOKEN_PART FOREIGN KEY (PARTICIPANTE_ID) REFERENCES ALLWAYS_PARTICIPANTES(ID),
    CONSTRAINT CK_TOKEN_TIPO CHECK (TIPO IN (''SETUP'',''RESET''))
  )';
EXCEPTION
  WHEN e_table_exists THEN NULL;
END;
/

DECLARE
  e_idx_exists EXCEPTION;
  PRAGMA EXCEPTION_INIT(e_idx_exists, -955);
BEGIN
  EXECUTE IMMEDIATE 'CREATE INDEX IX_TOKEN_HASH ON ALLWAYS_PARTICIPANTE_TOKEN (TOKEN_HASH)';
EXCEPTION
  WHEN e_idx_exists THEN NULL;
END;
/

DECLARE
  e_idx_exists EXCEPTION;
  PRAGMA EXCEPTION_INIT(e_idx_exists, -955);
BEGIN
  EXECUTE IMMEDIATE 'CREATE INDEX IX_TOKEN_PART ON ALLWAYS_PARTICIPANTE_TOKEN (PARTICIPANTE_ID, TIPO)';
EXCEPTION
  WHEN e_idx_exists THEN NULL;
END;
/

-- ------------------------------------------------------------
-- 4. ALLWAYS_CLIENTE_LOG (audit trail)
-- ------------------------------------------------------------
DECLARE
  e_table_exists EXCEPTION;
  PRAGMA EXCEPTION_INIT(e_table_exists, -955);
BEGIN
  EXECUTE IMMEDIATE 'CREATE TABLE ALLWAYS_CLIENTE_LOG (
    ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    PARTICIPANTE_ID  NUMBER,
    CEDULA           VARCHAR2(20),
    EVENTO           VARCHAR2(40) NOT NULL,
    EXITOSO          CHAR(1) DEFAULT ''S'',
    DETALLE          VARCHAR2(500),
    IP               VARCHAR2(45),
    USER_AGENT       VARCHAR2(300),
    FECHA            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_CLOG_PART FOREIGN KEY (PARTICIPANTE_ID) REFERENCES ALLWAYS_PARTICIPANTES(ID)
  )';
EXCEPTION
  WHEN e_table_exists THEN NULL;
END;
/

DECLARE
  e_idx_exists EXCEPTION;
  PRAGMA EXCEPTION_INIT(e_idx_exists, -955);
BEGIN
  EXECUTE IMMEDIATE 'CREATE INDEX IX_CLOG_FECHA ON ALLWAYS_CLIENTE_LOG (FECHA DESC)';
EXCEPTION
  WHEN e_idx_exists THEN NULL;
END;
/

-- ------------------------------------------------------------
-- 4b. Allow auth notifications (SETUP/RESET/PASSWORD_CAMBIADA) to be
--    logged in ALLWAYS_WA_LOG_NOTIF — they are not tied to a registro.
-- ------------------------------------------------------------
DECLARE
  e_already_nullable EXCEPTION;
  PRAGMA EXCEPTION_INIT(e_already_nullable, -1451);
BEGIN
  EXECUTE IMMEDIATE 'ALTER TABLE ALLWAYS_WA_LOG_NOTIF MODIFY (REGISTRO_ID NUMBER NULL)';
EXCEPTION
  WHEN e_already_nullable THEN NULL;
END;
/

-- ------------------------------------------------------------
-- 5. New WhatsApp templates
--    Insert-or-update so re-runs are safe.
-- ------------------------------------------------------------
MERGE INTO ALLWAYS_WA_PLANTILLAS t
USING (SELECT 'SETUP_PASSWORD' AS CODIGO FROM DUAL) s
   ON (t.CODIGO = s.CODIGO)
WHEN NOT MATCHED THEN INSERT (CODIGO, NOMBRE, TEXTO, ACTIVO)
  VALUES ('SETUP_PASSWORD',
          'Setup inicial de password (magic link)',
          'Hola {{nombre}}, ya recibimos tu primer registro en *Allways Show de Premios*.' || CHR(10) || CHR(10) ||
          'Crea tu contrasena para ver tus cupones y premios:' || CHR(10) ||
          '{{link}}' || CHR(10) || CHR(10) ||
          '_Valido por {{expira}}._',
          'S')
/

MERGE INTO ALLWAYS_WA_PLANTILLAS t
USING (SELECT 'RECUPERAR_PASSWORD' AS CODIGO FROM DUAL) s
   ON (t.CODIGO = s.CODIGO)
WHEN NOT MATCHED THEN INSERT (CODIGO, NOMBRE, TEXTO, ACTIVO)
  VALUES ('RECUPERAR_PASSWORD',
          'Recuperar contrasena',
          'Hola {{nombre}}, recibimos un pedido para recuperar tu contrasena en *Allways Show de Premios*.' || CHR(10) || CHR(10) ||
          'Toca el enlace para crear una nueva:' || CHR(10) ||
          '{{link}}' || CHR(10) || CHR(10) ||
          '_Valido por {{expira}}. Si no fuiste vos, ignora este mensaje._',
          'S')
/

MERGE INTO ALLWAYS_WA_PLANTILLAS t
USING (SELECT 'PASSWORD_CAMBIADA' AS CODIGO FROM DUAL) s
   ON (t.CODIGO = s.CODIGO)
WHEN NOT MATCHED THEN INSERT (CODIGO, NOMBRE, TEXTO, ACTIVO)
  VALUES ('PASSWORD_CAMBIADA',
          'Aviso de cambio de contrasena',
          'Hola {{nombre}}, tu contrasena fue cambiada el {{fecha}}.' || CHR(10) || CHR(10) ||
          'Si no fuiste vos, contacta a soporte de inmediato.',
          'S')
/

COMMIT
/
