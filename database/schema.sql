-- NutriVN / Neon PostgreSQL: run once after connecting a database to Vercel.
-- Google and Facebook accounts are keyed by provider + stable provider user ID,
-- never email alone (emails may change or be absent).
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS social_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL CHECK (provider IN ('google', 'facebook', 'email')),
    provider_user_id TEXT NOT NULL,
    email TEXT,
    display_name TEXT NOT NULL DEFAULT '',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_social_identity UNIQUE (provider, provider_user_id)
);

CREATE TABLE IF NOT EXISTS social_sessions (
    token_hash CHAR(64) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES social_users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT token_hash_format CHECK (token_hash ~ '^[0-9a-f]{64}$')
);
CREATE INDEX IF NOT EXISTS idx_social_sessions_user ON social_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_social_sessions_expiry ON social_sessions(expires_at);

-- Reserved for account-scoped diary sync; UI integration is a separate change.
-- Missing nutrition must stay NULL, not a fabricated calorie value.
CREATE TABLE IF NOT EXISTS user_diary_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES social_users(id) ON DELETE CASCADE,
    eaten_on DATE NOT NULL,
    food_name TEXT NOT NULL,
    meal_category TEXT NOT NULL DEFAULT 'other',
    calories NUMERIC(10,2) CHECK (calories IS NULL OR calories >= 0),
    protein NUMERIC(10,2) CHECK (protein IS NULL OR protein >= 0),
    carbs NUMERIC(10,2) CHECK (carbs IS NULL OR carbs >= 0),
    fat NUMERIC(10,2) CHECK (fat IS NULL OR fat >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_diary_user_date
    ON user_diary_entries (user_id, eaten_on DESC);


-- Apply this change to databases created before email/password sign-in was added.
ALTER TABLE social_users DROP CONSTRAINT IF EXISTS social_users_provider_check;
ALTER TABLE social_users ADD CONSTRAINT social_users_provider_check
  CHECK (provider IN ('google', 'facebook', 'email'));

CREATE TABLE IF NOT EXISTS email_credentials (
  user_id UUID PRIMARY KEY REFERENCES social_users(id) ON DELETE CASCADE,
  normalized_email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  CONSTRAINT normalized_email_lowercase CHECK (normalized_email = lower(trim(normalized_email)))
);
