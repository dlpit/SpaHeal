// =============================================================================
// Firestore Helper Functions
// Utility functions cho CRUD operations và common patterns
// =============================================================================

import { db } from './firebase';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { COLLECTIONS, type CounterDoc } from './firestore-types';

/**
 * Get current server timestamp
 */
export function serverTimestamp() {
  return FieldValue.serverTimestamp();
}

/**
 * Convert a JavaScript Date to Firestore Timestamp
 */
export function toTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}

/**
 * Convert a Firestore Timestamp to JavaScript Date
 */
export function fromTimestamp(timestamp: Timestamp | null | undefined): Date | null {
  if (!timestamp) return null;
  return timestamp.toDate();
}

/**
 * Auto-increment counter for sequential IDs (e.g., invoice codes)
 * Uses Firestore transaction for atomic increment
 * 
 * @param counterName - Name of the counter (e.g., 'invoices')
 * @returns The next sequential number
 */
export async function getNextSequence(counterName: string): Promise<number> {
  const counterRef = db.collection(COLLECTIONS.COUNTERS).doc(counterName);
  
  return db.runTransaction(async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    
    let nextVal: number;
    if (!counterDoc.exists) {
      nextVal = 1;
      transaction.set(counterRef, { current: 1 } satisfies CounterDoc);
    } else {
      const data = counterDoc.data() as CounterDoc;
      nextVal = data.current + 1;
      transaction.update(counterRef, { current: nextVal });
    }
    
    return nextVal;
  });
}

/**
 * Generate invoice code based on date and daily sequence
 * Format: HD{YYMMDD}-{SEQ} e.g. "HD260801-001"
 */
export async function generateInvoiceCode(date: Date): Promise<string> {
  const yy = date.getFullYear().toString().slice(-2);
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const dd = date.getDate().toString().padStart(2, '0');
  const dateStr = `${yy}${mm}${dd}`;
  
  // Use a date-specific counter for daily sequencing
  const counterName = `invoice_${dateStr}`;
  const sequence = await getNextSequence(counterName);
  
  return `HD${dateStr}-${sequence.toString().padStart(3, '0')}`;
}

/**
 * Tương tự getNextSequence nhưng nhận transaction từ bên ngoài để đảm bảo tính ACID
 */
export async function getNextSequenceInTx(
  transaction: FirebaseFirestore.Transaction,
  counterName: string
): Promise<number> {
  const counterRef = db.collection(COLLECTIONS.COUNTERS).doc(counterName);
  const counterDoc = await transaction.get(counterRef);
  
  let nextVal: number;
  if (!counterDoc.exists) {
    nextVal = 1;
    transaction.set(counterRef, { current: 1 } satisfies CounterDoc);
  } else {
    const data = counterDoc.data() as CounterDoc;
    nextVal = data.current + 1;
    transaction.update(counterRef, { current: nextVal });
  }
  
  return nextVal;
}

/**
 * Tương tự generateInvoiceCode nhưng nhận transaction từ bên ngoài
 */
export async function generateInvoiceCodeInTx(
  transaction: FirebaseFirestore.Transaction,
  date: Date
): Promise<string> {
  const yy = date.getFullYear().toString().slice(-2);
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const dd = date.getDate().toString().padStart(2, '0');
  const dateStr = `${yy}${mm}${dd}`;
  
  const counterName = `invoice_${dateStr}`;
  const sequence = await getNextSequenceInTx(transaction, counterName);
  
  return `HD${dateStr}-${sequence.toString().padStart(3, '0')}`;
}

/**
 * Serialize a Firestore document snapshot to a plain object
 * Converts Timestamps to ISO date strings for client compatibility
 */
export function serializeDoc<T extends Record<string, unknown>>(
  id: string,
  data: T
): T & { id: string } {
  const serialized: Record<string, unknown> = { id };
  
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof Timestamp) {
      serialized[key] = value.toDate().toISOString();
    } else if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
      serialized[key] = (value as Timestamp).toDate().toISOString();
    } else if (Array.isArray(value)) {
      serialized[key] = value.map(item => {
        if (item && typeof item === 'object') {
          return serializeNestedObject(item as Record<string, unknown>);
        }
        return item;
      });
    } else {
      serialized[key] = value;
    }
  }
  
  return serialized as T & { id: string };
}

/**
 * Helper to serialize nested objects (e.g., embedded invoice items)
 */
function serializeNestedObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value instanceof Timestamp) {
      result[key] = value.toDate().toISOString();
    } else {
      result[key] = value;
    }
  }
  return result;
}
