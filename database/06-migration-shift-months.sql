-- ============================================================
-- Migration: shift campaign months from APRIL-OCTOBER to MAY-NOVEMBER
-- Prize change: Renault Kwid -> Fiat Mobi 0km for final draw
-- Safe to run on databases with test coupons (clears test state).
-- Run as: sqlplus user/pass@wint @06-migration-shift-months.sql
-- ============================================================

-- Clear test draw results before reseeding prizes.
UPDATE ALLWAYS_CUPONES SET GANADOR = 'N';
UPDATE ALLWAYS_PREMIOS SET CUPON_GANADOR_ID = NULL, FECHA_SORTEO = NULL;

-- Remap existing test coupon MES_SORTEO values (shift +1 month).
UPDATE ALLWAYS_CUPONES SET MES_SORTEO = 'NOVIEMBRE' WHERE UPPER(MES_SORTEO) = 'OCTUBRE';
UPDATE ALLWAYS_CUPONES SET MES_SORTEO = 'OCTUBRE'   WHERE UPPER(MES_SORTEO) = 'SEPTIEMBRE';
UPDATE ALLWAYS_CUPONES SET MES_SORTEO = 'SEPTIEMBRE' WHERE UPPER(MES_SORTEO) = 'AGOSTO';
UPDATE ALLWAYS_CUPONES SET MES_SORTEO = 'AGOSTO'    WHERE UPPER(MES_SORTEO) = 'JULIO';
UPDATE ALLWAYS_CUPONES SET MES_SORTEO = 'JULIO'     WHERE UPPER(MES_SORTEO) = 'JUNIO';
UPDATE ALLWAYS_CUPONES SET MES_SORTEO = 'JUNIO'     WHERE UPPER(MES_SORTEO) = 'MAYO';
UPDATE ALLWAYS_CUPONES SET MES_SORTEO = 'MAYO'      WHERE UPPER(MES_SORTEO) = 'ABRIL';

-- Replace all prizes with the new MAY-NOVEMBER structure.
DELETE FROM ALLWAYS_PREMIOS;

INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('MAYO', 'TV Smart Audisat 50"', '/images/prizes/tv.png', 'S');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('MAYO', 'Licuadora Personal XION 600ml', '/images/prizes/licuadora-personal.png', 'S');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('MAYO', 'Licuadora Personal XION 380ml', '/images/prizes/licuadora-2.png', 'S');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('MAYO', 'Cupon de Compra 500.000Gs', '/images/prizes/cupon-compra.png', 'S');

INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('JUNIO', 'TV Smart Audisat 50"', '/images/prizes/tv.png', 'S');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('JUNIO', 'Freidora Air Fryer XION 5L', '/images/prizes/air-fryer.png', 'S');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('JUNIO', 'Licuadora Personal XION 600ml', '/images/prizes/licuadora-personal.png', 'S');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('JUNIO', 'Licuadora Personal XION 380ml', '/images/prizes/licuadora-2.png', 'S');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('JUNIO', 'Cupon de Compra 500.000Gs', '/images/prizes/cupon-compra.png', 'S');

INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('JULIO', 'TV Smart Audisat 50"', '/images/prizes/tv.png', 'S');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('JULIO', 'Aspiradora Robot XION', '/images/prizes/robo-aspirador.png', 'S');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('JULIO', 'Licuadora Personal XION 600ml', '/images/prizes/licuadora-personal.png', 'S');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('JULIO', 'Licuadora Personal XION 380ml', '/images/prizes/licuadora-2.png', 'S');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('JULIO', 'Cupon de Compra 500.000Gs', '/images/prizes/cupon-compra.png', 'S');

INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('AGOSTO', 'Motoneta Kenton Viva 110', '/images/prizes/moto.png', 'S');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('AGOSTO', 'Freidora Air Fryer XION 5L', '/images/prizes/air-fryer.png', 'S');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('AGOSTO', 'Licuadora Personal XION 600ml', '/images/prizes/licuadora-personal.png', 'S');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('AGOSTO', 'Cupon de Compra 500.000Gs', '/images/prizes/cupon-compra.png', 'S');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('AGOSTO', 'Cupon de Compra 500.000Gs', '/images/prizes/cupon-compra.png', 'S');

INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('SEPTIEMBRE', 'iPhone 16 128GB', '/images/prizes/iphone.png', 'S');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('SEPTIEMBRE', 'Freidora Air Fryer XION 5L', '/images/prizes/air-fryer.png', 'S');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('SEPTIEMBRE', 'Scooter Electrico HYE HY-SC8.5', '/images/prizes/scooter.png', 'S');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('SEPTIEMBRE', 'Patineta Electrica', '/images/prizes/patineta.png', 'S');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('SEPTIEMBRE', 'Cupon de Compra 500.000Gs', '/images/prizes/cupon-compra.png', 'S');

INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('OCTUBRE', 'Motoneta Kenton Viva 110', '/images/prizes/moto.png', 'S');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('OCTUBRE', 'iPhone 16 128GB', '/images/prizes/iphone.png', 'S');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('OCTUBRE', 'Aspiradora Robot XION', '/images/prizes/robo-aspirador.png', 'S');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('OCTUBRE', 'Licuadora Personal XION 380ml', '/images/prizes/licuadora-2.png', 'S');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('OCTUBRE', 'Cupon de Compra 500.000Gs', '/images/prizes/cupon-compra.png', 'S');

INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('NOVIEMBRE', 'Fiat Mobi 0km', '/images/prizes/mobi.png', 'S');

COMMIT;
