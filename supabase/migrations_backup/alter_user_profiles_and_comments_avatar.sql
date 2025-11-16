ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

ALTER TABLE comments ADD COLUMN IF NOT EXISTS user_avatar_url TEXT;