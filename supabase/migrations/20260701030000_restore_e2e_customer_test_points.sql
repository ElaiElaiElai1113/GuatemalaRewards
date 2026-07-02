insert into public.reward_balances (
  profile_id,
  points,
  next_reward_points,
  available_credits
)
values (
  '11111111-1111-1111-1111-111111111111',
  50000,
  1500,
  0
)
on conflict (profile_id) do update
set points = greatest(public.reward_balances.points, excluded.points),
    next_reward_points = excluded.next_reward_points,
    updated_at = now()
where exists (
  select 1
  from public.profiles
  where id = '11111111-1111-1111-1111-111111111111'
    and email = 'customer@Guatemala.test'
);
