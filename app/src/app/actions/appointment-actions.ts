'use server';

import { db } from '@/lib/firebase';
import { COLLECTIONS, AppointmentDoc, AppointmentStatus } from '@/lib/firestore-types';
import { serializeDoc, serverTimestamp, toTimestamp } from '@/lib/firestore-helpers';
import { AppointmentFormValues } from '@/lib/schemas/appointment';
import { revalidatePath } from 'next/cache';

// Create a Client type for returning to the frontend
export type ClientAppointmentDoc = Omit<AppointmentDoc, 'createdAt' | 'updatedAt' | 'date'> & {
  id: string;
  createdAt: string;
  updatedAt: string;
  date: string;
};

export async function getAppointments(): Promise<ClientAppointmentDoc[]> {
  try {
    const snapshot = await db.collection(COLLECTIONS.APPOINTMENTS)
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
