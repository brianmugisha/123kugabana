/*
# Ibimina VSLA (Ikibina) schema

1. New Tables
- `members`: group members (name, phone, join date, active flag). No auth — single-tenant group ledger.
- `share_contributions`: fixed weekly/monthly share purchases (Imigabane), plus per-row social fund contributions (Ingoboka) and fines (Amande). Type column distinguishes them.
- `social_fund_events`: separate ledger for the social emergency fund (Ingoboka) — contributions and payouts to members in emergency.
- `loans`: short-term loans (amount, 2% monthly interest, issue date, status, due date).
- `loan_repayments`: payments against a loan.

2. Column details
- members: id, name, phone (MTN MoMo / Airtel Money number), joined_at, active.
- share_contributions: member_id FK, type ('share'|'social'|'fine'), amount, method ('momo'|'airtel'|'cash'), note, paid_at.
- social_fund_events: member_id FK nullable (payouts may be group-level), type ('contribution'|'payout'), amount, reason, event_date.
- loans: member_id FK, principal, interest_rate (default 2 = 2% monthly), status ('active'|'repaid'), issued_at, due_at.
- loan_repayments: loan_id FK, amount, method, paid_at.

3. Security
- RLS enabled on all tables.
- This is a single-tenant group tool with no sign-in, so policies allow anon + authenticated CRUD (intentionally shared data).
- Grants limited to the roles above with only the verbs the app uses.
*/

CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL DEFAULT '',
  joined_at date NOT NULL DEFAULT CURRENT_DATE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS share_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'share' CHECK (type IN ('share','social','fine')),
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  method text NOT NULL DEFAULT 'cash' CHECK (method IN ('momo','airtel','cash')),
  note text NOT NULL DEFAULT '',
  paid_at date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS social_fund_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('contribution','payout')),
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  reason text NOT NULL DEFAULT '',
  event_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  principal numeric(12,2) NOT NULL CHECK (principal > 0),
  interest_rate numeric(5,2) NOT NULL DEFAULT 2.00,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','repaid')),
  issued_at date NOT NULL DEFAULT CURRENT_DATE,
  due_at date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS loan_repayments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  method text NOT NULL DEFAULT 'cash' CHECK (method IN ('momo','airtel','cash')),
  paid_at date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_share_contrib_member ON share_contributions(member_id);
CREATE INDEX IF NOT EXISTS idx_loans_member ON loans(member_id);
CREATE INDEX IF NOT EXISTS idx_loan_repay_loan ON loan_repayments(loan_id);

ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_fund_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_repayments ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON members TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON share_contributions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON social_fund_events TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON loans TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON loan_repayments TO anon, authenticated;

DROP POLICY IF EXISTS "members_public" ON members;
CREATE POLICY "members_public" ON members FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "members_public_insert" ON members;
CREATE POLICY "members_public_insert" ON members FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "members_public_update" ON members;
CREATE POLICY "members_public_update" ON members FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "members_public_delete" ON members;
CREATE POLICY "members_public_delete" ON members FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "contrib_public" ON share_contributions;
CREATE POLICY "contrib_public" ON share_contributions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "contrib_public_insert" ON share_contributions;
CREATE POLICY "contrib_public_insert" ON share_contributions FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "contrib_public_update" ON share_contributions;
CREATE POLICY "contrib_public_update" ON share_contributions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "contrib_public_delete" ON share_contributions;
CREATE POLICY "contrib_public_delete" ON share_contributions FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "socfund_public" ON social_fund_events;
CREATE POLICY "socfund_public" ON social_fund_events FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "socfund_public_insert" ON social_fund_events;
CREATE POLICY "socfund_public_insert" ON social_fund_events FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "socfund_public_update" ON social_fund_events;
CREATE POLICY "socfund_public_update" ON social_fund_events FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "socfund_public_delete" ON social_fund_events;
CREATE POLICY "socfund_public_delete" ON social_fund_events FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "loans_public" ON loans;
CREATE POLICY "loans_public" ON loans FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "loans_public_insert" ON loans;
CREATE POLICY "loans_public_insert" ON loans FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "loans_public_update" ON loans;
CREATE POLICY "loans_public_update" ON loans FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "loans_public_delete" ON loans;
CREATE POLICY "loans_public_delete" ON loans FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "loanrepay_public" ON loan_repayments;
CREATE POLICY "loanrepay_public" ON loan_repayments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "loanrepay_public_insert" ON loan_repayments;
CREATE POLICY "loanrepay_public_insert" ON loan_repayments FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "loanrepay_public_update" ON loan_repayments;
CREATE POLICY "loanrepay_public_update" ON loan_repayments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "loanrepay_public_delete" ON loan_repayments;
CREATE POLICY "loanrepay_public_delete" ON loan_repayments FOR DELETE TO anon, authenticated USING (true);
