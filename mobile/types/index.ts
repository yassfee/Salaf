export type LendStatus =
  | 'PENDING'
  | 'BORROW_REQUESTED'
  | 'ACCEPTED'
  | 'ACTIVE'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'REJECTED'
  | 'OVERDUE';

export type RequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';
export type LendType = 'LENT' | 'BORROWED';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
}

export interface Contact {
  id: number;
  name: string;
  phone: string;
  trustScore: number;
  activeLends?: number;
  totalLends?: number;
  paidLends?: number;
  overdueLends?: number;
  onTimePaid?: number;
  latePaid?: number;
}

export interface Lend {
  id: number;
  contact: string;
  contactId?: number;
  amount: number;
  paid: number;
  status: LendStatus;
  due: string;
  note?: string;
  transferRef?: string;
  createdAt?: string;
  acknowledged?: boolean;
  acknowledgedDate?: string;
  type?: LendType;
}

export interface Repayment {
  id?: number;
  lendId: number;
  amount: number;
  date: string;
  ref: string;
}

export interface Badge {
  name: string;
  icon: string;
  desc: string;
  earned: string;
}

export interface LendRequest {
  id: number;
  contact: string;
  contactId: number;
  amount: number;
  due: string;
  note?: string;
  status: RequestStatus;
  type: 'INCOMING' | 'OUTGOING';
}
