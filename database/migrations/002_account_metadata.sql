-- Additive schema proposal for isolated staging; do not import device-local health data.
BEGIN;
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id UUID PRIMARY KEY REFERENCES social_users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL DEFAULT '' CHECK (char_length(display_name) <= 120),
    locale TEXT NOT NULL DEFAULT 'vi-VN' CHECK (char_length(locale) <= 20),
    timezone TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh' CHECK (char_length(timezone) <= 80),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS user_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES social_users(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (char_length(trim(title)) BETWEEN 1 AND 120),
    start_on DATE NOT NULL,
    end_on DATE NOT NULL CHECK (end_on >= start_on),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_plans_owner ON user_plans(user_id, start_on DESC);
CREATE TABLE IF NOT EXISTS user_saved_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES social_users(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL CHECK (period_end >= period_start),
    days_recorded INTEGER NOT NULL CHECK (days_recorded >= 0 AND days_recorded <= period_end - period_start + 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, period_start, period_end)
);
CREATE INDEX IF NOT EXISTS idx_user_saved_reports_owner ON user_saved_reports(user_id, period_end DESC);
-- New tables are server-only by default. Do not expose them to public clients.
REVOKE ALL ON user_profiles, user_plans, user_saved_reports FROM PUBLIC;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_saved_reports ENABLE ROW LEVEL SECURITY;
COMMIT;
