import { DATE, methodLabel, memberTotals, RWF } from './calc';
import type { Db, Member } from './types';

export type ReceiptKind = 'savings' | 'loan' | 'fine' | 'social';

function header(kind: ReceiptKind): { rw: string; en: string } {
  switch (kind) {
    case 'loan':
      return { rw: 'KURIKUZWA - INKUNGU', en: 'LOAN REMINDER' };
    case 'fine':
      return { rw: 'AMANDE', en: 'FINE' };
    case 'social':
      return { rw: 'INGOBOKA', en: 'SOCIAL FUND' };
    default:
      return { rw: 'IMIGABANE', en: 'SHARES' };
  }
}

export interface ReceiptInput {
  kind: ReceiptKind;
  amount?: number;
  method?: string;
  dueDate?: string;
  note?: string;
}

export function buildReceipt(db: Db, member: Member, input: ReceiptInput): string {
  const t = memberTotals(db, member);
  const h = header(input.kind);
  const lines: string[] = [];
  lines.push(`IBIMINA - IKIBINA CYACU`);
  lines.push(`${h.rw} / ${h.en}`);
  lines.push(`--------------------------`);
  lines.push(`Nimero / Member: ${member.name}`);
  lines.push(`Telephone / Phone: ${member.phone || '-'}`);
  if (input.kind === 'loan') {
    lines.push(`Amaera y'inkungu / Outstanding loan: ${RWF(t.loanBalance)}`);
    if (input.dueDate) lines.push(`Itariki ntangira / Due: ${DATE(input.dueDate)}`);
  } else {
    if (input.amount != null) lines.push(`Amafranga / Amount: ${RWF(input.amount)}`);
    if (input.method) lines.push(`Uburyo / Method: ${methodLabel(input.method)}`);
    lines.push(`Imigabane / Shares: ${RWF(t.shares)}`);
    if (input.kind === 'social') lines.push(`Ingoboka / Social fund: ${RWF(t.social)}`);
    if (input.kind === 'fine') lines.push(`Amande / Fines: ${RWF(t.fines)}`);
    lines.push(`Hamwe / Total saved: ${RWF(t.total)}`);
  }
  if (input.note) lines.push(`Icyitonderwa / Note: ${input.note}`);
  lines.push(`--------------------------`);
  lines.push(`Murakoze! / Thank you.`);
  return lines.join('\n');
}

export function whatsappLink(text: string, phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const intl = digits.startsWith('0') ? '250' + digits.slice(1) : digits;
  return `https://wa.me/${intl}?text=${encodeURIComponent(text)}`;
}

export function smsLink(text: string, phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `sms:${digits}?body=${encodeURIComponent(text)}`;
}
