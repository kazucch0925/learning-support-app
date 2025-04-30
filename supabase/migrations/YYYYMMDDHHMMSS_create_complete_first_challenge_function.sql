create or replace function public.complete_first_challenge()
returns json as $$
declare
  _user_id uuid := auth.uid();
  _today date := (current_timestamp AT TIME ZONE 'Asia/Tokyo')::date; -- 日本時間に変換
  _yesterday date := _today - interval '1 day';
  _last_completion_date date;
  _current_streak integer;
  _new_streak integer;
  _base_points integer := 5; -- Base points for completion
  _streak_bonus integer := 0;
  _total_earned_points integer;
  _already_completed boolean;
begin
  -- 日本時間でのデータ処理であることをログ出力（開発時のデバッグ用）
  -- raise notice 'Processing first challenge with JST date: %', _today;

  -- Check if the user has already completed the challenge today
  select exists(
    select 1
    from public.daily_challenge_completions
    where user_id = _user_id 
    and completion_date = _today 
    and challenge_type = 'first_challenge'
  ) into _already_completed;

  if _already_completed then
    -- 既に完了している場合でも、last_first_challenge_dateを今日に更新（修正）
    update public.users
    set last_first_challenge_date = _today
    where id = _user_id and last_first_challenge_date < _today;
    
    -- Return a message indicating it's already done
    return json_build_object(
      'success', false,
      'message', '今日のファーストチャレンジは既に完了しています。',
      'streak', (select first_challenge_streak_count from public.users where id = _user_id),
      'points_earned', 0
    );
  end if;

  -- Get the user's last completion date and current streak
  select 
    last_first_challenge_date, 
    first_challenge_streak_count 
  into 
    _last_completion_date, 
    _current_streak
  from public.users 
  where id = _user_id;

  -- Calculate the new streak
  if _last_completion_date = _yesterday then
    -- Continued streak
    _new_streak := _current_streak + 1;
  else
    -- Streak broken or first time
    _new_streak := 1;
  end if;

  -- Calculate streak bonus (example: +1 point per 3 streak days, max +10)
  _streak_bonus := least(floor(_new_streak / 3), 10);
  _total_earned_points := _base_points + _streak_bonus;

  -- Insert the completion record
  insert into public.daily_challenge_completions (user_id, completion_date, challenge_type, points_earned)
  values (_user_id, _today, 'first_challenge', _total_earned_points);

  -- Update the user's profile
  update public.users
  set 
    last_first_challenge_date = _today,
    first_challenge_streak_count = _new_streak,
    total_points = total_points + _total_earned_points
    -- Consider updating streak_days here too if it represents the general study streak
    -- streak_days = ... 
  where id = _user_id;

  -- Return success message with details
  return json_build_object(
    'success', true,
    'message', 'ファーストチャレンジ達成！' || _total_earned_points || 'ポイント獲得！',
    'streak', _new_streak,
    'points_earned', _total_earned_points
  );

exception
  when others then
    -- Log the error (optional, requires configuration)
    -- raise warning 'Error in complete_first_challenge for user %: %', _user_id, sqlerrm;
    return json_build_object(
      'success', false,
      'message', 'エラーが発生しました。再試行してください。',
      'streak', _current_streak, -- Return current streak on error
      'points_earned', 0
    );
end;
$$ language plpgsql security definer;

-- Grant execution permission to authenticated users
grant execute on function public.complete_first_challenge() to authenticated; 