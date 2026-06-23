-- ================================================================
-- ESQUEMA JERÁRQUICO: MONITOREO AMBIENTAL — AMAZONIA
-- Base de datos: PostgreSQL
-- Modelo: Árbol de 4 niveles con integridad referencial CASCADE
-- ================================================================

-- Nivel 1: RAÍZ — Región Amazónica
CREATE TABLE Region_Amazonica (
    id_region      SERIAL PRIMARY KEY,
    nombre_region  VARCHAR(100) NOT NULL,
    area_km2       DECIMAL(12,2),
    pais           VARCHAR(50)
);

-- Nivel 2: PADRE — Zona de Monitoreo
CREATE TABLE Zona_Monitoreo (
    id_zona           SERIAL PRIMARY KEY,
    id_region_parent  INT NOT NULL,
    nombre_zona       VARCHAR(100),
    tipo_clima        VARCHAR(50),
    CONSTRAINT fk_region
        FOREIGN KEY (id_region_parent)
        REFERENCES Region_Amazonica(id_region)
        ON DELETE CASCADE
);

-- Nivel 3: HIJO/PADRE — Estación de Monitoreo
CREATE TABLE Estacion_Monitoreo (
    id_estacion       SERIAL PRIMARY KEY,
    id_zona_parent    INT NOT NULL,
    coordenadas_gps   VARCHAR(100),
    tipo_estacion     VARCHAR(50),
    fecha_instalacion DATE DEFAULT CURRENT_DATE,
    CONSTRAINT fk_zona
        FOREIGN KEY (id_zona_parent)
        REFERENCES Zona_Monitoreo(id_zona)
        ON DELETE CASCADE
);

-- Nivel 4: HOJA — Sensor Ambiental
CREATE TABLE Sensor_Ambiental (
    id_sensor          SERIAL PRIMARY KEY,
    id_estacion_parent INT NOT NULL,
    tipo_magnitud      VARCHAR(50),
    unidad_medida      VARCHAR(20),
    frecuencia_hz      INT,
    CONSTRAINT fk_estacion
        FOREIGN KEY (id_estacion_parent)
        REFERENCES Estacion_Monitoreo(id_estacion)
        ON DELETE CASCADE
);

-- ================================================================
-- DATOS DE PRUEBA
-- ================================================================

INSERT INTO Region_Amazonica VALUES
    (1, 'Amazonia Brasileña', 5500000.00, 'Brasil');

INSERT INTO Zona_Monitoreo VALUES
    (101, 1, 'Zona Norte', 'Tropical Húmedo'),
    (102, 1, 'Zona Sur',   'Tropical Seco');

INSERT INTO Estacion_Monitoreo VALUES
    (1001, 101, '-3.1019, -60.0250', 'Terrestre-Fluvial', '2024-01-15'),
    (1002, 102, '-8.7619, -63.9039', 'Aérea-Remota',      '2024-03-22');

INSERT INTO Sensor_Ambiental VALUES
    (1, 1001, 'Temperatura',         'Celsius', 1),
    (2, 1001, 'Dióxido de Carbono',  'ppm',     1),
    (3, 1001, 'Humedad Relativa',    '%',        2),
    (4, 1002, 'Temperatura',         'Celsius', 1),
    (5, 1002, 'Partículas PM2.5',    'µg/m³',   1);
Anexo B: Esquema dbdiagram.io
Table Region_Amazonica {

    id_region     int         [pk, increment]

    nombre_region varchar(100)[not null]

    area_km2      decimal

    pais          varchar(50)

}

Table Zona_Monitoreo {

    id_zona          int         [pk, increment]

    id_region_parent int         [not null, ref: > Region_Amazonica.id_region]

    nombre_zona      varchar(100)

    tipo_clima       varchar(50)

}

Table Estacion_Monitoreo {

    id_estacion      int         [pk, increment]

    id_zona_parent   int         [not null, ref: > Zona_Monitoreo.id_zona]

    coordenadas_gps  varchar(100)

    tipo_estacion    varchar(50)

    fecha_instalacion date

}

Table Sensor_Ambiental {

    id_sensor          int        [pk, increment]

    id_estacion_parent int        [not null, ref: > Estacion_Monitoreo.id_estacion]

    tipo_magnitud      varchar(50)

    unidad_medida      varchar(20)

    frecuencia_hz      int

}
