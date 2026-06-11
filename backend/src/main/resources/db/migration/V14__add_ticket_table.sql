CREATE TABLE ticket_entity
(
    ticket_id   SERIAL PRIMARY KEY,
    user_id     INT         NOT NULL,
    description TEXT        NOT NULL,
    category    VARCHAR(64),
    created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at   TIMESTAMP,
    status      VARCHAR(32) NOT NULL,
    CONSTRAINT fk_ticket_user
        FOREIGN KEY (user_id)
            REFERENCES user_profile_entity (user_id)
);
