CREATE OR REPLACE FUNCTION public.jwt_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    auth.jwt() -> 'app_metadata' ->> 'role',
    auth.jwt() ->> 'role',
    ''
  )
$$;

CREATE OR REPLACE FUNCTION public.current_business_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    NULLIF(auth.jwt() -> 'app_metadata' ->> 'business_id', '')::uuid,
    NULLIF(auth.jwt() ->> 'business_id', '')::uuid
  )
$$;

DROP POLICY IF EXISTS "Platform admins can view all profiles" ON profiles;
CREATE POLICY "Platform admins can view all profiles"
  ON profiles FOR SELECT
  USING (public.jwt_role() = 'platform-admin');

DROP POLICY IF EXISTS "staff can view referral participant profiles" ON profiles;
CREATE POLICY "staff can view referral participant profiles"
  ON profiles FOR SELECT
  USING (
    public.jwt_role() IN ('platform-admin', 'business-owner')
    AND EXISTS (
      SELECT 1
      FROM referrals r
      WHERE r.referrer_id = profiles.id
         OR r.referee_id = profiles.id
    )
  );
