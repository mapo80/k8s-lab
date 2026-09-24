-- Le sei province della Puglia: le inserisce la migrazione, non l'importazione.
-- Gli id sono assegnati qui, esplicitamente; la sequenza del BIGSERIAL viene
-- poi allineata, così un eventuale inserimento futuro non collide.
CREATE TABLE provincia (
    id             BIGSERIAL    PRIMARY KEY,
    nome           VARCHAR(50)  NOT NULL,
    dt_inserimento TIMESTAMP    NOT NULL DEFAULT now(),
    dt_modifica    TIMESTAMP    NOT NULL DEFAULT now(),
    CONSTRAINT uk_provincia_nome UNIQUE (nome)
);

INSERT INTO provincia (id, nome) VALUES
    (1, 'Bari'),
    (2, 'Barletta-Andria-Trani'),
    (3, 'Brindisi'),
    (4, 'Foggia'),
    (5, 'Lecce'),
    (6, 'Taranto');

SELECT setval('provincia_id_seq', (SELECT max(id) FROM provincia));
