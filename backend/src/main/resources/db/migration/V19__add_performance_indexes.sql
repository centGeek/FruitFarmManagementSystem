-- Performance indexes. PostgreSQL does NOT auto-create indexes on foreign-key columns, so every
-- per-gardener list/filter query (work entries, expenses, profits, sectors, coordinates) was doing
-- a sequential scan. At the current data scale these scans are cheap, but the indexes keep the hot
-- queries flat as data grows and back the joins used across the app. IF NOT EXISTS keeps this
-- idempotent/safe to re-run.

-- WorkSchedule week view: WHERE user.gardener.id = ? AND work_date BETWEEN ? AND ? (+ per-user lookups).
CREATE INDEX IF NOT EXISTS idx_work_entry_user_work_date ON work_entry_entity (user_id, work_date);
CREATE INDEX IF NOT EXISTS idx_work_entry_sector_id ON work_entry_entity (sector_id);

-- user.gardener.id joins (work entries, employee lists, advances) + countByGardenerId in the admin panel.
CREATE INDEX IF NOT EXISTS idx_user_profile_gardener_id ON user_profile_entity (gardener_id);

-- Per-gardener financial lists.
CREATE INDEX IF NOT EXISTS idx_expense_user_id ON expense_entity (user_id);
CREATE INDEX IF NOT EXISTS idx_profit_user_id ON profit_entity (user_id);

-- Sector list per gardener + the coordinates N+1 backing sector polygons.
CREATE INDEX IF NOT EXISTS idx_sector_user_id ON sector_entity (user_id);
CREATE INDEX IF NOT EXISTS idx_coordinate_sector_id ON coordinate_entity (sector_id);
