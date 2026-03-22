
CREATE TABLE public.admin_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read admin_accounts" ON public.admin_accounts FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public insert admin_accounts" ON public.admin_accounts FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow public update admin_accounts" ON public.admin_accounts FOR UPDATE TO anon USING (true);

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.admin_login(p_username text, p_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_accounts
    WHERE username = p_username
    AND password_hash = crypt(p_password, password_hash)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_register(p_username text, p_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM admin_accounts LIMIT 1) THEN
    RETURN FALSE;
  END IF;
  INSERT INTO admin_accounts (username, password_hash)
  VALUES (p_username, crypt(p_password, gen_salt('bf')));
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_change_password(p_username text, p_current_password text, p_new_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM admin_accounts
    WHERE username = p_username
    AND password_hash = crypt(p_current_password, password_hash)
  ) THEN
    RETURN FALSE;
  END IF;
  UPDATE admin_accounts
  SET password_hash = crypt(p_new_password, gen_salt('bf'))
  WHERE username = p_username;
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_exists()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (SELECT 1 FROM admin_accounts LIMIT 1);
$$;
