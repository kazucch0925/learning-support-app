-- Remove the old trigger that automatically added points on session insert
drop trigger if exists on_new_session_add_points on public.learning_sessions;

-- Optionally, we can also drop the old trigger function if it's no longer used elsewhere
-- drop function if exists public.handle_new_session_points();
-- However, let's keep the calculate_session_points function as the new RPC uses it. 