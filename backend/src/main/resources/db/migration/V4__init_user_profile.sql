INSERT INTO user_profile (name, surname, nickname, phone_number, email, is_active, role_id, gardener_id, creation_date)
VALUES ('Admin', 'Admin', 'admin', '000-000-000', 'admin@orchmanager.com', true, 1, null, CURRENT_DATE),
       ('John', 'Doe', 'gardener', '111-111-111', 'gardener@orchmanager.com', true, 2, null, CURRENT_DATE);

INSERT INTO user_credentials (user_id, password_hash)
VALUES (1, '$2a$12$KBIXJAH1YpXeNOmrxvWaeOAWag93MJwAR5fShaUdeE8O9LO8JXErm'),
       (2, '$2a$12$rx5jNVkdI7cRF1p3Gjf.VuUflZEDKXxEeENno85UTeFIFH100sPIK');