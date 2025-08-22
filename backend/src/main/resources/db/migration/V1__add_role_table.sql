CREATE TABLE role
(
    role_id serial PRIMARY KEY,
    role_name varchar(64) NOT NULL UNIQUE
);
