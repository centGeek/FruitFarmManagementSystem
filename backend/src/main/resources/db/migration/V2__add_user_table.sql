CREATE TABLE user_profile_entity
(
    user_id       SERIAL PRIMARY KEY,
    name          VARCHAR(64) NOT NULL,
    surname       VARCHAR(64) NOT NULL,
    nickname      VARCHAR(64),
    phone_number  VARCHAR(64),
    email         VARCHAR(255),
    creation_date DATE        NOT NULL,
    role_id       INT         NOT NULL,
    is_active     BOOLEAN     NOT NULL,
    gardener_id   INT,
    coordinate_id INT,
    locality_name VARCHAR(64),
    CONSTRAINT fk_role
        FOREIGN KEY (role_id)
            REFERENCES role_entity (role_id)
);

CREATE TABLE user_credentials_entity
(
    credential_id SERIAL PRIMARY KEY,
    user_id       INT          NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    CONSTRAINT fk_user
        FOREIGN KEY (user_id)
            REFERENCES user_profile_entity (user_id)
            ON DELETE CASCADE
);
