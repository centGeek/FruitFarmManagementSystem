CREATE TABLE audit_log_entity
(
    audit_id          SERIAL PRIMARY KEY,
    performed_by_id   INT,
    performed_by_name VARCHAR(128),
    action            VARCHAR(64) NOT NULL,
    target_type       VARCHAR(64),
    target_id         INT,
    details           TEXT,
    created_at        TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_log_created_at ON audit_log_entity (created_at);
