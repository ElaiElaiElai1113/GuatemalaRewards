CREATE OR REPLACE FUNCTION public.get_staff_referrals(target_business_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  referrer_id uuid,
  referee_id uuid,
  business_id uuid,
  status text,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz,
  referrer_full_name text,
  referrer_email text,
  referee_full_name text,
  referee_email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requester_role text;
  requester_business_id uuid;
BEGIN
  SELECT p.role::text, p.business_id
    INTO requester_role, requester_business_id
  FROM public.profiles p
  WHERE p.id = auth.uid();

  IF requester_role NOT IN ('platform-admin', 'business-owner') THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  RETURN QUERY
  SELECT
    r.id,
    r.referrer_id,
    r.referee_id,
    r.business_id,
    r.status,
    r.approved_by,
    r.approved_at,
    r.created_at,
    referrer.full_name AS referrer_full_name,
    referrer.email AS referrer_email,
    referee.full_name AS referee_full_name,
    referee.email AS referee_email
  FROM public.referrals r
  JOIN public.profiles referrer ON referrer.id = r.referrer_id
  JOIN public.profiles referee ON referee.id = r.referee_id
  WHERE
    requester_role = 'platform-admin'
    OR r.business_id = COALESCE(target_business_id, requester_business_id);
END;
$$;
