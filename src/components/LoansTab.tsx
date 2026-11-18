import { useState } from 'react';
import { Plus, MessageCircle, CheckCircle2, Trash2 } from 'lucide-react';
import { Card, Field, Modal, btnDanger, btnGhost, btnPrimary, inputCls } from './ui';
import { ReceiptModal } from './ReceiptModal';
import { RWF, DATE, loanInterest, loanTotal, memberTotals } from '../lib/calc';
import { LOAN_INTEREST_MONTHLY, LOAN_MULTIPLIER } from '../lib/types';
import type { Db, Loan, Member, PaymentMethod } from '../lib/types';
import type { ReceiptInput } from '../lib/receipt';

interface Props {
  db: Db;
  addLoan: (memberId: string, principal: number) => Promise<void>;
  markRepaid: (loan: Loan) => Promise<void>;
  addRepayment: (loanId: string, amount: number, method: PaymentMethod) => Promise<void>;
  deleteLoan: (id: string) => Promise<void>;
  reload: () => Promise<void>;
}

export function LoansTab({ db, addLoan, markRepaid, addRepayment, deleteLoan, reload }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [memberId, setMemberId] = useState('');
  const [principal, setPrincipal] = useState('');
  const [repay, setRepay] = useState<Loan | null>(null);
  const [repayAmount, setRepayAmount] = useState('');
  const [repayMethod, setRepayMethod] = useState<PaymentMethod>('cash');
  const [receipt, setReceipt] = useState<{ member: Member; input: ReceiptInput } | null>(null);

  const memberOf = (id: string) => db.members.find((m) => m.id === id);
  const totals = memberId ? memberTotals(db, memberOf(memberId)!) : null;
  const maxLoan = totals ? Math.max(0, (totals.shares - totals.activeLoans) * LOAN_MULTIPLIER) : 0;
  const activeLoans = db.loans.filter((l) => l.status === 'active');

  const submit = async () => {
    const amt = Number(principal);
    if (!memberId || !amt || amt <= 0) return;
    await addLoan(memberId, amt);
    setPrincipal('');
    setMemberId('');
    setShowAdd(false);
    await reload();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end print:hidden">
        <button onClick={() => setShowAdd(true)} className={btnPrimary + ' min-h-[48px]'}>
          <Plus size={16} />
          Give a loan
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {activeLoans.length === 0 && (
          <Card className="p-6 text-sm text-neutral-500 sm:col-span-2 lg:col-span-3">
            No active loans. Members can borrow up to {LOAN_MULTIPLIER}x what they have saved, and the cost is {LOAN_INTEREST_MONTHLY}% per month.
          </Card>
        )}
        {activeLoans.map((l) => {
          const m = memberOf(l.member_id);
          if (!m) return null;
          const interest = loanInterest(l);
          const paid = db.repayments.filter((r) => r.loan_id === l.id).reduce((s, r) => s + r.amount, 0);
          const balance = loanTotal(l) - paid;
          return (
            <Card key={l.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-neutral-900">{m.name}</p>
                  <p className="text-xs text-neutral-500">Issued {DATE(l.issued_at)} · {l.interest_rate}%/mo</p>
                </div>
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">Active</span>
              </div>
              <dl className="mt-3 space-y-1 text-xs">
                <div className="flex justify-between"><dt className="text-neutral-500">Amount given</dt><dd className="font-medium">{RWF(l.principal)}</dd></div>
                <div className="flex justify-between"><dt className="text-neutral-500">Loan cost so far</dt><dd className="font-medium">{RWF(interest)}</dd></div>
                <div className="flex justify-between"><dt className="text-neutral-500">Paid back</dt><dd className="font-medium text-emerald-700">{RWF(paid)}</dd></div>
                <div className="flex justify-between border-t border-neutral-100 pt-1">
                  <dt className="text-neutral-500 font-medium">Still owed</dt>
                  <dd className="font-bold text-neutral-900">{RWF(Math.max(0, balance))}</dd>
                </div>
              </dl>
              <div className="mt-3 flex flex-wrap gap-1.5 print:hidden">
                <button
                  onClick={() =>
                    setReceipt({ member: m, input: { kind: 'loan', dueDate: l.due_at ?? undefined } })
                  }
                  className="inline-flex items-center gap-1 rounded-md bg-green-600 px-2 py-1 text-[11px] text-white hover:bg-green-700"
                >
                  <MessageCircle size={12} />
                  Reminder
                </button>
                <button
                  onClick={() => {
                    setRepay(l);
                    setRepayAmount('');
                  }}
                  className={btnGhost + ' !px-2 !py-1 !text-[11px]'}
                >
                  Repay
                </button>
                <button
                  onClick={async () => {
                    await markRepaid(l);
                    await reload();
                  }}
                  className={btnGhost + ' !px-2 !py-1 !text-[11px]'}
                >
                  <CheckCircle2 size={12} />
                  Mark repaid
                </button>
                <button
                  onClick={async () => {
                    if (confirm('Delete this loan and its repayments?')) {
                      await deleteLoan(l.id);
                      await reload();
                    }
                  }}
                  className={btnDanger + ' !px-2 !py-1 !text-[11px]'}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      {showAdd && (
        <Modal title="Give a loan / Gutanga inguzi" onClose={() => setShowAdd(false)}>
          <div className="space-y-3">
            <Field label="Member">
              <select value={memberId} onChange={(e) => setMemberId(e.target.value)} className={inputCls}>
                <option value="">-- Select --</option>
                {db.members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </Field>
            {totals && (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                {m.name} has saved {RWF(totals.shares)} — they can borrow up to <strong>{RWF(maxLoan)}</strong>.
              </p>
            )}
            <Field label="How much are they borrowing? (RWF)">
              <input
                type="number"
                min="1"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                className={inputCls + ' min-h-[48px]'}
              />
            </Field>
            <p className="text-xs text-neutral-500">
              The loan grows by {LOAN_INTEREST_MONTHLY}% each month until it is fully repaid. "Available to borrow" is simply 3× what the member has saved.
            </p>
            <button
              onClick={submit}
              disabled={!memberId || !Number(principal) || (totals ? Number(principal) > maxLoan : false)}
              className={btnPrimary + ' min-h-[48px] w-full justify-center'}
            >
              Give the loan
            </button>
          </div>
        </Modal>
      )}

      {repay && (
        <Modal title="Record repayment" onClose={() => setRepay(null)}>
          <div className="space-y-3">
            <Field label="Amount (RWF)">
              <input type="number" min="1" value={repayAmount} onChange={(e) => setRepayAmount(e.target.value)} className={inputCls + ' min-h-[48px]'} />
            </Field>
            <Field label="How did they pay?">
              <select value={repayMethod} onChange={(e) => setRepayMethod(e.target.value as PaymentMethod)} className={inputCls + ' min-h-[48px]'}>
                <option value="cash">Cash</option>
                <option value="momo">MTN MoMo</option>
                <option value="airtel">Airtel Money</option>
              </select>
            </Field>
            <button
              onClick={async () => {
                const amt = Number(repayAmount);
                if (!amt || amt <= 0) return;
                await addRepayment(repay.id, amt, repayMethod);
                setRepay(null);
                await reload();
              }}
              className={btnPrimary + ' min-h-[48px] w-full justify-center'}
            >
              Save repayment
            </button>
          </div>
        </Modal>
      )}

      {receipt && <ReceiptModal db={db} member={receipt.member} input={receipt.input} onClose={() => setReceipt(null)} />}
    </div>
  );
}
