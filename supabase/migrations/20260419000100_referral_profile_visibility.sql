CREATE POLICY "staff can view referral participant profiles"
  ON profiles FOR SELECT
  USING (
    public.has_staff_access()
    AND EXISTS (
      SELECT 1
      FROM referrals r
      WHERE r.referrer_id = profiles.id
         OR r.referee_id = profiles.id
    )
  );
