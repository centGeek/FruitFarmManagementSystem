CREATE TABLE work_entry
(
    entry_id    SERIAL PRIMARY KEY,
    user_id     INT  NOT NULL,
    sector_id   INT,
    work_date   DATE NOT NULL,
    duration    int,
    work_type   TEXT,
    description TEXT,
    is_approved BOOLEAN   DEFAULT FALSE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_entry_user
        FOREIGN KEY (user_id)
            REFERENCES user_profile (user_id),

    CONSTRAINT fk_entry_sector
        FOREIGN KEY (sector_id)
            REFERENCES sector_entity (sector_id)
);