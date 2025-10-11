CREATE TABLE work_entry
(
    entry_id    SERIAL PRIMARY KEY,
    user_id     INT          NOT NULL,
    sector_id   INT,
    start_time  TIMESTAMP    NOT NULL,
    end_time    TIMESTAMP,
    duration    INTERVAL,
    description TEXT,
    is_approved BOOLEAN    DEFAULT FALSE,
    created_at  TIMESTAMP  DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_entry_user
        FOREIGN KEY (user_id)
            REFERENCES user_profile (user_id),

    CONSTRAINT fk_entry_sector
        FOREIGN KEY (sector_id)
            REFERENCES sector_entity (sector_id)
);