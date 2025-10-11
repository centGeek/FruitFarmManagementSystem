CREATE TABLE work_entry_task
(
    entry_id    INT NOT NULL,
    task_def_id INT NOT NULL,

    PRIMARY KEY (entry_id, task_def_id),

    CONSTRAINT fk_wet_entry
        FOREIGN KEY (entry_id)
            REFERENCES work_entry (entry_id)
            ON DELETE CASCADE,

    CONSTRAINT fk_wet_task
        FOREIGN KEY (task_def_id)
            REFERENCES task_definition (task_def_id)
);