-- Family Tree Application Database Schema - Multi-Tenant System
-- Each family gets their own subdomain: <surname>.familywall.in

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table: families
-- Stores information about each family (tenant)
CREATE TABLE IF NOT EXISTS families (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subdomain VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'smith' for smith.familywall.in
  surname VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL, -- e.g., "Smith's Family", "Johnsonji", etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT subdomain_format CHECK (subdomain ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$')
);

-- Table: admin_users
-- Stores admin user credentials (one admin per family)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  username VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(family_id, username) -- Username must be unique within a family
);

-- Table: family_trees
-- Stores family tree data (one tree per family)
CREATE TABLE IF NOT EXISTS family_trees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID UNIQUE NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  members JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_families_subdomain ON families(subdomain);
CREATE INDEX IF NOT EXISTS idx_admin_users_family_id ON admin_users(family_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_family_trees_family_id ON family_trees(family_id);

-- Function: generate_subdomain_from_surname
-- Generates a URL-safe subdomain from a surname
CREATE OR REPLACE FUNCTION generate_subdomain_from_surname(surname TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  base_subdomain TEXT;
  final_subdomain TEXT;
  counter INTEGER := 0;
  exists_count INTEGER;
BEGIN
  -- Convert to lowercase and replace spaces/special chars with hyphens
  base_subdomain := LOWER(REGEXP_REPLACE(surname, '[^a-zA-Z0-9]+', '-', 'g'));
  
  -- Remove leading/trailing hyphens
  base_subdomain := TRIM(BOTH '-' FROM base_subdomain);
  
  -- Limit length to 50 characters
  base_subdomain := SUBSTRING(base_subdomain FROM 1 FOR 50);
  
  -- Start with base subdomain
  final_subdomain := base_subdomain;
  
  -- Check if subdomain exists and increment if needed
  LOOP
    SELECT COUNT(*) INTO exists_count FROM families WHERE subdomain = final_subdomain;
    EXIT WHEN exists_count = 0;
    
    counter := counter + 1;
    final_subdomain := base_subdomain || '-' || counter;
  END LOOP;
  
  RETURN final_subdomain;
END;
$$;

-- Function: create_initial_admin
-- Creates a new family with its first admin user
-- Now supports multiple families, each with their own admin
-- Drop old version first to avoid ambiguity
DROP FUNCTION IF EXISTS public.create_initial_admin(TEXT, TEXT, TEXT, TEXT);

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
  final_display_name TEXT;
BEGIN
  -- Validate inputs
  IF admin_username IS NULL OR LENGTH(TRIM(admin_username)) < 3 THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Username must be at least 3 characters'
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

  RETURN json_build_object(
    'success', true,
    'message', 'Family created successfully',
    'admin_id', new_admin_id,
    'family_id', new_family_id,
    'subdomain', subdomain_value,
    'url', subdomain_value || '.familywall.in'
  );

EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Username or email already exists'
    );
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'An error occurred: ' || SQLERRM
    );
END;
$$;

-- Function: verify_admin_login
-- Verifies admin credentials for login (with subdomain context)
CREATE OR REPLACE FUNCTION public.verify_admin_login(
  login_subdomain TEXT,
  login_username TEXT,
  login_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  family_record RECORD;
  password_match BOOLEAN;
BEGIN
  -- Find the family by subdomain
  SELECT id, subdomain, surname, display_name
  INTO family_record
  FROM families
  WHERE subdomain = login_subdomain AND is_active = true;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Family not found'
    );
  END IF;

  -- Find the admin user for this family
  SELECT a.id, a.username, a.email, a.password_hash, a.is_active, a.family_id
  INTO user_record
  FROM admin_users a
  WHERE a.family_id = family_record.id 
    AND a.username = login_username 
    AND a.is_active = true;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Invalid username or password'
    );
  END IF;

  -- Verify password
  password_match := (user_record.password_hash = crypt(login_password, user_record.password_hash));

  IF NOT password_match THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Invalid username or password'
    );
  END IF;

  -- Update last login time
  UPDATE admin_users
  SET updated_at = NOW()
  WHERE id = user_record.id;

  RETURN json_build_object(
    'success', true,
    'message', 'Login successful',
    'user', json_build_object(
      'id', user_record.id,
      'username', user_record.username,
      'email', user_record.email,
      'family_id', user_record.family_id
    ),
    'family', json_build_object(
      'id', family_record.id,
      'subdomain', family_record.subdomain,
      'surname', family_record.surname,
      'display_name', family_record.display_name
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'An error occurred during login: ' || SQLERRM
    );
END;
$$;

-- Function: get_family_by_subdomain
-- Retrieves family information by subdomain
CREATE OR REPLACE FUNCTION public.get_family_by_subdomain(
  lookup_subdomain TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  family_record RECORD;
BEGIN
  SELECT id, subdomain, surname, display_name, created_at
  INTO family_record
  FROM families
  WHERE subdomain = lookup_subdomain AND is_active = true;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Family not found'
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'family', json_build_object(
      'id', family_record.id,
      'subdomain', family_record.subdomain,
      'surname', family_record.surname,
      'display_name', family_record.display_name,
      'created_at', family_record.created_at
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'An error occurred: ' || SQLERRM
    );
END;
$$;

-- Function: update_updated_at_column
-- Trigger function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_families_updated_at ON families;
CREATE TRIGGER update_families_updated_at
  BEFORE UPDATE ON families
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_family_trees_updated_at ON family_trees;
CREATE TRIGGER update_family_trees_updated_at
  BEFORE UPDATE ON family_trees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust based on your Supabase setup)
-- These permissions allow the anon role to call the functions
GRANT EXECUTE ON FUNCTION public.create_initial_admin TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_admin_login TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_family_by_subdomain TO anon, authenticated;
GRANT EXECUTE ON FUNCTION generate_subdomain_from_surname TO anon, authenticated;

-- Grant table access
GRANT SELECT ON families TO anon, authenticated;
GRANT SELECT ON admin_users TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON family_trees TO anon, authenticated;
