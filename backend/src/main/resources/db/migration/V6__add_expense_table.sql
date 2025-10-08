CREATE TABLE expense_entity
(
    expense_id   serial PRIMARY KEY,
    product_type VARCHAR(50)    NOT NULL,
    expense_cost DECIMAL(19, 2) NOT NULL,
    description  TEXT,
    created_at   DATE           NOT NULL,
    is_paid      BOOLEAN        NOT NULL,
    user_id      BIGINT         NOT NULL,
    sector_id    BIGINT,
    CONSTRAINT fk_expense_user FOREIGN KEY (user_id) REFERENCES user_profile (user_id),
    CONSTRAINT fk_expense_sector FOREIGN KEY (sector_id) REFERENCES sector_entity (sector_id) ON DELETE CASCADE

);
