-- ============================================================
-- Auth trigger: tự tạo profiles khi user đăng ký Supabase Auth
-- Chạy 1 lần trên Supabase SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role user_role;
  v_full_name TEXT;
  v_phone TEXT;
BEGIN
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  v_role := COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer');
  v_phone := NULLIF(TRIM(NEW.raw_user_meta_data->>'phone'), '');

  INSERT INTO public.profiles (id, email, full_name, role, phone)
  VALUES (NEW.id, NEW.email, v_full_name, v_role, v_phone)
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        role = EXCLUDED.role,
        phone = COALESCE(EXCLUDED.phone, profiles.phone);

  IF v_role = 'customer' THEN
    INSERT INTO public.customer_profiles (id)
    VALUES (NEW.id)
    ON CONFLICT (id) DO NOTHING;
  ELSIF v_role = 'provider' THEN
    INSERT INTO public.provider_profiles (
      id, business_name, vehicle_type, base_price, price_per_km, price_per_floor
    )
    VALUES (NEW.id, v_full_name, 'small_truck', 100000, 10000, 15000)
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
