'use server';

import { getDb } from '@/lib/firebase';
import { COLLECTIONS, type ServiceDoc, type ServiceCategoryDoc } from '@/lib/firestore-types';
import { serializeDoc } from '@/lib/firestore-helpers';
import { revalidatePath, unstable_cache } from 'next/cache';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';

const serviceSchema = z.object({
  code: z.string().min(1, 'Mã dịch vụ không được để trống'),
  name: z.string().min(1, 'Tên dịch vụ không được để trống'),
  price: z.coerce.number().min(0, 'Giá tiền phải lớn hơn hoặc bằng 0'),
  categoryId: z.string().min(1, 'Vui lòng chọn danh mục'),
  categoryName: z.string(),
  sortOrder: z.number().default(0),
  isActive: z.boolean().default(true),
});

export type SerializedService = ServiceDoc & { id: string };
export type SerializedServiceCategory = ServiceCategoryDoc & { id: string };

const getServicesCached = unstable_cache(
  async (): Promise<{ services: SerializedService[], categories: SerializedServiceCategory[] }> => {
  try {
    const db = getDb();
    
    // Fetch categories first
    const categoriesSnapshot = await db.collection(COLLECTIONS.SERVICE_CATEGORIES)
      .orderBy('sortOrder', 'asc')
      .limit(50)
      .get();
      
    const categories = categoriesSnapshot.docs.map(doc => 
      serializeDoc(doc.id, doc.data() as any) as unknown as SerializedServiceCategory
    );

    // Fetch services
    const servicesSnapshot = await db.collection(COLLECTIONS.SERVICES)
      .orderBy('sortOrder', 'asc')
      .limit(50)
      .get();
      
    const services = servicesSnapshot.docs.map(doc => 
      serializeDoc(doc.id, doc.data() as any) as unknown as SerializedService
    );

    return { services, categories };
  } catch (error) {
    console.error('Error fetching services:', error);
    return { services: [], categories: [] };
  }
}, ['services-list'], { revalidate: 3600 });

export async function getServices(): Promise<{ services: SerializedService[], categories: SerializedServiceCategory[] }> {
  return getServicesCached();
}

export async function createService(data: Omit<ServiceDoc, 'createdAt' | 'updatedAt'>) {
  try {
    const validatedData = serviceSchema.parse(data);
    const db = getDb();
    
    // Check if code already exists
    const existing = await db.collection(COLLECTIONS.SERVICES).where('code', '==', validatedData.code).get();
    if (!existing.empty) {
      return { success: false, error: 'Mã dịch vụ này đã tồn tại' };
    }

    const docRef = db.collection(COLLECTIONS.SERVICES).doc();
    
    await docRef.set({
      ...validatedData,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    
    revalidatePath('/dich-vu');
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating service:', error);
    return { success: false, error: 'Không thể tạo dịch vụ' };
  }
}

export async function updateService(id: string, data: Partial<Omit<ServiceDoc, 'createdAt' | 'updatedAt'>>) {
  try {
    // Only validate provided fields
    const partialSchema = serviceSchema.partial();
    const validatedData = partialSchema.parse(data);
    
    // Prevent updating code
    delete validatedData.code;
    
    const db = getDb();
    const docRef = db.collection(COLLECTIONS.SERVICES).doc(id);
    
    await docRef.update({
      ...validatedData,
      updatedAt: FieldValue.serverTimestamp(),
    });
    
    revalidatePath('/dich-vu');
    return { success: true };
  } catch (error) {
    console.error('Error updating service:', error);
    return { success: false, error: 'Không thể cập nhật dịch vụ' };
  }
}

export async function toggleServiceStatus(id: string, currentStatus: boolean) {
  try {
    const db = getDb();
    const docRef = db.collection(COLLECTIONS.SERVICES).doc(id);
    
    await docRef.update({
      isActive: !currentStatus,
      updatedAt: FieldValue.serverTimestamp(),
    });
    
    revalidatePath('/dich-vu');
    return { success: true };
  } catch (error) {
    console.error('Error toggling service status:', error);
    return { success: false, error: 'Không thể cập nhật trạng thái' };
  }
}
