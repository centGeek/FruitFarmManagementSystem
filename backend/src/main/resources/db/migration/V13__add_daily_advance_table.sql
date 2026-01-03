CREATE TABLE advance_pay_entity
(
    id          serial PRIMARY KEY,
    user_id     BIGINT         NOT NULL,
    amount      NUMERIC(10, 2) NOT NULL,
    description VARCHAR(500),
    created_at  TIMESTAMP      NOT NULL,
    is_settled  BOOLEAN        NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_advance_pay_user
        FOREIGN KEY (user_id)
            REFERENCES user_profile_entity (user_id)
);
