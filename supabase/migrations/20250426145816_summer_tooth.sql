/*
  # Add cron job for checking reminders

  1. Changes
    - Enable pg_cron extension
    - Create cron job to invoke check-reminders function every minute
*/

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create cron job for checking reminders
SELECT cron.schedule(
  'check-reminders',  -- unique job name
  '* * * * *',       -- every minute
  $$
  SELECT
    net.http_post(
      url := current_setting('app.settings.supabase_functions_url') || '/check-reminders',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key'),
        'Content-Type', 'application/json'
      ),
      body := '{}'
    ) as request_id;
  $$
);