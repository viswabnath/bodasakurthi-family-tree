-- RPC Functions for Theme Management

-- Function to update family theme (admin only)
CREATE OR REPLACE FUNCTION public.update_family_theme(
  p_family_id UUID,
  p_theme VARCHAR(50)
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Validate theme value
  IF p_theme NOT IN ('classic', 'ocean', 'forest', 'royal', 'sunset', 'slate') THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Invalid theme. Must be one of: classic, ocean, forest, royal, sunset, slate'
    );
  END IF;

  -- Update the theme
  UPDATE families
  SET theme = p_theme,
      updated_at = NOW()
  WHERE id = p_family_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Family not found'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Theme updated successfully',
    'theme', p_theme
  );
END;
$$;

-- Update the get_family_by_subdomain function to include theme
CREATE OR REPLACE FUNCTION public.get_family_by_subdomain(
  lookup_subdomain VARCHAR(100)
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_family_record RECORD;
  v_tree_record RECORD;
  v_result jsonb;
BEGIN
  -- Get family info
  SELECT id, subdomain, surname, display_name, is_active, theme, created_at
  INTO v_family_record
  FROM families
  WHERE subdomain = lookup_subdomain AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Family not found or inactive'
    );
  END IF;

  -- Get family tree data
  SELECT members
  INTO v_tree_record
  FROM family_trees
  WHERE family_id = v_family_record.id;

  -- Build result
  v_result := jsonb_build_object(
    'success', true,
    'family', jsonb_build_object(
      'id', v_family_record.id,
      'subdomain', v_family_record.subdomain,
      'surname', v_family_record.surname,
      'displayName', v_family_record.display_name,
      'isActive', v_family_record.is_active,
      'theme', COALESCE(v_family_record.theme, 'classic'),
      'createdAt', v_family_record.created_at
    ),
    'tree', jsonb_build_object(
      'members', COALESCE(v_tree_record.members, '[]'::jsonb)
    )
  );

  RETURN v_result;
END;
$$;
