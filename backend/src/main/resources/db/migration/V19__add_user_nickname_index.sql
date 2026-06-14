-- Every authenticated request resolves the account by nickname (JwtAuthenticationFilter
-- account-blocking check, login, refresh). Without an index this is a sequential scan
-- of user_profile_entity. A plain (non-unique) index speeds up those lookups; it is not
-- UNIQUE because nickname is nullable and may repeat in legacy/seed data.
CREATE INDEX idx_user_profile_nickname ON user_profile_entity (nickname);
