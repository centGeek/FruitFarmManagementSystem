CREATE TABLE expense_entity
(
    expense_id   serial PRIMARY KEY,
    product_type VARCHAR(50)    NOT NULL,
    expense_cost DECIMAL(19, 2) NOT NULL,
    description  TEXT           NOT NULL,
    is_paid      BOOLEAN        NOT NULL,
    user_id      BIGINT         NOT NULL,
    CONSTRAINT fk_expense_user FOREIGN KEY (user_id) REFERENCES user_profile (user_id)
);
