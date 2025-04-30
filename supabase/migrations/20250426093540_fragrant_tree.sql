/*
  # Update goals table for multiple categories

  1. Changes
    - Add categories array column to goals table
    - Migrate existing category data to categories array
    - Drop old category column

  2. Security
    - Maintain existing RLS policies
*/

-- Add new categories array column
ALTER TABLE goals
ADD COLUMN categories text[] DEFAULT '{}';

-- Migrate existing category data to categories array
UPDATE goals
SET categories = ARRAY[category]
WHERE category IS NOT NULL;

-- Drop old category column
ALTER TABLE goals
DROP COLUMN category;