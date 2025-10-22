-- Add theme column to families table
-- This allows each family to have their own theme that persists across sessions

ALTER TABLE families 
ADD COLUMN IF NOT EXISTS theme VARCHAR(50) DEFAULT 'classic' NOT NULL;

-- Update existing families to have the default theme
UPDATE families SET theme = 'classic' WHERE theme IS NULL;

COMMENT ON COLUMN families.theme IS 'Theme selected by admin: classic, ocean, forest, royal, sunset, or slate';
