-- ============================================================
-- Allways Show de Premios - Prize Seed Data
-- Oracle 19C
-- Campaign: ABRIL - OCTUBRE (30 prizes)
-- ============================================================

DELETE FROM ALLWAYS_PREMIOS;

-- ABRIL (4 prizes)
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('ABRIL', 'TV Smart Audisat 50"', '/images/prizes/tv.png', 'S');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('ABRIL', 'Licuadora Personal XION 600ml', '/images/prizes/licuadora-personal.png', 'S');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('ABRIL', 'Licuadora Personal XION 380ml', '/images/prizes/licuadora-2.png', 'S');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('ABRIL', 'Cupon de Compra 500.000Gs', '/images/prizes/cupon-compra.png', 'S');

-- MAYO (5 prizes)
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('MAYO', 'TV Smart Audisat 50"', '/images/prizes/tv.png', 'S');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('MAYO', 'Freidora Air Fryer XION 5L', '/images/prizes/air-fryer.png', 'S');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('MAYO', 'Licuadora Personal XION 600ml', '/images/prizes/licuadora-personal.png', 'S');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('MAYO', 'Licuadora Personal XION 380ml', '/images/prizes/licuadora-2.png', 'S');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('MAYO', 'Cupon de Compra 500.000Gs', '/images/prizes/cupon-compra.png', 'S');

-- JUNIO (5 prizes)
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('JUNIO', 'TV Smart Audisat 50"', '/images/prizes/tv.png', 'S');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('JUNIO', 'Aspiradora Robot XION', '/images/prizes/robo-aspirador.png', 'S');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('JUNIO', 'Licuadora Personal XION 600ml', '/images/prizes/licuadora-personal.png', 'S');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('JUNIO', 'Licuadora Personal XION 380ml', '/images/prizes/licuadora-2.png', 'S');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('JUNIO', 'Cupon de Compra 500.000Gs', '/images/prizes/cupon-compra.png', 'S');

-- JULIO (5 prizes)
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('JULIO', 'Motoneta Kenton Viva 110', '/images/prizes/moto.png', 'S');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('JULIO', 'Freidora Air Fryer XION 5L', '/images/prizes/air-fryer.png', 'S');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('JULIO', 'Licuadora Personal XION 600ml', '/images/prizes/licuadora-personal.png', 'S');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('JULIO', 'Cupon de Compra 500.000Gs', '/images/prizes/cupon-compra.png', 'S');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('JULIO', 'Cupon de Compra 500.000Gs', '/images/prizes/cupon-compra.png', 'S');

-- AGOSTO (5 prizes)
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('AGOSTO', 'iPhone 16 128GB', '/images/prizes/iphone.png', 'S');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('AGOSTO', 'Freidora Air Fryer XION 5L', '/images/prizes/air-fryer.png', 'S');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('AGOSTO', 'Scooter Electrico HYE HY-SC8.5', '/images/prizes/scooter.png', 'S');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('AGOSTO', 'Patineta Electrica', '/images/prizes/patineta.png', 'S');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('AGOSTO', 'Cupon de Compra 500.000Gs', '/images/prizes/cupon-compra.png', 'S');

-- SEPTIEMBRE (5 prizes)
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('SEPTIEMBRE', 'Motoneta Kenton Viva 110', '/images/prizes/moto.png', 'S');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('SEPTIEMBRE', 'iPhone 16 128GB', '/images/prizes/iphone.png', 'S');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('SEPTIEMBRE', 'Aspiradora Robot XION', '/images/prizes/robo-aspirador.png', 'S');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('SEPTIEMBRE', 'Licuadora Personal XION 380ml', '/images/prizes/licuadora-2.png', 'S');
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('SEPTIEMBRE', 'Cupon de Compra 500.000Gs', '/images/prizes/cupon-compra.png', 'S');

-- OCTUBRE (1 prize - SORTEO FINAL)
INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN, ACTIVO) VALUES ('OCTUBRE', 'Renault Kwid 0km', '/images/prizes/kwid.png', 'S');

COMMIT;
