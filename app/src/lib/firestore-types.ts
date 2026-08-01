// =============================================================================
// Firestore Document Types & Enums
// TypeScript interfaces cho tất cả collections trong Firestore
// =============================================================================

// ---- Enums (stored as strings in Firestore) ----

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export type AppointmentStatus =
  | 'CONFIRMED'
  | 'ARRIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'RESCHEDULED'
  | 'NO_SHOW'
  | 'DEPOSIT';

export type InvoiceStatus = 'DRAFT' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';

export type ExpenseNature = 'FIXED' | 'SEMI_FIXED' | 'VARIABLE' | 'ONE_TIME';

export type StockTransactionType = 'IMPORT' | 'EXPORT' | 'ADJUST';

// ---- Firestore Timestamp type ----
// Firestore stores dates as Timestamp objects; we use this for type clarity
import type { Timestamp } from 'firebase-admin/firestore';

// ---- Document Interfaces ----

export interface ServiceCategoryDoc {
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ServiceDoc {
  code: string;
  name: string;
  price: number;
  categoryId: string;
  categoryName: string; // Denormalized
  sortOrder: number;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface StaffDoc {
  code: string;
  fullName: string;
  role: string;
  phone: string | null;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PaymentMethodDoc {
  code: string;
  name: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PaymentAccountDoc {
  code: string;
  bankName: string;
  accountNumber: string | null;
  accountName: string | null;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type LoyaltyTier = 'MEMBER' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface CustomerDoc {
  customerId: string;
  fullName: string;
  phone: string;
  email: string | null;
  address: string | null;
  gender: Gender | null;
  birthday: Timestamp | null;
  skinCondition: string | null;
  medicalNotes: string | null;
  loyaltyTier: LoyaltyTier;
  rewardPoints: number;
  totalSpent: number;
  visitCount: number;
  lastVisit: Timestamp | null;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type ClientCustomerDoc = Omit<CustomerDoc, 'createdAt' | 'updatedAt' | 'birthday' | 'lastVisit'> & {
  createdAt: string;
  updatedAt: string;
  birthday: string | null;
  lastVisit: string | null;
};

export interface AppointmentDoc {
  customerId: string;
  customerName: string; // Denormalized
  date: Timestamp;
  startTime: string;
  endTime: string | null;
  status: AppointmentStatus;
  notes: string | null;
  deposit: number | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface InvoiceItemEmbed {
  serviceId: string;
  serviceName: string; // Denormalized
  serviceCode: string; // Denormalized
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface InvoiceDoc {
  invoiceCode: string;
  date: Timestamp;
  customerId: string;
  customerName: string; // Denormalized
  staffId: string | null;
  staffName: string | null; // Denormalized
  paymentMethodId: string | null;
  paymentMethodName: string | null; // Denormalized
  paymentAccountId: string | null;
  paymentAccountName: string | null; // Denormalized
  subTotal: number;
  discount: number;
  surcharge: number;
  totalAmount: number;
  status: InvoiceStatus;
  notes: string | null;
  items: InvoiceItemEmbed[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type ClientInvoiceDoc = Omit<InvoiceDoc, 'date' | 'createdAt' | 'updatedAt'> & {
  id: string;
  date: string;
  createdAt: string;
  updatedAt: string;
};

export interface ExpenseCategoryDoc {
  code: string;
  nature: ExpenseNature;
  group: string;
  itemName: string;
  serviceGroup: string | null;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ExpenseDoc {
  date: Timestamp;
  expenseCategoryId: string;
  categoryName: string; // Denormalized
  categoryGroup: string; // Denormalized
  amount: number;
  quantity: number;
  description: string | null;
  notes: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SupplierDoc {
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface InventoryItemDoc {
  code: string;
  name: string;
  unit: string;
  quantity: number;
  minQuantity: number;
  costPrice: number;
  supplierId: string | null;
  supplierName: string | null; // Denormalized
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface StockTransactionDoc {
  inventoryItemId: string;
  itemName: string; // Denormalized
  type: StockTransactionType;
  quantity: number;
  unitCost: number | null;
  totalCost: number | null;
  date: Timestamp;
  notes: string | null;
  createdAt: Timestamp;
}

export interface CounterDoc {
  current: number;
}

// ---- Collection Names (centralized) ----

export const COLLECTIONS = {
  SERVICE_CATEGORIES: 'serviceCategories',
  SERVICES: 'services',
  STAFF: 'staff',
  PAYMENT_METHODS: 'paymentMethods',
  PAYMENT_ACCOUNTS: 'paymentAccounts',
  CUSTOMERS: 'customers',
  APPOINTMENTS: 'appointments',
  INVOICES: 'invoices',
  EXPENSE_CATEGORIES: 'expenseCategories',
  EXPENSES: 'expenses',
  SUPPLIERS: 'suppliers',
  INVENTORY_ITEMS: 'inventoryItems',
  STOCK_TRANSACTIONS: 'stockTransactions',
  COUNTERS: 'counters',
} as const;
