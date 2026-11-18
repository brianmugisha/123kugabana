import type { Contribution, Db, Loan, Member } from './types';

export const RWF = (n: number) =>
  new Intl.NumberFormat('rw-RW', { maximumFractionDigits: 0 }).format(Math.round(n)) + ' RWF';

export const DATE = (iso: string) => {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export interface MemberTotals {
  member: Member;
  shares: number; // Imigabane total
  social: number; // Ingoboka contributions via contribution rows
  fines: number; // Amande
  total: number;
  activeLoans: number; // outstanding principal
  interestDue: number;
  repayments: number;
  loanBalance: number;
}

export function memberTotals(db: Db, member: Member): MemberTotals {
  const contribs = db.contributions.filter((c) => c.member_id === member.id);
  const shares = contribs.filter((c) => c.type === 'share').reduce((s, c) => s + c.amount, 0);
  const social = contribs.filter((c) => c.type === 'social').reduce((s, c) => s + c.amount, 0);
  const fines = contribs.filter((c) => c.type === 'fine').reduce((s, c) => s + c.amount, 0);
  const memberLoans = db.loans.filter((l) => l.member_id === member.id);
  const activeLoans = memberLoans.filter((l) => l.status === 'active');
  const activePrincipal = activeLoans.reduce((s, l) => s + l.principal, 0);
  const interestDue = activeLoans.reduce((s, l) => s + loanInterest(l), 0);
  const loanIds = new Set(memberLoans.map((l) => l.id));
  const repayments = db.repayments
    .filter((r) => loanIds.has(r.loan_id))
    .reduce((s, r) => s + r.amount, 0);
  return {
    member,
    shares,
    social,
    fines,
    total: shares + social + fines,
    activeLoans: activePrincipal,
    interestDue,
    repayments,
    loanBalance: activePrincipal + interestDue - repayments,
  };
}

export function loanInterest(loan: Loan): number {
  const issued = new Date(loan.issued_at + 'T00:00:00');
  const now = new Date();
  const months = Math.max(
    0,
    (now.getFullYear() - issued.getFullYear()) * 12 + (now.getMonth() - issued.getMonth()),
  );
  return Math.round(loan.principal * (loan.interest_rate / 100) * months);
}

export function loanTotal(loan: Loan): number {
  return loan.principal + loanInterest(loan);
}

/** Annual share-out (Kugabana): each member gets back their own savings plus
 *  a proportional share of pooled interest and fines, based on their share
 *  of total group savings. */
export interface ShareOutResult extends MemberTotals {
  poolShare: number; // proportional share of interest + fines pool
  payout: number; // savings + poolShare - outstanding loan balance
}

export function shareOut(db: Db): { rows: ShareOutResult[]; pool: number; payoutTotal: number } {
  const totals = db.members.map((m) => memberTotals(db, m));
  const totalShares = totals.reduce((s, t) => s + t.shares, 0) || 1;
  const loanInterestEarned = db.loans.reduce(
    (s, l) => s + (db.repayments.filter((r) => r.loan_id === l.id).reduce((p, r) => p + r.amount, 0) - l.principal),
    0,
  );
  const fines = totals.reduce((s, t) => s + t.fines, 0);
  const pool = Math.max(0, loanInterestEarned) + fines;
  const rows = totals.map((t) => {
    const poolShare = (t.shares / totalShares) * pool;
    const payout = Math.max(0, t.shares + poolShare - Math.max(0, t.loanBalance));
    return { ...t, poolShare, payout };
  });
  return { rows, pool, payoutTotal: rows.reduce((s, r) => s + r.payout, 0) };
}

export function socialFundBalance(db: Db): number {
  const fromEvents = db.socialFundEvents.reduce(
    (s, e) => s + (e.type === 'contribution' ? e.amount : -e.amount),
    0,
  );
  const fromContribs = db.contributions
    .filter((c) => c.type === 'social')
    .reduce((s, c) => s + c.amount, 0);
  return fromEvents + fromContribs;
}

export function methodLabel(m: string): string {
  if (m === 'momo') return 'MTN MoMo';
  if (m === 'airtel') return 'Airtel Money';
  return 'Cash';
}
