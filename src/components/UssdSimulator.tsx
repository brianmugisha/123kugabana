import { useState } from 'react';
import { X, Smartphone } from 'lucide-react';
import type { Db, Member } from '../lib/types';
import { RWF, memberTotals, socialFundBalance } from '../lib/calc';

/** Floating widget demonstrating *800# balance checks for non-smartphone members. */
export function UssdSimulator({ db }: { db: Db }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'dial' | 'menu' | 'result'>('dial');
  const [input, setInput] = useState('*800#');
  const [memberId, setMemberId] = useState('');
  const [code, setCode] = useState('');

  const member: Member | undefined = db.members.find((m) => m.id === memberId);

  const dial = () => {
    if (input.trim() === '*800#') {
      setStep('menu');
    } else {
      setCode('ERR: Invalid code. Dial *800#');
      setStep('result');
    }
  };

  const balance = member ? memberTotals(db, member) : null;

  return (
    <>
      <button
        onClick={() => {
          setOpen((o) => !o);
          setStep('dial');
          setCode('');
        }}
        className="fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-3 text-sm font-medium text-white shadow-lg hover:bg-neutral-700 transition-colors print:hidden"
      >
        <Smartphone size={16} />
        USSD *800#
      </button>

      {open && (
        <div className="fixed bottom-20 right-5 z-30 w-72 rounded-2xl bg-neutral-900 text-green-400 shadow-2xl border border-neutral-700 overflow-hidden print:hidden font-mono text-xs">
          <div className="flex items-center justify-between px-3 py-2 bg-neutral-800 text-neutral-300">
            <span>USSD Simulator</span>
            <button onClick={() => setOpen(false)} aria-label="Close simulator">
              <X size={14} />
            </button>
          </div>

          {step === 'dial' && (
            <div className="p-3 space-y-3">
              <p className="text-neutral-400">Feature phone screen:</p>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full rounded border border-neutral-600 bg-black px-2 py-1.5 text-green-400 focus:outline-none"
              />
              <button
                onClick={dial}
                className="w-full rounded bg-green-700 px-2 py-1.5 text-white hover:bg-green-600"
              >
                Call / Hamagara
              </button>
            </div>
          )}

          {step === 'menu' && (
            <div className="p-3 space-y-3">
              <p>*800# — Ibimina</p>
              <p className="text-neutral-400">Choose member:</p>
              <select
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                className="w-full rounded border border-neutral-600 bg-black px-2 py-1.5 text-green-400 focus:outline-none"
              >
                <option value="">-- Select --</option>
                {db.members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  if (member) {
                    setCode('');
                    setStep('result');
                  } else {
                    setCode('ERR: Choose a member.');
                  }
                }}
                disabled={!member}
                className="w-full rounded bg-green-700 px-2 py-1.5 text-white hover:bg-green-600 disabled:opacity-40"
              >
                Send / Kohereza
              </button>
              <button onClick={() => setStep('dial')} className="text-neutral-400 hover:text-white">
                Back / Subira
              </button>
            </div>
          )}

          {step === 'result' && (
            <div className="p-3 space-y-2">
              {code ? (
                <p className="text-red-400">{code}</p>
              ) : member && balance ? (
                <div className="space-y-1 whitespace-pre-line">
                  <p>IBIMINA *800#</p>
                  <p>Mwiriwe {member.name}</p>
                  <p>Imigabane: {RWF(balance.shares)}</p>
                  <p>Ingoboka: {RWF(balance.social)}</p>
                  <p>Amande: {RWF(balance.fines)}</p>
                  {balance.loanBalance > 0 && <p>Ukwishyuzwe: {RWF(balance.loanBalance)}</p>}
                  <p>Inguzi yo mu mafunguro ya societe: {RWF(socialFundBalance(db))}</p>
                </div>
              ) : null}
              <button onClick={() => setStep('menu')} className="text-neutral-400 hover:text-white">
                Back / Subira
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
