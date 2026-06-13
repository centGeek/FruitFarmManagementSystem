-- Strengthen the default admin password (new password: test5432), bcrypt cost 12.
UPDATE user_credentials_entity
SET password_hash = '$2a$12$5hDTsGcXtsFL0uErlDnBfuUeWE4wBnvUq./UctHTjPS/pLE1xWi42'
WHERE user_id = 1;
