'use server';

import { db } from '@/lib/firebase';
import { COLLECTIONS, CustomerDoc, ClientCustomerDoc } from '@/lib/firestore-types';
import { getNextSequence, serializeDoc, serverTimestamp, toTimestamp } from '@/lib/firestore-helpers';
import { CustomerFormValues } from '@/lib/schemas/customer';
import { revalidatePath } from 'next/cache';

export async function getCustomers(): Promise<ClientCustomerDoc[]> {
  try {
    const snapshot = await db.collection(COLLECTIONS.CUSTOMERS)
      .where('isActive', '==', true)
      .get();
      
    // Sort in-memory để tránh composite index (theo pattern dự án)
    const customers = snapshot.docs
      .map(doc =>
        serializeDoc<CustomerDoc & Record<string, unknown>>(
          doc.id,
          doc.data() as CustomerDoc & Record<string, unknown>
        ) as unknown as ClientCustomerDoc
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return customers;
  } catch (error) {
    console.error('Error getting customers:', error);
    throw new Error('Không thể tải danh sách khách hàng');
  }
}

export async function createCustomer(data: CustomerFormValues) {
  try {
    const sequence = await getNextSequence('customer_seq');
    // Mã hiển thị nghiệp vụ — human-readable, khác với Firestore doc.id
    const customerCode = `KH${sequence.toString().padStart(4, '0')}`;
    
    const customerData: CustomerDoc = {
      customerCode,
      fullName: data.fullName,
      phone: data.phone,
      email: data.email || null,
      address: data.address || null,
      gender: data.gender || null,
      birthday: data.birthday ? toTimestamp(data.birthday) : null,
      skinCondition: data.skinCondition || null,
      medicalNotes: data.medicalNotes || null,
      loyaltyTier: 'MEMBER',
      rewardPoints: 0,
      totalSpent: 0,
      visitCount: 0,
      lastVisit: null,
      isActive: true,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
    };

    const docRef = await db.collection(COLLECTIONS.CUSTOMERS).add(customerData);
    
    revalidatePath('/khach-hang');
    return { success: true, id: docRef.id, customerCode };
  } catch (error) {
    console.error('Error creating customer:', error);
    throw new Error('Không thể tạo khách hàng');
  }
}

export async function updateCustomer(id: string, data: CustomerFormValues) {
  try {
    const updateData: Partial<CustomerDoc> = {
      fullName: data.fullName,
      phone: data.phone,
      email: data.email || null,
      address: data.address || null,
      gender: data.gender || null,
      skinCondition: data.skinCondition || null,
      medicalNotes: data.medicalNotes || null,
      updatedAt: serverTimestamp() as any,
    };

    if (data.birthday) {
      updateData.birthday = toTimestamp(data.birthday);
    } else {
      updateData.birthday = null;
    }

    await db.collection(COLLECTIONS.CUSTOMERS).doc(id).update(updateData);
    
    revalidatePath('/khach-hang');
    return { success: true };
  } catch (error) {
    console.error('Error updating customer:', error);
    throw new Error('Không thể cập nhật khách hàng');
  }
}

export async function getCustomer(id: string): Promise<ClientCustomerDoc | null> {
  try {
    const doc = await db.collection(COLLECTIONS.CUSTOMERS).doc(id).get();
    if (!doc.exists) return null;
    return serializeDoc<CustomerDoc & Record<string, unknown>>(
      doc.id,
      doc.data() as CustomerDoc & Record<string, unknown>
    ) as unknown as ClientCustomerDoc;
  } catch (error) {
    console.error('Error getting customer:', error);
    return null;
  }
}

export async function getFrequentCustomers(limit: number = 20): Promise<ClientCustomerDoc[]> {
  try {
    const snapshot = await db.collection(COLLECTIONS.CUSTOMERS)
      .where('isActive', '==', true)
      .get();
      
    const customers = snapshot.docs
      .map(doc =>
        serializeDoc<CustomerDoc & Record<string, unknown>>(
          doc.id,
          doc.data() as CustomerDoc & Record<string, unknown>
        ) as unknown as ClientCustomerDoc
      )
      .sort((a, b) => {
        const visitDiff = (b.visitCount || 0) - (a.visitCount || 0);
        if (visitDiff !== 0) return visitDiff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, limit);
    
    return customers;
  } catch (error) {
    console.error('Error getting frequent customers:', error);
    throw new Error('Không thể tải danh sách khách hàng thân thiết');
  }
}

export async function searchCustomers(query: string = ''): Promise<ClientCustomerDoc[]> {
  try {
    const q = query.trim().toLowerCase();
    
    const snapshot = await db.collection(COLLECTIONS.CUSTOMERS)
      .where('isActive', '==', true)
      .get();
      
    let customers = snapshot.docs
      .map(doc =>
        serializeDoc<CustomerDoc & Record<string, unknown>>(
          doc.id,
          doc.data() as CustomerDoc & Record<string, unknown>
        ) as unknown as ClientCustomerDoc
      );

    if (q) {
      customers = customers.filter(c => 
        (c.fullName || '').toLowerCase().includes(q) || 
        (c.phone || '').includes(q) ||
        (c.customerCode && c.customerCode.toLowerCase().includes(q))
      );
    }
    
    // Sắp xếp theo số lần ghé thăm giảm dần, sau đó là ngày tạo giảm dần
    return customers
      .sort((a, b) => {
        const visitDiff = (b.visitCount || 0) - (a.visitCount || 0);
        if (visitDiff !== 0) return visitDiff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, 20);
      
  } catch (error) {
    console.error('Error searching customers:', error);
    throw new Error('Không thể tìm kiếm khách hàng');
  }
}

