CREATE TABLE referrals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referee_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id),
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','approved','rejected')),
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT no_self_referral CHECK (referrer_id <> referee_id),
  CONSTRAINT one_referral_per_referee UNIQUE (referee_id)
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "business owners read referrals" ON referrals FOR SELECT USING (true);
CREATE POLICY "authenticated insert referrals" ON referrals FOR INSERT WITH CHECK (auth.uid() = referee_id);
CREATE POLICY "business owners update referrals" ON referrals FOR UPDATE USING (true);
