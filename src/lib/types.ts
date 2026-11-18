export type PaymentMethod = 'momo' | 'airtel' | 'cash';

export type ContributionType = 'share' | 'social' | 'fine';

export interface Member {
  id: string;
  name: string;
  phone: string;
  joined_at: string;
  active: boolean;
}

export interface Contribution {
  id: string;
  member_id: string;
  type: ContributionType;
  amount: number;
  method: PaymentMethod;
  note: string;
  paid_at: string;
}

export interface SocialFundEvent {
  id: string;
  member_id: string | null;
  type: 'contribution' | 'payout';
  amount: number;
  reason: string;
  event_date: string;
}

export interface Loan {
  id: string;
  member_id: string;
  principal: number;
  interest_rate: number;
  status: 'active' | 'repaid';
  issued_at: string;
  due_at: string | null;
}

export interface LoanRepayment {
  id: string;
  loan_id: string;
  amount: number;
  method: PaymentMethod;
  paid_at: string;
}

export interface Db {
  members: Member[];
  contributions: Contribution[];
  socialFundEvents: SocialFundEvent[];
  loans: Loan[];
  repayments: LoanRepayment[];
}

export const emptyDb: Db = {
  members: [],
  contributions: [],
  socialFundEvents: [],
  loans: [],
  repayments: [],
};

export const SHARE_PRICE = 500; // RWF per share (Imigabane)
export const LOAN_INTEREST_MONTHLY = 2; // percent per month
export const LOAN_MULTIPLIER = 3; // max loan = 3x savings
