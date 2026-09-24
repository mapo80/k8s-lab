-- Gli enti proprietari di impianti sportivi.
-- id è la chiave primaria generata dal database; id_sorgente è l'ID del file
-- open data, univoco: è la chiave su cui si regge l'idempotenza dell'import.
CREATE TABLE ente (
    id             BIGSERIAL    PRIMARY KEY,
    id_sorgente    VARCHAR(20)  NOT NULL,
    denominazione  VARCHAR(100) NOT NULL,
    tipo           VARCHAR(10)  NOT NULL,
    provincia_id   BIGINT       NOT NULL,
    comune         VARCHAR(100) NOT NULL,
    indirizzo      VARCHAR(255),
    -- testo, non numero: contiene anche punti, barre e trattini
    telefono       VARCHAR(30),
    dt_inserimento TIMESTAMP    NOT NULL,
    dt_modifica    TIMESTAMP    NOT NULL,
    CONSTRAINT uk_ente_id_sorgente UNIQUE (id_sorgente),
    CONSTRAINT ck_ente_tipo CHECK (tipo IN ('PRIVATO', 'PUBBLICO')),
    CONSTRAINT fk_ente_provincia FOREIGN KEY (provincia_id) REFERENCES provincia (id)
);

-- GET /province/{id}/enti filtra per provincia
CREATE INDEX ix_ente_provincia ON ente (provincia_id);
