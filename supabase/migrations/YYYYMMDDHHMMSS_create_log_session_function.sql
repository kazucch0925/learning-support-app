create or replace function public.log_learning_session_and_get_points(
  _goal_id uuid,
  _added_duration integer, -- Duration added in this session
  _final_total_duration integer, -- Total duration after this session for the goal today
  _notes text default ''
)
returns json as $$
declare
  _user_id uuid := auth.uid();
  _today date := current_date;
  _yesterday date := _today - interval '1 day';
  _current_goal record;
  _last_completed_date date;
  _current_streak integer;
  _new_streak integer;
  _new_max_streak integer;
  _points_to_add integer := 0;
  _new_session_id uuid;
begin
  -- Ensure added duration is positive
  if _added_duration <= 0 then
    return json_build_object('success', false, 'message', '追加された学習時間は0より大きい必要があります。', 'points_earned', 0, 'streak', 0);
  end if;

  -- Get the current state of the goal
  select * into _current_goal
  from public.goals
  where id = _goal_id and user_id = _user_id;

  if not found then
    return json_build_object('success', false, 'message', '目標が見つかりません。', 'points_earned', 0, 'streak', 0);
  end if;

  -- Insert the new learning session
  insert into public.learning_sessions (goal_id, user_id, duration, notes)
  values (_goal_id, _user_id, _added_duration, _notes)
  returning id into _new_session_id;

  -- Calculate streak
  _last_completed_date := (_current_goal.last_completed_at::timestamptz at time zone 'utc')::date;
  _current_streak := _current_goal.streak_days;
  _new_max_streak := _current_goal.max_streak_days;

  if _last_completed_date = _today then
      _new_streak := _current_streak; -- Already completed today, streak doesn't change today
  elsif _last_completed_date = _yesterday then
      _new_streak := _current_streak + 1; -- Continued streak
  else
      _new_streak := 1; -- Streak broken or first time
  end if;

  -- Update max streak if needed
  if _new_streak > _new_max_streak then
    _new_max_streak := _new_streak;
  end if;

  -- Update the goal table
  update public.goals
  set 
    last_completed_at = now(), -- Use now() for timestamp
    streak_days = _new_streak,
    current_minutes_per_day = _final_total_duration, -- Update with the final total duration
    max_streak_days = _new_max_streak
  where id = _goal_id;

  -- Calculate points using the existing function
  _points_to_add := calculate_session_points(_added_duration, _new_streak);

  -- Update user's total points
  if _points_to_add > 0 then
    update public.users
    set total_points = total_points + _points_to_add
    where id = _user_id;
  end if;

  -- Return success with points earned and new streak
  return json_build_object(
    'success', true, 
    'message', '学習セッションを記録しました。', 
    'points_earned', _points_to_add,
    'streak', _new_streak
  );

exception
  when others then
    -- Log the error (optional)
    -- raise warning 'Error in log_learning_session_and_get_points for user %: %', _user_id, sqlerrm;
    return json_build_object(
      'success', false,
      'message', 'セッション記録中にエラーが発生しました: ' || sqlerrm,
      'points_earned', 0,
      'streak', _current_goal.streak_days -- Return original streak on error
    );
end;
$$ language plpgsql security definer;

-- Grant execution permission
grant execute on function public.log_learning_session_and_get_points(uuid, integer, integer, text) to authenticated; 