CREATE TABLE IF NOT EXISTS telegram_auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  telegram_id VARCHAR(50) NOT NULL,
  telegram_username VARCHAR(255),
  telegram_first_name VARCHAR(255),
  telegram_last_name VARCHAR(255),
  telegram_photo_url TEXT,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
