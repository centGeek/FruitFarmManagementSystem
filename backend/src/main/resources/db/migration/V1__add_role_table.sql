CREATE TABLE role_entity
(
    role_id serial PRIMARY KEY,
    role_name varchar(64) NOT NULL UNIQUE
);
