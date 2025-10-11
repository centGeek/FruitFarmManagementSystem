CREATE TABLE task_definition
(
    task_def_id   SERIAL PRIMARY KEY,
    task_name     VARCHAR(100) NOT NULL UNIQUE,
    task_category VARCHAR(50),
    default_rate  DECIMAL(10, 2),
    description   TEXT
);