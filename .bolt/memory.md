# Project memory

## Product intent & audience

- **Ibimina**: digital management app for Traditional Rwandan VSLA (Village Savings & Loan Association), locally called *Ikibina*.
- Target users: community & workplace savings groups in Rwanda, including non-smartphone members.
- Core cycle: members buy fixed shares (*Imigabane*) weekly/monthly, contribute to a social emergency fund (*Ingoboka*), take short-term loans (≤3× savings, 2% monthly interest), pay late fines (*Amande*), and receive annual share-out (*Kugabana*).
- Payments via MTN MoMo, Airtel Money, or cash.
- Bilingual: Kinyarwanda + English for receipts and reminders.

## Brand personality & voice

- Practical, trustworthy, community-oriented financial tool.
- Kinyarwanda domain terms used alongside English; messages formatted for local context (mobile money, SMS, WhatsApp).
- Clear and accessible to both smartphone and feature-phone users.

## Visual design & UX direction

- React + Vite + Tailwind CSS; Lucide React icons only.
- Tab-based navigation: Members, Ingoboka (social fund), Loans, Kugabana (share-out calculator).
- Member cards show shares, social fund, fines, and loan balance; loan cards show principal, accrued interest, remaining balance.
- Floating USSD Simulator widget (*800#) styled as feature-phone screen, corner-positioned.
- Print-friendly passbook statements via `@media print` for PDF export.
- Receipt/reminder modals offer WhatsApp send, SMS app open, or copy-to-clipboard.
- Import modules via `@/` path alias (maps to `src/`).

## Decisions, constraints & rationale

- Supabase backend for persistence; tables: members, savings, social_fund, loans, loan_repayments.
- Ingoboka tracked separately from regular share savings — balances never mix.
- Loan cap: 3× member savings; interest: 2% monthly; loans default to active status.
- Kugabana payout = member principal + proportional share of interest & fines pool − outstanding loan balance; interest/fines counted once.
- No external UI/icon packages beyond lucide-react.
- Starts empty; users add members first, then payments/loans flow from there.

## Open questions & assumptions

- Share price and contribution frequency (weekly vs monthly) assumed configurable per group.
- Currency assumed RWF (Rwandan Franc); not explicitly confirmed.
- USSD *800# is a simulation/demo, not connected to a real telecom gateway.
- No auth/multi-tenant isolation yet; single-group assumption.
- Loan interest compounding model (simple vs compound) inferred as simple monthly.