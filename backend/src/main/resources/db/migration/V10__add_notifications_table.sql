CREATE TABLE notifications
(
    id                serial primary key,
    notification_type VARCHAR(50)   NOT NULL,
    title             VARCHAR(100)  NOT NULL,
    message           VARCHAR(2000) NOT NULL,
    created_at        TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    user_id           INT           NOT NULL,
    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id)
            REFERENCES user_profile (user_id)
);