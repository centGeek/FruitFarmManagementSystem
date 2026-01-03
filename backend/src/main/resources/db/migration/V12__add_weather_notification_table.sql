CREATE TABLE weather_notifications_entity
(
    id                        serial PRIMARY KEY,
    user_id                   BIGINT           NOT NULL,
    weather_notification_type VARCHAR(50)      NOT NULL,
    threshold                 DOUBLE PRECISION NOT NULL,
    days_ahead                INT              NOT NULL,
    enabled                   BOOLEAN          NOT NULL DEFAULT TRUE,
    created_at                TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at                TIMESTAMP WITHOUT TIME ZONE,
    last_triggered_at         TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT fk_weather_notification_user
        FOREIGN KEY (user_id)
            REFERENCES user_profile_entity (user_id)
);