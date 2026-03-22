
CREATE OR REPLACE FUNCTION public.admin_login(p_username text, p_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_accounts
    WHERE username = p_username
    AND password_hash = extensions.crypt(p_password, password_hash)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_register(p_username text, p_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM admin_accounts LIMIT 1) THEN
    RETURN FALSE;
  END IF;
  INSERT INTO admin_accounts (username, password_hash)
  VALUES (p_username, extensions.crypt(p_password, extensions.gen_salt('bf')));
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_change_password(p_username text, p_current_password text, p_new_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM admin_accounts
    WHERE username = p_username
    AND password_hash = extensions.crypt(p_current_password, password_hash)
  ) THEN
    RETURN FALSE;
  END IF;
  UPDATE admin_accounts
  SET password_hash = extensions.crypt(p_new_password, extensions.gen_salt('bf'))
  WHERE username = p_username;
  RETURN TRUE;
END;
$$;
