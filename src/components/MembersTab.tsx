import { useEffect, useRef, useState } from 'react';
import { BookOpen, Check, MessageCircle, Plus, RotateCcw, Target, Trash2, Zap } from 'lucide-react';
import { Card, Field, Modal, btnDanger, btnGhost, btnPrimary, inputCls } from './ui';
import { ReceiptModal } from './ReceiptModal';
import { PassbookModal } from './PassbookModal';
import { RWF, memberTotals } from '../lib/calc';
import { SHARE_PRICE } from '../lib/types';
import type { Db, Member, PaymentMethod } from '../lib/types';
import type { ReceiptInput } from '../lib/receipt';

interface Props {
  db: Db;
  addMember: (name: string, phone: string) => Promise<void>;
  addContribution: (
    memberId: string,
    type: 'share' | 'social' | 'fine',
    amount: number,
    method: PaymentMethod,
    note: string,
  ) => Promise<string | null>;
  deleteContribution: (id: string) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  reload: () => Promise<void>;
}

interface UndoState {
  contribId: string;
  memberName: string;
  label: string;
}

/** Rough "on-time streak": consecutive months (counting back from this month)
 *  in which the member paid at least one Imigabane share, stopping at the
 *  first month they paid nothing (or before they joined). */
function onTimeStreak(db: Db, memberId: string): number {
  const paid = new Set(
    db.contributions
      .filter((c) => c.member_id === memberId && c.type === 'share')
      .map((c) => c.paid_at.slice(0, 7)),
  );
  const joined = new Date(db.members.find((m) => m.id === memberId)?.joined_at + 'T00:00:00');
  const now = new Date();
  let streak = 0;
  const cursor = new Date(now.getFullYear(), now.getMonth(), 1);
  for (; cursor >= joined; cursor.setMonth(cursor.getMonth() - 1)) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
    if (paid.has(key)) streak++;
  }
  return streak;
}

export function MembersTab({ db, addMember, addContribution, deleteContribution, deleteMember, reload }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [receipt, setReceipt] = useState<{ member: Member; input: ReceiptInput } | null>(null);
  const [passbook, setPassbook] = useState<Member | null>(null);
  const [contrib, setContrib] = useState<Member | null>(null);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'share' | 'social' | 'fine'>('share');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [busy, setBusy] = useState<string | null>(null);
  const [undo, setUndo] = useState<UndoState | null>(null);
  const undoTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (undoTimer.current) window.clearTimeout(undoTimer.current);
    },
    [],
  );

  const quickPay = async (m: Member, kind: 'share' | 'social') => {
    setBusy(m.id + kind);
    const contribId = await addContribution(m.id, kind, SHARE_PRICE, 'cash', '');
    setBusy(null);
    if (contribId) {
      if (undoTimer.current) window.clearTimeout(undoTimer.current);
      setUndo({
        contribId,
        memberName: m.name,
        label: kind === 'share' ? 'Imigabane share' : 'Ingoboka contribution',
      });
      undoTimer.current = window.setTimeout(() => setUndo(null), 5000);
    }
  };

  const undoLast = async () => {
    if (undoTimer.current) window.clearTimeout(undoTimer.current);
    const u = undo;
    setUndo(null);
    if (u) {
      await deleteContribution(u.contribId);
      await reload();
    }
  };

  const submitMember = async () => {
    if (!name.trim()) return;
    await addMember(name.trim(), phone.trim());
    setName('');
    setPhone('');
    setShowAdd(false);
  };

  const submitContribution = async () => {
    const amt = Number(amount);
    if (!contrib || !amt || amt <= 0) return;
    await addContribution(contrib.id, type, amt, method, '');
    setContrib(null);
    setAmount('');
  };

  return (
    <div className="space-y-4">
      {undo && (
        <div className="fixed bottom-24 left-1/2 z-50 flex w-[92%] max-w-sm -translate-x-1/2 items-center gap-3 rounded-xl bg-neutral-900 px-4 py-3 text-sm text-white shadow-lg print:hidden">
          <Check size={16} className="shrink-0 text-emerald-400" />
          <span className="flex-1">
            {undo.label} saved for <strong>{undo.memberName}</strong>
          </span>
          <button
            onClick={undoLast}
            className="inline-flex min-h-[36px] items-center gap-1 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-medium hover:bg-white/25"
          >
            <RotateCcw size={13} />
            Undo
          </button>
        </div>
      )}

      <div className="flex justify-end print:hidden">
        <button onClick={() => setShowAdd(true)} className={btnPrimary + ' min-h-[48px]'}>
          <Plus size={16} />
          Add member
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {db.members.length === 0 && (
          <Card className="p-6 text-sm text-neutral-500 sm:col-span-2 lg:col-span-3">
            No members yet. Add your first Ikibina member to start recording Imigabane shares.
          </Card>
        )}
        {db.members.map((m) => {
          const t = memberTotals(db, m);
          const streak = onTimeStreak(db, m.id);
          const goal = 50000;
          const pct = Math.min(100, Math.round((t.shares / goal) * 100));
          return (
            <Card key={m.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-neutral-900">{m.name}</p>
                  <p className="text-xs text-neutral-500">{m.phone || 'No phone'}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {streak >= 2 && (
                    <span
                      className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700"
                      title={`Paid on time for ${streak} months in a row`}
                    >
                      {streak} mo on time
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      m.active ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-500'
                    }`}
                  >
                    {m.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                <div className="flex justify-between"><dt className="text-neutral-500">Imigabane</dt><dd className="font-medium">{RWF(t.shares)}</dd></div>
                <div className="flex justify-between"><dt className="text-neutral-500">Ingoboka</dt><dd className="font-medium">{RWF(t.social)}</dd></div>
                <div className="flex justify-between"><dt className="text-neutral-500">Amande</dt><dd className="font-medium text-red-600">{RWF(t.fines)}</dd></div>
                <div className="flex justify-between"><dt className="text-neutral-500">Loan left</dt><dd className="font-medium">{RWF(Math.max(0, t.loanBalance))}</dd></div>
              </dl>
              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] text-neutral-500">
                  <span className="inline-flex items-center gap-1">
                    <Target size={11} />
                    Savings goal
                  </span>
                  <span>{pct}% of {RWF(goal)}</span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="h-full rounded-full bg-emerald-600 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-1.5 print:hidden">
                <button
                  onClick={() => quickPay(m, 'share')}
                  disabled={busy !== null}
                  className="inline-flex min-h-[48px] items-center justify-center gap-1 rounded-lg bg-emerald-700 px-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                >
                  <Plus size={14} />
                  +1 Share ({RWF(SHARE_PRICE)})
                </button>
                <button
                  onClick={() => quickPay(m, 'social')}
                  disabled={busy !== null}
                  className="inline-flex min-h-[48px] items-center justify-center gap-1 rounded-lg bg-rose-600 px-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  <Zap size={14} />
                  +Ingoboka ({RWF(SHARE_PRICE)})
                </button>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5 print:hidden">
                <button
                  onClick={() => setReceipt({ member: m, input: { kind: 'savings' } })}
                  className="inline-flex min-h-[36px] items-center gap-1 rounded-md bg-green-600 px-2 py-1 text-[11px] text-white hover:bg-green-700"
                  title="Send WhatsApp / copy SMS receipt"
                >
                  <MessageCircle size={12} />
                  Receipt
                </button>
                <button onClick={() => setPassbook(m)} className={btnGhost + ' min-h-[36px] !px-2 !py-1 !text-[11px]'}>
                  <BookOpen size={12} />
                  Passbook
                </button>
                <button
                  onClick={() => {
                    setContrib(m);
                    setType('share');
                  }}
                  className={btnGhost + ' min-h-[36px] !px-2 !py-1 !text-[11px]'}
                >
                  <Plus size={12} />
                  Other amount
                </button>
                <button
                  onClick={async () => {
                    if (confirm(`Remove ${m.name}? Their contribution history will also be removed.`)) {
                      await deleteMember(m.id);
                      await reload();
                    }
                  }}
                  className={btnDanger + ' min-h-[36px] !px-2 !py-1 !text-[11px]'}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      {showAdd && (
        <Modal title="Add member / Ongeraho umunyamuryango" onClose={() => setShowAdd(false)}>
          <div className="space-y-3">
            <Field label="Name / Izina">
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls + ' min-h-[48px]'} placeholder="e.g. Alice Mukamana" />
            </Field>
            <Field label="Phone (MTN MoMo / Airtel)">
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls + ' min-h-[48px]'} placeholder="e.g. 0788 123 456" />
            </Field>
            <button onClick={submitMember} className={btnPrimary + ' min-h-[48px] w-full justify-center'}>
              Save member
            </button>
          </div>
        </Modal>
      )}

      {contrib && (
        <Modal title={`Record payment — ${contrib.name}`} onClose={() => setContrib(null)}>
          <div className="space-y-3">
            <Field label="What is this payment for?">
              <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className={inputCls + ' min-h-[48px]'}>
                <option value="share">Imigabane (share savings)</option>
                <option value="social">Ingoboka (emergency fund)</option>
                <option value="fine">Amande (late fine)</option>
              </select>
            </Field>
            <Field label="Amount (RWF)">
              <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls + ' min-h-[48px]'} />
            </Field>
            <Field label="How did they pay?">
              <select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} className={inputCls + ' min-h-[48px]'}>
                <option value="cash">Cash</option>
                <option value="momo">MTN MoMo</option>
                <option value="airtel">Airtel Money</option>
              </select>
            </Field>
            <button onClick={submitContribution} className={btnPrimary + ' min-h-[48px] w-full justify-center'}>
              Save payment
            </button>
          </div>
        </Modal>
      )}

      {receipt && (
        <ReceiptModal db={db} member={receipt.member} input={receipt.input} onClose={() => setReceipt(null)} />
      )}
      {passbook && <PassbookModal db={db} member={passbook} onClose={() => setPassbook(null)} />}
    </div>
  );
}
