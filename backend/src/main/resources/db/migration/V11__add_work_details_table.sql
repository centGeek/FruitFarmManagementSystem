CREATE TABLE work_details_entity
(
    id               serial PRIMARY KEY,
    is_paid_hourly   BOOLEAN   NOT NULL,
    hourly_pay       NUMERIC(10, 2),
    pay_per_kilogram NUMERIC(10, 2),
    created_at       TIMESTAMP NOT NULL,
    user_entity      BIGINT    NOT NULL,
    CONSTRAINT fk_work_details_user
        FOREIGN KEY (user_entity)
            REFERENCES user_profile_entity (user_id)
);
