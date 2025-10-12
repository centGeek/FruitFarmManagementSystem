CREATE TABLE profit_entity
(
    purchase_id    SERIAL PRIMARY KEY,
    profit_type    VARCHAR(50)    NOT NULL,
    kilograms_sold NUMERIC(10, 2),
    profit         NUMERIC(15, 2) NOT NULL,
    description    TEXT,
    created_at     DATE           NOT NULL,
    received       BOOLEAN        NOT NULL,
    user_id        BIGINT,
    sector_id      BIGINT,
    CONSTRAINT fk_profit_user
        FOREIGN KEY (user_id)
            REFERENCES user_profile (user_id)
            ON DELETE SET NULL,
    CONSTRAINT fk_profit_sector
        FOREIGN KEY (sector_id)
            REFERENCES sector_entity (sector_id)
            ON DELETE SET NULL
);
