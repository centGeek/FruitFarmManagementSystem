CREATE TABLE sector_entity
(
    sector_id   serial PRIMARY KEY,
    plant_type  VARCHAR(50),
    plant_variety  VARCHAR(50),
    description TEXT,
    created_at  DATE,
    user_id     BIGINT,
    is_active   BOOLEAN NOT NULL,
    CONSTRAINT fk_sector_user FOREIGN KEY (user_id) REFERENCES user_profile_entity (user_id)
);