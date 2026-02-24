SET ECHO ON
SET FEEDBACK ON
SET SERVEROUTPUT ON

PROMPT ================================================
PROMPT  Allways Show de Premios - Database Setup
PROMPT ================================================

PROMPT
PROMPT === Step 0: Dropping existing tables ===
PROMPT
@/var/www/html/allways/database/00-drop-tables.sql

PROMPT
PROMPT === Step 1: Creating tables ===
PROMPT
@/var/www/html/allways/database/01-create-tables.sql

PROMPT
PROMPT === Step 2: Creating indexes ===
PROMPT
@/var/www/html/allways/database/02-create-indexes.sql

PROMPT
PROMPT === Step 5: Seeding prizes ===
PROMPT
@/var/www/html/allways/database/05-seed-prizes.sql

PROMPT
PROMPT === Verification: Tables ===
PROMPT
SELECT table_name FROM user_tables WHERE table_name LIKE 'ALLWAYS%' ORDER BY table_name;

PROMPT
PROMPT === Verification: Indexes ===
PROMPT
SELECT index_name, table_name FROM user_indexes WHERE table_name LIKE 'ALLWAYS%' AND index_name LIKE 'IDX_%' ORDER BY index_name;

PROMPT
PROMPT === Verification: Prizes ===
PROMPT
SELECT ID, MES, DESCRIPCION FROM ALLWAYS_PREMIOS ORDER BY ID;

PROMPT
PROMPT === All done! ===
PROMPT

EXIT;
