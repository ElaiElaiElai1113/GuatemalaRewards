create policy "Staff can update reward balances"
  on public.reward_balances for update
  using (public.has_staff_access())
  with check (public.has_staff_access());
