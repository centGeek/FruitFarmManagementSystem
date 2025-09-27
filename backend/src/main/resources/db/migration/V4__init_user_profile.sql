INSERT INTO user_profile (name, surname, nickname, phone_number, email, password, is_active, role_id, gardener_id)
VALUES
    ('Admin', 'Admin', 'admin', '000-000-000', 'admin@orchmanager.com',
     '$2a$12$KBIXJAH1YpXeNOmrxvWaeOAWag93MJwAR5fShaUdeE8O9LO8JXErm', true, 1, null),
    ('John', 'Doe', 'gardener', '111-111-111', 'gardener@orchmanager.com',
     '$2a$12$rx5jNVkdI7cRF1p3Gjf.VuUflZEDKXxEeENno85UTeFIFH100sPIK', true, 2, null);