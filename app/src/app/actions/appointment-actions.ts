'use server';

import { db } from '@/lib/firebase';
import { COLLECTIONS, AppointmentDoc, AppointmentStatus, StaffDoc, ServiceDoc, StatusHistoryLog } from '@/lib/firestore-types';
import { serializeDoc, serverTimestamp, toTimestamp, generateInvoiceCodeInTx } from '@/lib/firestore-helpers';
import { AppointmentFormValues } from '@/lib/schemas/appointment';
import { revalidatePath } from 'next/cache';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { INITIAL_APPOINTMENT_STATUSES, APPOINTMENT_TRANSITIONS } from '@/lib/constants/appointment';

export type ClientStatusHistoryLog = Omit<StatusHistoryLog, 'timestamp'> & {
  timestamp: string;
};

// Create a Client type for returning to the frontend
export type ClientAppointmentDoc = Omit<AppointmentDoc, 'createdAt' | 'updatedAt' | 'date' | 'statusHistory'> & {
  id: string;
  createdAt: string;
  updatedAt: string;
  date: string;
  statusHistory?: ClientStatusHistoryLog[];
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
        statusHistory: data.statusHistory?.map(log => ({
          ...log,
          timestamp: log.timestamp?.toDate().toISOString(),
        })),
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
      services: data.services || [],
      date: toTimestamp(data.date),
      startTime: data.startTime,
      endTime: data.endTime || null,
      status: INITIAL_APPOINTMENT_STATUSES.includes(data.status as AppointmentStatus) 
        ? (data.status as AppointmentStatus) 
        : 'CONFIRMED',
      statusHistory: [{
        status: INITIAL_APPOINTMENT_STATUSES.includes(data.status as AppointmentStatus) 
          ? (data.status as AppointmentStatus) 
          : 'CONFIRMED',
        timestamp: Timestamp.now() as any,
      }],
      notes: data.notes || null,
      deposit: data.deposit || null,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
    };

    const docRef = await db.collection(COLLECTIONS.APPOINTMENTS).add(appointmentData);
    
    revalidatePath('/lich-hen');
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error('Error creating appointment:', error);
    throw new Error('Không thể tạo lịch hẹn: ' + error.message);
  }
}

export async function updateAppointment(id: string, data: AppointmentFormValues) {
  try {
    const docRef = db.collection(COLLECTIONS.APPOINTMENTS).doc(id);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) {
      throw new Error('Lịch hẹn không tồn tại');
    }
    
    const oldData = docSnap.data() as AppointmentDoc;
    
    const isLocked = oldData.status === 'COMPLETED' || oldData.status === 'CANCELLED' || !!oldData.invoiceId;

    if (isLocked) {
      // Chỉ cho phép cập nhật ghi chú khi đã khóa
      await docRef.update({
        notes: data.notes || null,
        updatedAt: serverTimestamp() as any,
      });
      revalidatePath('/lich-hen');
      return { success: true };
    }

    // Không cho phép cập nhật trạng thái qua form thông thường
    // Trạng thái chỉ được cập nhật qua updateAppointmentStatus
    // (UI sẽ disabled dropdown status khi edit)

    const updateData: Partial<AppointmentDoc> = {
      customerId: data.customerId,
      customerName: data.customerName,
      serviceId: data.serviceId || null,
      serviceName: data.serviceName || null,
      staffId: data.staffId || null,
      staffName: data.staffName || null,
      services: data.services || [],
      date: toTimestamp(data.date),
      startTime: data.startTime,
      endTime: data.endTime || null,
      // Bỏ status khỏi bản cập nhật chung
      notes: data.notes || null,
      deposit: data.deposit || null,
      updatedAt: serverTimestamp() as any,
    };

    await docRef.update(updateData);
    
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
export async function updateAppointmentStatus(id: string, status: AppointmentStatus, forceBypass: boolean = false) {
  try {
    const docRef = db.collection(COLLECTIONS.APPOINTMENTS).doc(id);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) {
      throw new Error('Lịch hẹn không tồn tại');
    }
    
    const oldData = docSnap.data() as AppointmentDoc;
    const allowedTransitions = APPOINTMENT_TRANSITIONS[oldData.status] || [];
    
    if (!forceBypass && !allowedTransitions.includes(status) && status !== oldData.status) {
      throw new Error(`Không thể chuyển trạng thái từ ${oldData.status} sang ${status}`);
    }

    await docRef.update({
      status,
      statusHistory: FieldValue.arrayUnion({
        status,
        timestamp: Timestamp.now(),
      }),
      updatedAt: serverTimestamp(),
    });
    revalidatePath('/lich-hen');
    return { success: true };
  } catch (error) {
    console.error('Error updating appointment status:', error);
    return { success: false, error: 'Không thể cập nhật trạng thái' };
  }
}

export async function cancelAppointment(
  id: string,
  data: { cancelReason: string; depositResolution?: 'REFUNDED' | 'CONFISCATED' }
) {
  try {
    const docRef = db.collection(COLLECTIONS.APPOINTMENTS).doc(id);
    
    await db.runTransaction(async (transaction) => {
      const docSnap = await transaction.get(docRef);
      
      if (!docSnap.exists) {
        throw new Error('Lịch hẹn không tồn tại');
      }
      
      const appointmentData = docSnap.data() as AppointmentDoc;

      if (appointmentData.invoiceId) {
        throw new Error('Không thể hủy vì lịch hẹn đã sinh Hóa đơn.');
      }

      if (appointmentData.deposit && appointmentData.deposit > 0 && !data.depositResolution) {
        throw new Error('Vui lòng chọn hướng xử lý tiền cọc.');
      }

      const updateData: Partial<AppointmentDoc> = {
        status: 'CANCELLED',
        cancelReason: data.cancelReason,
        updatedAt: serverTimestamp() as any,
      };

      if (data.depositResolution) {
        updateData.depositResolution = data.depositResolution;
      }

      // Generate penalty invoice if CONFISCATED
      if (data.depositResolution === 'CONFISCATED' && appointmentData.deposit && appointmentData.deposit > 0) {
        const dateNow = new Date();
        const invoiceCode = await generateInvoiceCodeInTx(transaction, dateNow);
        
        const invoiceRef = db.collection(COLLECTIONS.INVOICES).doc();
        
        const newInvoice = {
          invoiceCode,
          appointmentId: id,
          date: toTimestamp(dateNow),
          customerId: appointmentData.customerId,
          customerName: appointmentData.customerName,
          staffId: appointmentData.staffId || null,
          staffName: appointmentData.staffName || null,
          paymentMethodId: null,
          paymentMethodName: null,
          paymentAccountId: null,
          paymentAccountName: null,
          subTotal: appointmentData.deposit,
          discount: 0,
          surcharge: 0,
          totalAmount: appointmentData.deposit,
          status: 'COMPLETED',
          notes: 'Phí phạt hủy lịch từ tiền cọc',
          items: [{
            serviceId: 'penalty',
            serviceName: 'Phí phạt hủy lịch',
            serviceCode: 'PENALTY',
            quantity: 1,
            unitPrice: appointmentData.deposit,
            amount: appointmentData.deposit,
          }],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        
        transaction.set(invoiceRef, newInvoice);
        updateData.invoiceId = invoiceRef.id;
      }

      transaction.update(docRef, updateData);
    });
    
    revalidatePath('/lich-hen');
    return { success: true };
  } catch (error: any) {
    console.error('Error canceling appointment:', error);
    return { success: false, error: error.message || 'Không thể hủy lịch hẹn' };
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
        // Pre-fill item đầu tiên nếu có dịch vụ (legacy)
        serviceId: data.serviceId || null,
        serviceName: data.serviceName || null,
        services: data.services || [],
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

/**
 * Tìm kiếm dịch vụ với từ khóa, trả về danh sách giới hạn cho combobox
 */
export async function searchServices(query: string = '') {
  try {
    const q = query.trim().toLowerCase();
    
    const snapshot = await db.collection(COLLECTIONS.SERVICES)
      .where('isActive', '==', true)
      .get();
      
    let services = snapshot.docs.map(doc => {
      const data = doc.data() as ServiceDoc;
      return { id: doc.id, name: data.name, price: data.price, code: data.code, sortOrder: data.sortOrder || 999 };
    });

    if (q) {
      services = services.filter(s => 
        (s.name || '').toLowerCase().includes(q) || 
        (s.code || '').toLowerCase().includes(q)
      );
    }
    
    // Sắp xếp in-memory theo sortOrder, sau đó tên và giới hạn 20 kết quả
    return services.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return (a.name || '').localeCompare(b.name || '');
    }).slice(0, 20);
  } catch (error) {
    console.error('Error searching services:', error);
    throw new Error('Không thể tìm kiếm dịch vụ');
  }
}
