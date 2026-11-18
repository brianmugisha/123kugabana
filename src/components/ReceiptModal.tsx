import { useState } from 'react';
import { Copy, Check, MessageCircle, MessageSquare } from 'lucide-react';
import { Modal, btnPrimary, btnGhost } from './ui';
import { buildReceipt, smsLink, whatsappLink } from '../lib/receipt';
import type { Db, Member } from '../lib/types';
import type { ReceiptInput } from '../lib/receipt';

export function ReceiptModal({
  db,
  member,
  input,
  onClose,
}: {
  db: Db;
  member: Member;
  input: ReceiptInput;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const text = buildReceipt(db, member, input);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Modal title="Receipt / Iricyanditswe" onClose={onClose}>
      <pre className="whitespace-pre-wrap rounded-lg bg-neutral-50 border border-neutral-200 p-3 text-xs font-mono text-neutral-800 leading-relaxed">
        {text}
      </pre>
      <div className="mt-4 flex flex-wrap gap-2">
        <a href={whatsappLink(text, member.phone)} target="_blank" rel="noreferrer" className={btnPrimary}>
          <MessageCircle size={15} />
          WhatsApp
        </a>
        <a href={smsLink(text, member.phone)} className={btnGhost}>
          <MessageSquare size={15} />
          SMS
        </a>
        <button onClick={copy} className={btnGhost}>
          {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
          {copied ? 'Copied' : 'Copy SMS'}
        </button>
      </div>
    </Modal>
  );
}
