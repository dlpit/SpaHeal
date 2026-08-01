'use server';

import { db } from '@/lib/firebase';
import { COLLECTIONS, AppointmentDoc, AppointmentStatus, StaffDoc, ServiceDoc } from '@/lib/firestore-types';
import { serializeDoc, serverTimestamp, toTimestamp } from '@/lib/firestore-helpers';
import { AppointmentFormValues } from '@/lib/schemas/appointment';
import { revalidatePath } from 'next/cache';
import { Timestamp } from 'firebase-admin/firestore';

// Create a Client type for returning to the frontend
export type ClientAppointmentDoc = Omit<AppointmentDoc, 'createdAt' | 'updatedAt' | 'date'> & {
  id: string;
  createdAt: string;
  updatedAt: string;
  date: string;
};

/**
 * Lấy danh sách tất cả lịch hẹn trong 60 ngày qua đến tương lai.
 * Giới hạn thời gian để tránh collection phình to ảnh hưởng hiệu năng.
 */
export async function getAppointments(): Promise<ClientAppointmentDoc[]> {
  try {
    // Chỉ lấy appointments từ 60 ngày trước đến tương lai
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const snapshot = await db.collection(COLLECTIONS.APPOINTMENTS)
      .where('date', '>=', Timestamp.fromDate(sixtyDaysAgo))
      .orderBy('date', 'asc')
      .get();
      
    const appointments = snapshot.docs.map(doc => {
      const data = doc.data() as AppointmentDoc;
      return {
        id: doc.id,
        ...data,
        date: data.date?.toDate().toISOString(),
        createdAt: data.createdAt?.toDate().toISOString(),
        updatedAt: data.updatedAt?.toDate().toISOString(),
      } as ClientAppointmentDoc;
    });
    
    return appointments;
  } catch (error) {
    console.error('Error getting appointments:', error);
    throw new Error('Không thể tải danh sách lịch hẹn');
  }
}

export async function createAppointment(data: AppointmentFormValues) {
  try {
    const appointmentData: AppointmentDoc = {
      customerId: data.customerId,
      customerName: data.customerName,
      serviceId: data.serviceId || null,
      serviceName: data.serviceName || null,
      staffId: data.staffId || null,
      staffName: data.staffName || null,
      date: toTimestamp(data.date),
      startTime: data.startTime,
      endTime: data.endTime || null,
      status: data.status as AppointmentStatus,
      notes: data.notes || null,
      deposit: data.deposit || null,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
    };

    const docRef = await db.collection(COLLECTIONS.APPOINTMENTS).add(appointmentData);
    
    revalidatePath('/lich-hen');
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating appointment:', error);
    throw new Error('Không thể tạo lịch hẹn');
  }
}

export async function updateAppointment(id: string, data: AppointmentFormValues) {
  try {
    const updateData: Partial<AppointmentDoc> = {
      customerId: data.customerId,
      customerName: data.customerName,
      serviceId: data.serviceId || null,
      serviceName: data.serviceName || null,
      staffId: data.staffId || null,
      staffName: data.staffName || null,
      date: toTimestamp(data.date),
      startTime: data.startTime,
      endTime: data.endTime || null,
      status: data.status as AppointmentStatus,
      notes: data.notes || null,
      deposit: data.deposit || null,
      updatedAt: serverTimestamp() as any,
    };

    await db.collection(COLLECTIONS.APPOINTMENTS).doc(id).update(updateData);
    
    revalidatePath('/lich-hen');
    return { success: true };
  } catch (error) {
    console.error('Error updating appointment:', error);
    throw new Error('Không thể cập nhật lịch hẹn');
  }
}

export async function updateAppointmentTime(id: string, newDate: Date, newStartTime: string, newEndTime: string | null) {
  try {
    const updateData: Partial<AppointmentDoc> = {
      date: toTimestamp(newDate),
      startTime: newStartTime,
      endTime: newEndTime,
      updatedAt: serverTimestamp() as any,
    };

    await db.collection(COLLECTIONS.APPOINTMENTS).doc(id).update(updateData);
    
    revalidatePath('/lich-hen');
    return { success: true };
  } catch (error) {
    console.error('Error updating appointment time:', error);
    throw new Error('Không thể cập nhật thời gian lịch hẹn');
  }
}

/**
 * Chuyển trạng thái lịch hẹn — dùng khi lễ tân thay đổi bước quy trình
 */
export async function updateAppointmentStatus(id: string, status: AppointmentStatus) {
  try {
    await db.collection(COLLECTIONS.APPOINTMENTS).doc(id).update({
      status,
      updatedAt: serverTimestamp(),
    });
    revalidatePath('/lich-hen');
    return { success: true };
  } catch (error) {
    console.error('Error updating appointment status:', error);
    return { success: false, error: 'Không thể cập nhật trạng thái' };
  }
}

export async function deleteAppointment(id: string) {
  try {
    await db.collection(COLLECTIONS.APPOINTMENTS).doc(id).delete();
    revalidatePath('/lich-hen');
    return { success: true };
  } catch (error) {
    console.error('Error deleting appointment:', error);
    throw new Error('Không thể xóa lịch hẹn');
  }
}

/**
 * Lấy dữ liệu pre-fill để tạo hóa đơn từ một lịch hẹn.
 * Trả về object chứa customerId, serviceId, staffId đã được điền sẵn.
 */
export async function getAppointmentPrefill(appointmentId: string) {
  try {
    const docSnap = await db.collection(COLLECTIONS.APPOINTMENTS).doc(appointmentId).get();
    if (!docSnap.exists) {
      return { success: false, error: 'Lịch hẹn không tồn tại' };
    }

    const data = docSnap.data() as AppointmentDoc;

    return {
      success: true,
      data: {
        appointmentId,
        customerId: data.customerId,
        customerName: data.customerName,
        staffId: data.staffId || null,
        // Pre-fill item đầu tiên nếu có dịch vụ
        serviceId: data.serviceId || null,
        serviceName: data.serviceName || null,
        notes: data.notes || null,
        date: data.date?.toDate(),
      },
    };
  } catch (error) {
    console.error('Error getting appointment prefill:', error);
    return { success: false, error: 'Không thể lấy dữ liệu lịch hẹn' };
  }
}

/**
 * Lấy danh sách Staff active để dùng trong form tạo/sửa lịch hẹn
 */
export async function getStaffForAppointment() {
  try {
    const snapshot = await db.collection(COLLECTIONS.STAFF)
      .where('isActive', '==', true)
      .get();
    return snapshot.docs.map(doc => {
      const data = doc.data() as StaffDoc;
      return { id: doc.id, fullName: data.fullName, code: data.code };
    });
  } catch (error) {
    console.error('Error getting staff:', error);
    return [];
  }
}

/**
 * Lấy danh sách Dịch vụ active để dùng trong form tạo/sửa lịch hẹn
 */
export async function getServicesForAppointment() {
  try {
    const snapshot = await db.collection(COLLECTIONS.SERVICES)
      .where('isActive', '==', true)
      .get();
    const services = snapshot.docs.map(doc => {
      const data = doc.data() as ServiceDoc;
      return { id: doc.id, name: data.name, price: data.price, code: data.code };
    });
    // Sort in-memory để tránh composite index
    return services.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Error getting services:', error);
    return [];
  }
}
