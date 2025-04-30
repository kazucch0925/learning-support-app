// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @ts-ignore
import { createClient } from 'npm:@supabase/supabase-js@2.39.8';
// @ts-ignore
import { formatInTimeZone } from 'npm:date-fns-tz@3.1.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      // @ts-ignore
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const nowUtc = new Date();
    const timeZone = 'Asia/Tokyo';

    const currentTimeJst = formatInTimeZone(nowUtc, timeZone, 'HH:mm');
    const nowInJst = new Date(formatInTimeZone(nowUtc, timeZone, "yyyy-MM-dd'T'HH:mm:ssXXX"));
    const currentDayOfWeekJst = nowInJst.getDay();

    const { data: reminders, error: remindersError } = await supabaseClient
      .from('reminders')
      .select(`
        *,
        goals (title),
        users (id, name)
      `)
      .eq('is_enabled', true)
      .eq('reminder_time', currentTimeJst)
      .contains('days_of_week', [currentDayOfWeekJst]);

    if (remindersError) throw remindersError;

    const { data: anchoringHabits, error: habitsError } = await supabaseClient
      .from('anchoring_habits')
      .select(`
        *,
        goals (title),
        users (id, name)
      `)
      .eq('trigger_time', currentTimeJst);

    if (habitsError) throw habitsError;

    const notifications = [
      ...(reminders?.map(reminder => ({
        user_id: reminder.user_id,
        title: '学習リマインダー',
        message: `「${reminder.goals.title}」の学習時間です！`,
        type: 'reminder',
        metadata: {
          goal_id: reminder.goal_id,
          reminder_id: reminder.id
        },
        created_at: new Date().toISOString()
      })) || []),

      ...(anchoringHabits?.map(habit => ({
        user_id: habit.user_id,
        title: '習慣アンカリング',
        message: `${habit.existing_habit}の後に「${habit.goals.title}」を学習する時間です！`,
        type: 'anchoring',
        metadata: {
          goal_id: habit.goal_id,
          habit_id: habit.id
        },
        created_at: new Date().toISOString()
      })) || [])
    ];

    if (notifications.length > 0) {
      const { error: notificationError } = await supabaseClient
        .from('notifications')
        .insert(notifications);

      if (notificationError) throw notificationError;
    }

    return new Response(
      JSON.stringify({ 
        processed: {
          reminders: reminders?.length || 0,
          habits: anchoringHabits?.length || 0
        },
        notifications: notifications.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});