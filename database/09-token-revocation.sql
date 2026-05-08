-- ============================================================
-- Migration 09 - Mass token revocation support
-- ============================================================
-- Adds TOKENS_VALID_SINCE to ALLWAYS_PARTICIPANTES and ALLWAYS_ADMIN.
-- The auth middleware will reject any JWT whose `iat` (issued-at) is
-- earlier than this timestamp. Setting it to CURRENT_TIMESTAMP forces
-- the user to log in again on every device.
--
-- Use cases:
--   * Suspected credential leak → invalidate that user's sessions
--   * JWT_SECRET rotation in progress → force-invalidate everyone before
--     the secret rotation completes
--   * User reports unauthorized access → wipe all their existing sessions
-- ============================================================

SET DEFINE OFF;

-- 1. Cliente
DECLARE
  e_col_exists EXCEPTION;
  PRAGMA EXCEPTION_INIT(e_col_exists, -1430);
BEGIN
  EXECUTE IMMEDIATE 'ALTER TABLE ALLWAYS_PARTICIPANTES ADD (TOKENS_VALID_SINCE TIMESTAMP)';
EXCEPTION
  WHEN e_col_exists THEN NULL;
END;
/

-- 2. Admin
DECLARE
  e_col_exists EXCEPTION;
  PRAGMA EXCEPTION_INIT(e_col_exists, -1430);
BEGIN
  EXECUTE IMMEDIATE 'ALTER TABLE ALLWAYS_ADMIN ADD (TOKENS_VALID_SINCE TIMESTAMP)';
EXCEPTION
  WHEN e_col_exists THEN NULL;
END;
/

COMMIT
/
