import { User, Contact, Lend, Repayment, Badge, LendRequest } from '../types';

export const MOCK_USER: User = {
  id: 0,
  name: 'Yasser Al-Ansari',
  email: 'yasser@email.com',
  phone: '+973 3399 9999',
};

export const MOCK_CONTACTS: Contact[] = [
  {
    id: 1,
    name: 'Ali Hassan',
    phone: '+973 3300 0000',
    trustScore: 87,
    activeLends: 1,
    totalLends: 5,
    paidLends: 4,
    overdueLends: 0,
    onTimePaid: 4,
    latePaid: 0,
  },
  {
    id: 2,
    name: 'Sara Ahmed',
    phone: '+973 3311 1111',
    trustScore: 31,
    activeLends: 1,
    totalLends: 3,
    paidLends: 1,
    overdueLends: 1,
    onTimePaid: 1,
    latePaid: 2,
  },
  {
    id: 3,
    name: 'Khalid Nasser',
    phone: '+973 3322 2222',
    trustScore: 62,
    activeLends: 0,
    totalLends: 2,
    paidLends: 2,
    overdueLends: 0,
    onTimePaid: 1,
    latePaid: 1,
  },
];

export const MOCK_LENDS: Lend[] = [
  {
    id: 1,
    contact: 'Ali Hassan',
    contactId: 1,
    amount: 100,
    paid: 50,
    status: 'ACTIVE',
    due: '2025-03-03',
    note: 'Help for car repair',
    transferRef: 'TRF-00101',
    createdAt: '2025-01-15',
    acknowledged: true,
    acknowledgedDate: '2025-01-16',
    type: 'LENT',
  },
  {
    id: 2,
    contact: 'Sara Ahmed',
    contactId: 2,
    amount: 200,
    paid: 0,
    status: 'OVERDUE',
    due: '2025-02-10',
    note: 'Emergency loan',
    createdAt: '2025-01-10',
    acknowledged: true,
    acknowledgedDate: '2025-01-11',
    type: 'LENT',
  },
  {
    id: 3,
    contact: 'Khalid Nasser',
    contactId: 3,
    amount: 75,
    paid: 75,
    status: 'PAID',
    due: '2025-01-20',
    transferRef: 'TRF-00099',
    createdAt: '2024-12-20',
    acknowledged: true,
    acknowledgedDate: '2024-12-21',
    type: 'LENT',
  },
  {
    id: 4,
    contact: 'Yousif Mahmood',
    contactId: 4,
    amount: 80,
    paid: 0,
    status: 'PENDING',
    due: '2025-04-01',
    note: 'Split for trip expenses',
    createdAt: '2025-02-20',
    type: 'LENT',
  },
];

export const MOCK_REPAYMENTS: Repayment[] = [
  { id: 1, lendId: 1, amount: 50, date: '2025-02-15', ref: 'TRF-00123' },
];

export const MOCK_BADGES: Badge[] = [
  {
    name: 'On-Time Hero',
    icon: 'trophy-outline',
    desc: 'Always paid on time',
    earned: '2025-01-01',
  },
  {
    name: 'Trusted Lender',
    icon: 'ribbon-outline',
    desc: '10+ completed lends',
    earned: '2025-01-15',
  },
  {
    name: 'Debt Free',
    icon: 'lock-closed-outline',
    desc: 'No outstanding debts',
    earned: '2025-02-01',
  },
];

export const MOCK_REQUESTS: LendRequest[] = [
  {
    id: 1,
    contact: 'Ali Hassan',
    contactId: 1,
    amount: 50,
    due: '2025-03-15',
    note: 'Need it for rent this month',
    status: 'PENDING',
    type: 'INCOMING',
  },
  {
    id: 2,
    contact: 'Khalid Nasser',
    contactId: 3,
    amount: 30,
    due: '2025-04-01',
    note: 'Restaurant split from last week',
    status: 'ACCEPTED',
    type: 'OUTGOING',
  },
];
