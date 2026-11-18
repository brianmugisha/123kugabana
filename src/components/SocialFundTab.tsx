import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card, Field, Modal, StatCard, btnDanger, btnPrimary, inputCls } from './ui';
import { RWF, DATE, socialFundBalance, methodLabel } from '../lib/calc';
import type { Db, SocialFundEvent } from '../lib/types';

interface Props {
  db: Db;
  addSocialEvent: (ev: Omit<SocialFundEvent, 'id'>) => Promise<void>;
  deleteSocialEvent: (id: string) => Promise<void>;
  reload: () => Promise<void>;
}

export function SocialFundTab({ db, addSocialEvent, deleteSocialEvent, reload }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [type, setType] = useState<'contribution' | 'payout'>('contribution');
  const [memberId, setMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const balance = socialFundBalance(db);
  const paidOut = db.socialFundEvents.filter((e) => e.type === 'payout').reduce((s, e) => s + e.amount, 0);
  const events = [...db.socialFundEvents].sort((a, b) => b.event_date.localeCompare(a.event_date));

  const submit = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) return;
    await addSocialEvent({
      member_id: memberId || null,
      type,
      amount: amt,
      reason: reason.trim(),
      event_date: new Date().toISOString().slice(0, 10),
    });
    setAmount('');
    setReason('');
    setMemberId('');
    setShowAdd(false);
    await reload();
  };

  const memberName = (id: string | null) => db.members.find((m) => m.id === id)?.name ?? 'Group';

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Ingoboka balance" value={RWF(balance)} sub="Social emergency fund" />
        <StatCard label="Total paid out" value={RWF(paidOut)} sub="Emergency support given" />
        <StatCard label="Events logged" value={String(db.socialFundEvents.length)} />
      </div>

      <div className="flex justify-end print:hidden">
        <button onClick={() => setShowAdd(true)} className={btnPrimary}>
          <Plus size={16} />
          Log contribution / payout
        </button>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-2.5">Date</th>
              <th>Member</th>
              <th>Type</th>
              <th>Reason</th>
              <th className="text-right">Amount</th>
              <th className="print:hidden" />
            </tr>
          </thead>
          <tbody>
            {events.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-neutral-500">
                  No Ingoboka events yet. The social fund is kept separate from Imigabane shares.
                </td>
              </tr>
            )}
            {events.map((e) => (
              <tr key={e.id} className="border-t border-neutral-100">
                <td className="px-4 py-2.5 text-xs text-neutral-500">{DATE(e.event_date)}</td>
                <td className="font-medium">{memberName(e.member_id)}</td>
                <td>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      e.type === 'contribution' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {e.type === 'contribution' ? 'Contribution' : 'Payout'}
                  </span>
                </td>
                <td className="text-xs text-neutral-500">{e.reason || '—'}</td>
                <td className={`text-right font-medium ${e.type === 'payout' ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {e.type === 'payout' ? '−' : '+'}
                  {RWF(e.amount)}
                </td>
                <td className="px-2 text-right print:hidden">
                  <button
                    onClick={async () => {
                      await deleteSocialEvent(e.id);
                      await reload();
                    }}
                    className="rounded p-1 text-neutral-400 hover:text-red-600"
                    aria-label="Delete event"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {showAdd && (
        <Modal title="Ingoboka — log event" onClose={() => setShowAdd(false)}>
          <div className="space-y-3">
            <Field label="Type">
              <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className={inputCls}>
                <option value="contribution">Contribution / Ubwishyu</option>
                <option value="payout">Emergency payout / Gutanga inkunga</option>
              </select>
            </Field>
            <Field label="Member (optional for group event)">
              <select value={memberId} onChange={(e) => setMemberId(e.target.value)} className={inputCls}>
                <option value="">Whole group</option>
                {db.members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Amount (RWF)">
              <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Reason / Impamvu">
              <input value={reason} onChange={(e) => setReason(e.target.value)} className={inputCls} placeholder="e.g. Medical support" />
            </Field>
            <button onClick={submit} className={btnPrimary + ' w-full justify-center'}>
              Save
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
