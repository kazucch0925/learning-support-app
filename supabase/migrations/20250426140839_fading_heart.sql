/*
  # Update user creation process

  1. Changes
    - Drop existing trigger and function
    - Create new trigger function with proper error handling
    - Recreate trigger with updated function
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create new trigger function with proper error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, name, streak_days, total_points)
  VALUES (
    NEW.id,
    COALESCE(
      (NEW.raw_user_meta_data->>'name')::text,
      split_part(NEW.email, '@', 1)
    ),
    0,
    0
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();