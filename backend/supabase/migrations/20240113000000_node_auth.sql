-- Node.js JWT auth (không phụ thuộc Supabase Auth / email quota)
-- CHẠY THỦ CÔNG trên Supabase SQL Editor (xem docs/AUTH_NODE_MODULE.md).
-- Chạy sau các migration trước. profiles.id = UUID do app sinh, không bắt buộc auth.users.

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_id_fkey;

CREATE TABLE IF NOT EXISTS public.user_credentials (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_user_credentials_updated_at
  BEFORE UPDATE ON public.user_credentials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user
  ON public.password_reset_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires
  ON public.password_reset_tokens(expires_at)
  WHERE used_at IS NULL;

COMMENT ON TABLE public.user_credentials IS 'Mật khẩu bcrypt — auth qua Node.js JWT';
COMMENT ON TABLE public.password_reset_tokens IS 'Token đặt lại MK (OTP) — gửi qua Node/SMTP sau';
