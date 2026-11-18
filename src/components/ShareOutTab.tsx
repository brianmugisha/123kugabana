import { useState } from 'react';
import { Calculator, Printer } from 'lucide-react';
import { Card, StatCard, btnGhost, btnPrimary, inputCls } from './ui';
import { RWF, shareOut } from '../lib/calc';
import type { Db } from '../lib/types';

export function ShareOutTab({ db }: { db: Db }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const result = shareOut(db);
  const { rows, pool, payoutTotal } = result;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Pool to share out" value={RWF(pool)} sub="Interest + fines (Kugabana)" />
        <StatCard label="Total payouts" value={RWF(payoutTotal)} sub={`Share-out date: ${date}`} />
        <StatCard label="Members" value={String(db.members.length)} />
      </div>

      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <label className="text-xs text-neutral-500">Share-out date:</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls + ' !w-auto'} />
        <button onClick={() => window.print()} className={btnPrimary}>
          <Printer size={15} />
          Print / PDF
        </button>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-2.5">Member</th>
              <th className="text-right">Imigabane</th>
              <th className="text-right">Pool share</th>
              <th className="text-right">Loan due</th>
              <th className="text-right">Final payout</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-neutral-500">
                  Add members and record Imigabane contributions to calculate the annual share-out.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.member.id} className="border-t border-neutral-100">
                <td className="px-4 py-2.5 font-medium">{r.member.name}</td>
                <td className="text-right">{RWF(r.shares)}</td>
                <td className="text-right text-emerald-700">+{RWF(r.poolShare)}</td>
                <td className="text-right text-red-600">{r.loanBalance > 0 ? `−${RWF(r.loanBalance)}` : '—'}</td>
                <td className="px-4 py-2.5 text-right font-bold text-neutral-900">{RWF(r.payout)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-neutral-200 font-bold">
              <td className="px-4 py-2.5">Total</td>
              <td className="text-right">{RWF(rows.reduce((s, r) => s + r.shares, 0))}</td>
              <td className="text-right text-emerald-700">+{RWF(pool)}</td>
              <td />
              <td className="px-4 py-2.5 text-right">{RWF(payoutTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </Card>

      <p className="flex items-start gap-2 text-xs text-neutral-500 print:hidden">
        <Calculator size={14} className="mt-0.5 shrink-0" />
        Each member receives their own Imigabane savings back, plus a proportional share of the year's
        loan interest and Amande fines pool (based on share of total savings), minus any outstanding loan balance.
      </p>
    </div>
  );
}
