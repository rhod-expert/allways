#!/usr/bin/env python3
"""Allways Show de Premios - Database Setup via Python oracledb"""
import os
import sys

os.environ['ORACLE_HOME'] = '/usr/lib/oracle/19.25/client64'
os.environ['LD_LIBRARY_PATH'] = '/usr/lib/oracle/19.25/client64/lib'
os.environ['TNS_ADMIN'] = '/usr/lib/oracle/19.25/client64/lib/network/admin'

try:
    import oracledb
    oracledb.init_oracle_client(lib_dir="/usr/lib/oracle/19.25/client64/lib")
except ImportError:
    try:
        import cx_Oracle as oracledb
    except ImportError:
        print("ERROR: No Oracle Python driver (oracledb or cx_Oracle) found")
        sys.exit(1)

DSN = "WINT"
USER = "allways"
PASS = "Q1Kpvif9RTs4"

# Tables to drop in reverse FK order
DROP_TABLES = [
    "ALLWAYS_ADMIN_LOG",
    "ALLWAYS_PREMIOS",
    "ALLWAYS_CUPONES",
    "ALLWAYS_REGISTROS",
    "ALLWAYS_PARTICIPANTES",
    "ALLWAYS_ADMIN",
]

CREATE_TABLES = [
    """CREATE TABLE ALLWAYS_ADMIN (
        ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        USERNAME VARCHAR2(50) NOT NULL UNIQUE,
        PASSWORD_HASH VARCHAR2(200) NOT NULL,
        NOMBRE VARCHAR2(200),
        ROL VARCHAR2(20) DEFAULT 'ADMIN',
        ACTIVO CHAR(1) DEFAULT 'S',
        FECHA_CREACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ULTIMO_LOGIN TIMESTAMP
    )""",
    """CREATE TABLE ALLWAYS_PARTICIPANTES (
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
    )""",
    """CREATE TABLE ALLWAYS_REGISTROS (
        ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        PARTICIPANTE_ID NUMBER NOT NULL,
        NUMERO_FACTURA VARCHAR2(50) NOT NULL,
        CANTIDAD_PRODUCTOS NUMBER NOT NULL,
        IMAGEN_FACTURA VARCHAR2(500) NOT NULL,
        IMAGEN_PRODUCTOS VARCHAR2(500),
        ESTADO VARCHAR2(20) DEFAULT 'PENDIENTE',
        MOTIVO_RECHAZO VARCHAR2(500),
        VALIDADO_POR NUMBER,
        FECHA_VALIDACION TIMESTAMP,
        FECHA_REGISTRO TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        IP_REGISTRO VARCHAR2(45),
        CONSTRAINT FK_REG_PART FOREIGN KEY (PARTICIPANTE_ID) REFERENCES ALLWAYS_PARTICIPANTES(ID),
        CONSTRAINT FK_REG_ADMIN FOREIGN KEY (VALIDADO_POR) REFERENCES ALLWAYS_ADMIN(ID),
        CONSTRAINT CK_ESTADO CHECK (ESTADO IN ('PENDIENTE','ACEPTADO','RECHAZADO'))
    )""",
    """CREATE TABLE ALLWAYS_CUPONES (
        ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        REGISTRO_ID NUMBER NOT NULL,
        PARTICIPANTE_ID NUMBER NOT NULL,
        NUMERO_CUPON VARCHAR2(20) NOT NULL UNIQUE,
        MES_SORTEO VARCHAR2(20),
        GANADOR CHAR(1) DEFAULT 'N',
        FECHA_GENERACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT FK_CUP_REG FOREIGN KEY (REGISTRO_ID) REFERENCES ALLWAYS_REGISTROS(ID),
        CONSTRAINT FK_CUP_PART FOREIGN KEY (PARTICIPANTE_ID) REFERENCES ALLWAYS_PARTICIPANTES(ID)
    )""",
    """CREATE TABLE ALLWAYS_PREMIOS (
        ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        MES VARCHAR2(20) NOT NULL,
        DESCRIPCION VARCHAR2(200) NOT NULL,
        IMAGEN VARCHAR2(500),
        CUPON_GANADOR_ID NUMBER,
        FECHA_SORTEO DATE,
        ACTIVO CHAR(1) DEFAULT 'S',
        CONSTRAINT FK_PREMIO_CUPON FOREIGN KEY (CUPON_GANADOR_ID) REFERENCES ALLWAYS_CUPONES(ID)
    )""",
    """CREATE TABLE ALLWAYS_ADMIN_LOG (
        ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        ADMIN_ID NUMBER,
        ACCION VARCHAR2(100),
        DETALLE VARCHAR2(500),
        IP VARCHAR2(45),
        FECHA TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT FK_LOG_ADMIN FOREIGN KEY (ADMIN_ID) REFERENCES ALLWAYS_ADMIN(ID)
    )""",
]

CREATE_INDEXES = [
    "CREATE INDEX IDX_REG_PARTICIPANTE ON ALLWAYS_REGISTROS(PARTICIPANTE_ID)",
    "CREATE INDEX IDX_REG_ESTADO ON ALLWAYS_REGISTROS(ESTADO)",
    "CREATE INDEX IDX_REG_FECHA ON ALLWAYS_REGISTROS(FECHA_REGISTRO)",
    "CREATE INDEX IDX_CUP_PARTICIPANTE ON ALLWAYS_CUPONES(PARTICIPANTE_ID)",
    "CREATE INDEX IDX_CUP_NUMERO ON ALLWAYS_CUPONES(NUMERO_CUPON)",
    "CREATE INDEX IDX_PART_CEDULA ON ALLWAYS_PARTICIPANTES(CEDULA)",
]

SEED_PRIZES = [
    ("ABRIL", "Licuadora Personal XION 600ml", "/images/prizes/licuadora-personal.png"),
    ("ABRIL", "Licuadora Personal XION 380ml", "/images/prizes/licuadora-2.png"),
    ("MAYO", "Freidora Air Fryer XION 5L", "/images/prizes/air-fryer.png"),
    ("JUNIO", "Aspiradora Robot XION", "/images/prizes/robo-aspirador.png"),
    ("JULIO", 'TV Smart Audisat 50"', "/images/prizes/tv.png"),
    ("AGOSTO", "Motoneta Kenton Viva 110", "/images/prizes/moto.png"),
    ("SEPTIEMBRE", "Scooter Electrico HYE HY-SC8.5", "/images/prizes/scooter.png"),
    ("OCTUBRE", "iPhone 16 128GB", "/images/prizes/iphone.png"),
    ("NOVIEMBRE", "Renault Kwid 0km", "/images/prizes/kwid.png"),
    ("DICIEMBRE", "Renault Kwid 0km (Sorteo Final)", "/images/prizes/kwid.png"),
]

def main():
    print("Connecting to Oracle...")
    conn = oracledb.connect(user=USER, password=PASS, dsn=DSN)
    cursor = conn.cursor()
    print("Connected successfully!")

    # Drop tables
    print("\n=== Dropping existing tables ===")
    for tbl in DROP_TABLES:
        try:
            cursor.execute(f"DROP TABLE {tbl} CASCADE CONSTRAINTS")
            print(f"  Dropped {tbl}")
        except Exception as e:
            if "ORA-00942" in str(e):
                print(f"  {tbl} does not exist (skipped)")
            else:
                print(f"  Error dropping {tbl}: {e}")

    # Create tables
    print("\n=== Creating tables ===")
    for sql in CREATE_TABLES:
        tbl_name = sql.split("CREATE TABLE ")[1].split(" ")[0].split("(")[0]
        try:
            cursor.execute(sql)
            print(f"  Created {tbl_name}")
        except Exception as e:
            print(f"  Error creating {tbl_name}: {e}")
            sys.exit(1)

    # Create indexes
    print("\n=== Creating indexes ===")
    for sql in CREATE_INDEXES:
        idx_name = sql.split("CREATE INDEX ")[1].split(" ")[0]
        try:
            cursor.execute(sql)
            print(f"  Created {idx_name}")
        except Exception as e:
            print(f"  Error creating {idx_name}: {e}")

    # Seed prizes
    print("\n=== Seeding prizes ===")
    for mes, desc, img in SEED_PRIZES:
        cursor.execute(
            "INSERT INTO ALLWAYS_PREMIOS (MES, DESCRIPCION, IMAGEN) VALUES (:1, :2, :3)",
            (mes, desc, img)
        )
        print(f"  Inserted prize: {desc}")
    conn.commit()

    # Verify
    print("\n=== Verification: Tables ===")
    cursor.execute("SELECT table_name FROM user_tables WHERE table_name LIKE 'ALLWAYS%' ORDER BY table_name")
    for row in cursor:
        print(f"  {row[0]}")

    print("\n=== Verification: Indexes ===")
    cursor.execute("SELECT index_name, table_name FROM user_indexes WHERE table_name LIKE 'ALLWAYS%' AND index_name LIKE 'IDX_%' ORDER BY index_name")
    for row in cursor:
        print(f"  {row[0]} on {row[1]}")

    print("\n=== Verification: Prizes ===")
    cursor.execute("SELECT ID, MES, DESCRIPCION FROM ALLWAYS_PREMIOS ORDER BY ID")
    for row in cursor:
        print(f"  {row[0]}: [{row[1]}] {row[2]}")

    cursor.close()
    conn.close()
    print("\n=== All done! ===")

if __name__ == "__main__":
    main()
