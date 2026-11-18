import { AlertTriangle, Users, Wallet, PiggyBank, Landmark, HandCoins } from 'lucide-react';
import { Card, StatCard } from './ui';
import { RWF, memberTotals, socialFundBalance } from '../lib/calc';
import type { Db } from '../lib/types';

export function DashboardTab({ db, goTo }: { db: Db; goTo: (tab: 'members' | 'loans' | 'social' | 'shareout') => void }) {
  const totals = db.members.map((m) => memberTotals(db, m));
  const shares = totals.reduce((s, t) => s + t.shares, 0);
  const fines = totals.reduce((s, t) => s + t.fines, 0);
  const social = socialFundBalance(db);
  const activeLoans = db.loans.filter((l) => l.status === 'active');
  const loanPrincipal = activeLoans.reduce((s, l) => s + l.principal, 0);
  const repaid = db.repayments.reduce((s, r) => s + r.amount, 0);
  const allLoanPrincipal = db.loans.reduce((s, l) => s + l.principal, 0);
  const cashBox = shares + social + fines + repaid - allLoanPrincipal;
  const borrowers = new Set(activeLoans.map((l) => l.member_id)).size;

  const topBorrowers = totals
    .filter((t) => t.loanBalance > 0)
    .sort((a, b) => b.loanBalance - a.loanBalance)
    .slice(0, 5);

  const recent = [
    ...db.contributions.map((c) => ({
      date: c.paid_at,
      label: db.members.find((m) => m.id === c.member_id)?.name ?? '—',
      type:
        c.type === 'share'
          ? 'Imigabane'
          : c.type === 'social'
            ? 'Ingoboka'
            : 'Amande',
      amount: c.amount,
    })),
    ...db.socialFundEvents.map((e) => ({
      date: e.event_date,
      label: db.members.find((m) => m.id === e.member_id)?.name ?? 'Group',
      type: e.type === 'contribution' ? 'Ingoboka in' : 'Ingoboka payout',
      amount: e.type === 'contribution' ? e.amount : -e.amount,
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);

  return (
    <div className="space-y-4">
      {db.members.length === 0 && (
        <Card className="border-emerald-200 bg-emerald-50 p-5">
          <h2 className="text-base font-semibold text-emerald-900">Murakaza neza! Welcome to Ibimina</h2>
          <p className="mt-1 text-sm text-emerald-800">
            Your group ledger is empty. Start here:
          </p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-emerald-900">
            <li>Add your members under <strong>Abanyamuryango · Members</strong></li>
            <li>Record their weekly or monthly share payments (Imigabane)</li>
            <li>Give loans (Inguzi) up to 3× what each member has saved</li>
            <li>Use Kugabana at the end of the year to share out everything</li>
          </ol>
          <button
            onClick={() => goTo('members')}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
          >
            <Users size={15} />
            Add your first member
          </button>
        </Card>
      )}

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard label="Cash box / Icyobo" value={RWF(cashBox)} sub="Cash + MoMo − loans out" />
        <StatCard label="Imigabane savings" value={RWF(shares)} sub={`${db.members.length} members`} />
        <StatCard label="Loans outstanding" value={RWF(loanPrincipal)} sub={`${borrowers} borrowing`} />
        <StatCard label="Ingoboka fund" value={RWF(social)} sub="Emergency social fund" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="flex items-center gap-2 font-semibold text-neutral-900 text-sm">
            <AlertTriangle size={15} className="text-amber-600" />
            Top loan balances
          </h3>
          {topBorrowers.length === 0 ? (
            <p className="mt-3 text-xs text-neutral-500">No outstanding loans — uburambe amahoro!</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {topBorrowers.map((t) => (
                <li key={t.member.id} className="flex items-center justify-between text-sm">
                  <span className="text-neutral-700">{t.member.name}</span>
                  <span className="font-medium text-red-600">{RWF(t.loanBalance)}</span>
                </li>
              ))}
            </ul>
          )}
          <button onClick={() => goTo('loans')} className="mt-3 text-xs font-medium text-emerald-700 hover:underline">
            Go to loans →
          </button>
        </Card>

        <Card className="p-4">
          <h3 className="flex items-center gap-2 font-semibold text-neutral-900 text-sm">
            <Wallet size={15} className="text-emerald-700" />
            Recent activity
          </h3>
          {recent.length === 0 ? (
            <p className="mt-3 text-xs text-neutral-500">No payments recorded yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-neutral-100">
              {recent.map((r, i) => (
                <li key={i} className="flex items-center justify-between py-1.5 text-sm">
                  <div>
                    <p className="text-neutral-800">{r.label}</p>
                    <p className="text-[11px] text-neutral-500">
                      {r.type} · {r.date}
                    </p>
                  </div>
                  <span className={`font-medium ${r.amount < 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {r.amount < 0 ? '−' : '+'}
                    {RWF(Math.abs(r.amount))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 print:hidden">
        <QuickLink icon={Users} label="Add member / payment" onClick={() => goTo('members')} />
        <QuickLink icon={Landmark} label="Issue a loan" onClick={() => goTo('loans')} />
        <QuickLink icon={PiggyBank} label="Log Ingoboka event" onClick={() => goTo('social')} />
        <QuickLink icon={HandCoins} label="Kugabana share-out" onClick={() => goTo('shareout')} />
      </div>
    </div>
  );
}

function QuickLink({ icon: Icon, label, onClick }: { icon: typeof Users; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white p-3 text-left text-xs font-medium text-neutral-700 shadow-sm hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
    >
      <Icon size={16} className="text-emerald-700 shrink-0" />
      {label}
    </button>
  );
}
