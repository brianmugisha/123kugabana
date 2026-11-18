import { useState } from 'react';
import { BookOpen, MessageCircle, Plus, Trash2 } from 'lucide-react';
import { Card, Field, Modal, btnDanger, btnGhost, btnPrimary, inputCls } from './ui';
import { ReceiptModal } from './ReceiptModal';
import { PassbookModal } from './PassbookModal';
import { RWF, memberTotals } from '../lib/calc';
import type { Db, Member, PaymentMethod } from '../lib/types';
import type { ReceiptInput } from '../lib/receipt';

interface Props {
  db: Db;
  addMember: (name: string, phone: string) => Promise<void>;
  addContribution: (memberId: string, type: 'share' | 'social' | 'fine', amount: number, method: PaymentMethod, note: string) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  reload: () => Promise<void>;
}

export function MembersTab({ db, addMember, addContribution, deleteMember, reload }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [receipt, setReceipt] = useState<{ member: Member; input: ReceiptInput } | null>(null);
  const [passbook, setPassbook] = useState<Member | null>(null);
  const [contrib, setContrib] = useState<Member | null>(null);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'share' | 'social' | 'fine'>('share');
  const [method, setMethod] = useState<PaymentMethod>('cash');

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
      <div className="flex justify-end print:hidden">
        <button onClick={() => setShowAdd(true)} className={btnPrimary}>
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
          return (
            <Card key={m.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-neutral-900">{m.name}</p>
                  <p className="text-xs text-neutral-500">{m.phone || 'No phone'}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    m.active ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-500'
                  }`}
                >
                  {m.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                <div className="flex justify-between"><dt className="text-neutral-500">Imigabane</dt><dd className="font-medium">{RWF(t.shares)}</dd></div>
                <div className="flex justify-between"><dt className="text-neutral-500">Ingoboka</dt><dd className="font-medium">{RWF(t.social)}</dd></div>
                <div className="flex justify-between"><dt className="text-neutral-500">Amande</dt><dd className="font-medium text-red-600">{RWF(t.fines)}</dd></div>
                <div className="flex justify-between"><dt className="text-neutral-500">Loan bal.</dt><dd className="font-medium">{RWF(Math.max(0, t.loanBalance))}</dd></div>
              </dl>
              <div className="mt-3 flex flex-wrap gap-1.5 print:hidden">
                <button
                  onClick={() => setReceipt({ member: m, input: { kind: 'savings' } })}
                  className="inline-flex items-center gap-1 rounded-md bg-green-600 px-2 py-1 text-[11px] text-white hover:bg-green-700"
                  title="Send WhatsApp / copy SMS receipt"
                >
                  <MessageCircle size={12} />
                  Receipt
                </button>
                <button onClick={() => setPassbook(m)} className={btnGhost + ' !px-2 !py-1 !text-[11px]'}>
                  <BookOpen size={12} />
                  Passbook
                </button>
                <button
                  onClick={() => {
                    setContrib(m);
                    setType('share');
                  }}
                  className={btnGhost + ' !px-2 !py-1 !text-[11px]'}
                >
                  <Plus size={12} />
                  Payment
                </button>
                <button
                  onClick={async () => {
                    if (confirm(`Remove ${m.name}? Their contribution history will also be removed.`)) {
                      await deleteMember(m.id);
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
        <Modal title="Add member / Ongeraho umunyamuryango" onClose={() => setShowAdd(false)}>
          <div className="space-y-3">
            <Field label="Name / Izina">
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="e.g. Alice Mukamana" />
            </Field>
            <Field label="Phone (MTN MoMo / Airtel)">
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="e.g. 0788 123 456" />
            </Field>
            <button onClick={submitMember} className={btnPrimary + ' w-full justify-center'}>
              Save member
            </button>
          </div>
        </Modal>
      )}

      {contrib && (
        <Modal title={`Record payment — ${contrib.name}`} onClose={() => setContrib(null)}>
          <div className="space-y-3">
            <Field label="Type">
              <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className={inputCls}>
                <option value="share">Imigabane (share)</option>
                <option value="social">Ingoboka (social fund)</option>
                <option value="fine">Amande (fine)</option>
              </select>
            </Field>
            <Field label="Amount (RWF)">
              <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Method / Uburyo">
              <select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} className={inputCls}>
                <option value="cash">Cash</option>
                <option value="momo">MTN MoMo</option>
                <option value="airtel">Airtel Money</option>
              </select>
            </Field>
            <button onClick={submitContribution} className={btnPrimary + ' w-full justify-center'}>
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
