import { Printer } from 'lucide-react';
import { DATE, RWF, methodLabel, memberTotals } from '../lib/calc';
import type { Db, Member } from '../lib/types';

/** Passbook statement — print-friendly via @media print styles. */
export function PassbookModal({ db, member, onClose }: { db: Db; member: Member; onClose: () => void }) {
  const t = memberTotals(db, member);
  const contribs = db.contributions
    .filter((c) => c.member_id === member.id)
    .sort((a, b) => a.paid_at.localeCompare(b.paid_at));
  const memberLoans = db.loans.filter((l) => l.member_id === member.id);

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-neutral-100 print:static print:overflow-visible print:bg-white">
      <div className="mx-auto max-w-2xl print:max-w-none">
        <div className="sticky top-0 flex items-center justify-between bg-white border-b border-neutral-200 px-5 py-3 print:hidden">
          <h3 className="font-semibold text-neutral-900">Passbook — {member.name}</h3>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-sm text-white hover:bg-emerald-800"
            >
              <Printer size={15} />
              Print / PDF
            </button>
            <button onClick={onClose} className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50">
              Close
            </button>
          </div>
        </div>

        <div id="passbook" className="bg-white p-6 print:p-0">
          <header className="text-center border-b-2 border-emerald-800 pb-4 mb-5">
            <h1 className="text-xl font-bold text-emerald-900">IBIMINA — IKIBINA CYACU</h1>
            <p className="text-xs text-neutral-500 mt-1">Savings & Credit Group Passbook · Rwanda</p>
          </header>

          <section className="grid grid-cols-2 gap-2 text-sm mb-5">
            <p><span className="text-neutral-500">Member:</span> <strong>{member.name}</strong></p>
            <p><span className="text-neutral-500">Phone:</span> {member.phone || '-'}</p>
            <p><span className="text-neutral-500">Joined:</span> {DATE(member.joined_at)}</p>
            <p><span className="text-neutral-500">Status:</span> {member.active ? 'Active' : 'Inactive'}</p>
          </section>

          <section className="grid grid-cols-4 gap-2 text-center text-xs mb-5">
            <div className="border rounded p-2">
              <p className="text-neutral-500">Shares</p>
              <p className="font-bold">{RWF(t.shares)}</p>
            </div>
            <div className="border rounded p-2">
              <p className="text-neutral-500">Social fund</p>
              <p className="font-bold">{RWF(t.social)}</p>
            </div>
            <div className="border rounded p-2">
              <p className="text-neutral-500">Fines</p>
              <p className="font-bold">{RWF(t.fines)}</p>
            </div>
            <div className="border rounded p-2">
              <p className="text-neutral-500">Loan balance</p>
              <p className="font-bold">{RWF(Math.max(0, t.loanBalance))}</p>
            </div>
          </section>

          <h2 className="font-semibold text-sm mb-2">Contributions / Ibyo yishyuye</h2>
          {contribs.length === 0 ? (
            <p className="text-xs text-neutral-500 mb-4">No contributions recorded.</p>
          ) : (
            <table className="w-full text-xs mb-5">
              <thead>
                <tr className="border-b text-left text-neutral-500">
                  <th className="py-1">Date</th>
                  <th>Type</th>
                  <th>Method</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {contribs.map((c) => (
                  <tr key={c.id} className="border-b border-neutral-100">
                    <td className="py-1">{DATE(c.paid_at)}</td>
                    <td>{c.type === 'share' ? 'Imigabane' : c.type === 'social' ? 'Ingoboka' : 'Amande'}</td>
                    <td>{methodLabel(c.method)}</td>
                    <td className="text-right">{RWF(c.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h2 className="font-semibold text-sm mb-2">Loans / Inguzi</h2>
          {memberLoans.length === 0 ? (
            <p className="text-xs text-neutral-500">No loans recorded.</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left text-neutral-500">
                  <th className="py-1">Issued</th>
                  <th className="text-right">Principal</th>
                  <th className="text-right">Rate/mo</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {memberLoans.map((l) => (
                  <tr key={l.id} className="border-b border-neutral-100">
                    <td className="py-1">{DATE(l.issued_at)}</td>
                    <td className="text-right">{RWF(l.principal)}</td>
                    <td className="text-right">{l.interest_rate}%</td>
                    <td>{l.status === 'active' ? 'Active' : 'Repaid'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <footer className="mt-6 pt-3 border-t text-center text-[10px] text-neutral-400 print:mt-10">
            Generated by Ibimina · {DATE(new Date().toISOString().slice(0, 10))}
          </footer>
        </div>
      </div>
    </div>
  );
}
