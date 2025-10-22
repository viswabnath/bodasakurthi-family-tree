-- Migration: Add username uniqueness validation
-- This updates the create_initial_admin function to check for duplicate usernames

DROP FUNCTION IF EXISTS public.create_initial_admin(TEXT, TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.create_initial_admin(
  admin_username TEXT,
  admin_password TEXT,
  admin_email TEXT,
  family_surname TEXT,
  display_name TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_family_id UUID;
  new_admin_id UUID;
  password_hash TEXT;
  subdomain_value TEXT;
  email_exists INTEGER;
  username_exists INTEGER;
  final_display_name TEXT;
BEGIN
  -- Validate inputs
  IF admin_username IS NULL OR LENGTH(TRIM(admin_username)) < 3 THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Username must be at least 3 characters'
    );
  END IF;

  -- Check if username already exists (must be globally unique)
  SELECT COUNT(*) INTO username_exists FROM admin_users WHERE LOWER(username) = LOWER(TRIM(admin_username));
  IF username_exists > 0 THEN
    RETURN json_build_object(
      'success', false,
      'message', 'This username is already taken. Please choose a different one.'
    );
  END IF;

  IF admin_email IS NULL OR admin_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$' THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Invalid email format'
    );
  END IF;

  -- Check if email already exists (must be globally unique)
  SELECT COUNT(*) INTO email_exists FROM admin_users WHERE email = TRIM(admin_email);
  IF email_exists > 0 THEN
    RETURN json_build_object(
      'success', false,
      'message', 'This email is already registered'
    );
  END IF;

  IF admin_password IS NULL OR LENGTH(admin_password) < 6 THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Password must be at least 6 characters'
    );
  END IF;

  IF family_surname IS NULL OR LENGTH(TRIM(family_surname)) = 0 THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Family surname is required'
    );
  END IF;

  -- Use display_name if provided, otherwise use family_surname
  final_display_name := COALESCE(NULLIF(TRIM(display_name), ''), TRIM(family_surname));

  -- Generate subdomain from base surname (without suffix like 's or ji)
  subdomain_value := generate_subdomain_from_surname(TRIM(family_surname));

  -- Hash the password using pgcrypto
  password_hash := crypt(admin_password, gen_salt('bf'));

  -- Create the family
  INSERT INTO families (subdomain, surname, display_name, is_active)
  VALUES (subdomain_value, TRIM(family_surname), final_display_name, true)
  RETURNING id INTO new_family_id;

  -- Insert new admin user for this family
  INSERT INTO admin_users (family_id, username, email, password_hash, is_active)
  VALUES (new_family_id, TRIM(admin_username), TRIM(admin_email), password_hash, true)
  RETURNING id INTO new_admin_id;

  -- Initialize the family tree with empty members
  INSERT INTO family_trees (family_id, members)
  VALUES (new_family_id, '[]'::jsonb);

  -- Return success with connection info
  RETURN json_build_object(
    'success', true,
    'message', 'Family created successfully',
    'family_id', new_family_id,
    'admin_id', new_admin_id,
    'subdomain', subdomain_value,
    'url', subdomain_value || CASE 
      WHEN current_setting('server.port', true) = '3000' THEN '.localhost:3000'
      ELSE '.familywall.in'
    END
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object(
      'success', false,
      'message', 'This family name or email is already registered'
    );
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'An error occurred: ' || SQLERRM
    );
END;
$$;
