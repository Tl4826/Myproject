-- Database Schema (PostgreSQL)
-- gen_random_uuid() có sẵn từ PostgreSQL 13+. Bản cũ hơn: CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. social_users: tài khoản đăng nhập bằng Google/Facebook
CREATE TABLE IF NOT EXISTS social_users (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider         TEXT NOT NULL,
    provider_user_id TEXT NOT NULL,
    email            TEXT,
    display_name     TEXT,
    avatar_url       TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login_at    TIMESTAMPTZ,
    CONSTRAINT uq_social_users_provider UNIQUE (provider, provider_user_id)
);

-- 2. social_sessions: phiên đăng nhập
CREATE TABLE IF NOT EXISTS social_sessions (
    token_hash CHAR(64) PRIMARY KEY,
    user_id    UUID NOT NULL REFERENCES social_users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_social_sessions_user_id ON social_sessions(user_id);

-- 3. user_diary_entries: nhật ký món ăn
CREATE TABLE IF NOT EXISTS user_diary_entries (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES social_users(id) ON DELETE CASCADE,
    eaten_on      DATE NOT NULL,
    food_name     TEXT NOT NULL,
    meal_category TEXT,
    calories      NUMERIC,
    protein       NUMERIC,
    carbs         NUMERIC,
    fat           NUMERIC,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_diary_user_eaten_on ON user_diary_entries(user_id, eaten_on);

-- 4. user_profiles: hồ sơ người dùng (quan hệ 1 : 0..1 với social_users)
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id    UUID PRIMARY KEY REFERENCES social_users(id) ON DELETE CASCADE,
    email      TEXT,
    name       TEXT,
    age        INTEGER,
    gender     TEXT,
    height     NUMERIC(6,2),
    weight     NUMERIC(6,2),
    bmi        NUMERIC(5,2),
    activity   NUMERIC(4,2),
    goal       TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. nutrition_plans: lộ trình dinh dưỡng
CREATE TABLE IF NOT EXISTS nutrition_plans (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES social_users(id) ON DELETE CASCADE,
    target_weight NUMERIC(6,2),
    start_weight  NUMERIC(6,2),
    weeks         INTEGER,
    start_date    DATE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_nutrition_plans_user_id ON nutrition_plans(user_id);