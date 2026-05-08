-- ============================================================
-- Allways Show de Premios - WhatsApp Module Tables
-- Oracle 19C
-- ============================================================
-- Stores Evolution API instance state, templates, chats, messages
-- and automated-notification audit log.
-- ============================================================

-- 1. ALLWAYS_WA_INSTANCIA  (one row expected: the campaign instance)
CREATE TABLE ALLWAYS_WA_INSTANCIA (
    ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    NOMBRE VARCHAR2(80) NOT NULL UNIQUE,
    NUMERO VARCHAR2(20),
    ESTADO VARCHAR2(30) DEFAULT 'DESCONECTADA',
    QR_CODE CLOB,
    ULTIMA_CONEXION TIMESTAMP,
    ULTIMO_EVENTO VARCHAR2(80),
    FECHA_CREACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT CK_WA_ESTADO CHECK (ESTADO IN ('DESCONECTADA','QR_PENDIENTE','CONECTANDO','CONECTADA','ERROR'))
);

-- 2. ALLWAYS_WA_PLANTILLAS  (editable templates with placeholders)
CREATE TABLE ALLWAYS_WA_PLANTILLAS (
    ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    CODIGO VARCHAR2(40) NOT NULL UNIQUE,
    NOMBRE VARCHAR2(120) NOT NULL,
    TEXTO CLOB NOT NULL,
    ACTIVO CHAR(1) DEFAULT 'S',
    FECHA_CREACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FECHA_MODIFICACION TIMESTAMP,
    CONSTRAINT CK_WA_PLANT_ACTIVO CHECK (ACTIVO IN ('S','N'))
);

-- 3. ALLWAYS_WA_CHATS  (one per remote phone number)
CREATE TABLE ALLWAYS_WA_CHATS (
    ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    PARTICIPANTE_ID NUMBER,
    TELEFONO VARCHAR2(20) NOT NULL,
    REMOTE_JID VARCHAR2(80) NOT NULL,
    NOMBRE_CONTACTO VARCHAR2(200),
    ULTIMA_ACTIVIDAD TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    NO_LEIDOS NUMBER DEFAULT 0,
    FECHA_CREACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT UK_WA_CHAT_JID UNIQUE (REMOTE_JID),
    CONSTRAINT FK_WA_CHAT_PART FOREIGN KEY (PARTICIPANTE_ID) REFERENCES ALLWAYS_PARTICIPANTES(ID)
);

-- 4. ALLWAYS_WA_MENSAJES  (full message history)
CREATE TABLE ALLWAYS_WA_MENSAJES (
    ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    CHAT_ID NUMBER NOT NULL,
    DIRECCION VARCHAR2(3) NOT NULL,
    TEXTO CLOB,
    TIPO VARCHAR2(30) DEFAULT 'texto',
    EVOLUTION_MESSAGE_ID VARCHAR2(120),
    ESTADO VARCHAR2(20) DEFAULT 'enviado',
    PLANTILLA_CODIGO VARCHAR2(40),
    REGISTRO_ID NUMBER,
    ENVIADO_POR_ADMIN NUMBER,
    FECHA TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT CK_WA_MSG_DIR CHECK (DIRECCION IN ('IN','OUT')),
    CONSTRAINT FK_WA_MSG_CHAT FOREIGN KEY (CHAT_ID) REFERENCES ALLWAYS_WA_CHATS(ID),
    CONSTRAINT FK_WA_MSG_REG FOREIGN KEY (REGISTRO_ID) REFERENCES ALLWAYS_REGISTROS(ID),
    CONSTRAINT FK_WA_MSG_ADMIN FOREIGN KEY (ENVIADO_POR_ADMIN) REFERENCES ALLWAYS_ADMIN(ID)
);

-- 5. ALLWAYS_WA_LOG_NOTIF  (audit of automated notifications)
CREATE TABLE ALLWAYS_WA_LOG_NOTIF (
    ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    REGISTRO_ID NUMBER NOT NULL,
    PARTICIPANTE_ID NUMBER NOT NULL,
    TIPO VARCHAR2(20) NOT NULL,
    EXITOSO CHAR(1) DEFAULT 'S',
    MENSAJE_ID NUMBER,
    ERROR_DETALLE VARCHAR2(2000),
    FECHA TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT CK_WA_NOTIF_TIPO CHECK (TIPO IN ('RECIBIDO','ACEPTADO','RECHAZADO')),
    CONSTRAINT CK_WA_NOTIF_OK CHECK (EXITOSO IN ('S','N')),
    CONSTRAINT FK_WA_NOTIF_REG FOREIGN KEY (REGISTRO_ID) REFERENCES ALLWAYS_REGISTROS(ID),
    CONSTRAINT FK_WA_NOTIF_PART FOREIGN KEY (PARTICIPANTE_ID) REFERENCES ALLWAYS_PARTICIPANTES(ID),
    CONSTRAINT FK_WA_NOTIF_MSG FOREIGN KEY (MENSAJE_ID) REFERENCES ALLWAYS_WA_MENSAJES(ID)
);

-- Indexes
CREATE INDEX IDX_WA_CHAT_TEL ON ALLWAYS_WA_CHATS(TELEFONO);
CREATE INDEX IDX_WA_CHAT_PART ON ALLWAYS_WA_CHATS(PARTICIPANTE_ID);
CREATE INDEX IDX_WA_CHAT_ACT ON ALLWAYS_WA_CHATS(ULTIMA_ACTIVIDAD);
CREATE INDEX IDX_WA_MSG_CHAT_FECHA ON ALLWAYS_WA_MENSAJES(CHAT_ID, FECHA);
CREATE INDEX IDX_WA_MSG_REG ON ALLWAYS_WA_MENSAJES(REGISTRO_ID);
CREATE INDEX IDX_WA_NOTIF_REG ON ALLWAYS_WA_LOG_NOTIF(REGISTRO_ID);

-- Seed default templates (Spanish, with emojis, placeholders {{name}})
INSERT INTO ALLWAYS_WA_PLANTILLAS (CODIGO, NOMBRE, TEXTO) VALUES (
  'RECIBIDO',
  'Cadastro recibido (en analisis)',
  '*Allways Show de Premios* 🎁' || CHR(10) ||
  '' || CHR(10) ||
  '¡Hola {{nombre}}! 👋' || CHR(10) ||
  '' || CHR(10) ||
  'Recibimos tu registro correctamente ✅' || CHR(10) ||
  '' || CHR(10) ||
  '📄 Factura: *{{numeroFactura}}*' || CHR(10) ||
  '🛒 Productos: *{{cantidadProductos}}*' || CHR(10) ||
  '' || CHR(10) ||
  'Estamos analizando tu factura y validando tus cupones 🔎' || CHR(10) ||
  'En breve recibiras la confirmacion por este mismo medio.' || CHR(10) ||
  '' || CHR(10) ||
  '¡Mucha suerte! 🍀'
);

INSERT INTO ALLWAYS_WA_PLANTILLAS (CODIGO, NOMBRE, TEXTO) VALUES (
  'ACEPTADO',
  'Cadastro aceptado (con cupones)',
  '*Allways Show de Premios* 🎉' || CHR(10) ||
  '' || CHR(10) ||
  '¡Excelente noticia, {{nombre}}!' || CHR(10) ||
  '' || CHR(10) ||
  'Tu registro fue *aprobado* ✅' || CHR(10) ||
  '' || CHR(10) ||
  '🎟️ *Tus cupones:*' || CHR(10) ||
  '{{cuponesLista}}' || CHR(10) ||
  '' || CHR(10) ||
  '🏆 *Estas concursando este mes ({{mesActual}}) por:*' || CHR(10) ||
  '{{premiosMes}}' || CHR(10) ||
  '' || CHR(10) ||
  '🚗 Y al final de la campaña, el *premio mayor: Renault Mobi 0Km* 🤩' || CHR(10) ||
  '' || CHR(10) ||
  'Guarda tus numeros y mucha suerte 🍀'
);

INSERT INTO ALLWAYS_WA_PLANTILLAS (CODIGO, NOMBRE, TEXTO) VALUES (
  'RECHAZADO',
  'Cadastro rechazado',
  '*Allways Show de Premios* ⚠️' || CHR(10) ||
  '' || CHR(10) ||
  'Hola {{nombre}},' || CHR(10) ||
  '' || CHR(10) ||
  'Lamentablemente *no pudimos confirmar tus cupones* en este momento debido a una irregularidad o falta de informacion en los datos enviados. 😕' || CHR(10) ||
  '' || CHR(10) ||
  '📝 Motivo: {{motivo}}' || CHR(10) ||
  '' || CHR(10) ||
  'Por favor, *responde a este mismo numero* 💬 para que podamos ayudarte a regularizar tu participacion.' || CHR(10) ||
  '' || CHR(10) ||
  '¡Gracias por participar!'
);

COMMIT;
