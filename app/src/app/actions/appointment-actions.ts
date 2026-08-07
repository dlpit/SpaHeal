'use server';

import { db } from '@/lib/firebase';
import { COLLECTIONS, AppointmentDoc, AppointmentStatus, StaffDoc, ServiceDoc, StatusHistoryLog } from '@/lib/firestore-types';
import { serializeDoc, serverTimestamp, toTimestamp, generateInvoiceCodeInTx } from '@/lib/firestore-helpers';
import { AppointmentFormValues } from '@/lib/schemas/appointment';
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';
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
// Dùng pattern HOF để truyền startDate, endDate vào key của unstable_cache
const getAppointmentsCached = (startDateStr: string, endDateStr: string) => unstable_cache(
  async (): Promise<ClientAppointmentDoc[]> => {
  try {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);

    const snapshot = await db.collection(COLLECTIONS.APPOINTMENTS)
      .where('date', '>=', Timestamp.fromDate(start))
      .where('date', '<=', Timestamp.fromDate(end))
      .orderBy('date', 'asc')
      // Đã giới hạn theo Date Range nên không cần limit hẹp, có thể dùng số lớn để đảm bảo an toàn hoặc bỏ limit
      .limit(1000) 
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
    return [];
  }
}, ['appointments', startDateStr, endDateStr], { revalidate: 60, tags: ['appointments'] });

export async function getAppointments(startDate: Date, endDate: Date): Promise<ClientAppointmentDoc[]> {
  return getAppointmentsCached(startDate.toISOString(), endDate.toISOString())();
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
    revalidateTag('appointments', undefined as any);
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

    const isLocked = oldData.status === 'COMPLETED' || oldData.status === 'CANCELLED';

    if (isLocked) {
      // Chỉ cho phép cập nhật ghi chú khi đã khóa
      await docRef.update({
        notes: data.notes || null,
        updatedAt: serverTimestamp() as any,
      });
      revalidatePath('/lich-hen');
      revalidateTag('appointments', undefined as any);
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
    revalidateTag('appointments', undefined as any);
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
    revalidateTag('appointments', undefined as any);
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

    const updatePayload: Record<string, any> = {
      status,
      statusHistory: FieldValue.arrayUnion({
        status,
        timestamp: Timestamp.now(),
      }),
      updatedAt: serverTimestamp(),
    };

    // Khi Mở lại lịch (Re-open) từ CANCELLED/NO_SHOW sang CONFIRMED/DEPOSIT:
    // Xóa các metadata hủy/hóa đơn phạt cũ trên appointment doc để lịch hoạt động bình thường như một lịch hẹn mới active.
    if (['CANCELLED', 'NO_SHOW'].includes(oldData.status) && ['CONFIRMED', 'DEPOSIT'].includes(status)) {
      updatePayload.invoiceId = FieldValue.delete();
      updatePayload.cancelReason = FieldValue.delete();
      updatePayload.depositResolution = FieldValue.delete();
    }

    await docRef.update(updatePayload);
    revalidatePath('/lich-hen');
    revalidatePath('/doanh-thu');
    revalidatePath('/');
    revalidateTag('appointments', undefined as any);
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
    revalidateTag('appointments', undefined as any);
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
    revalidateTag('appointments', undefined as any);
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
const getStaffForAppointmentCached = unstable_cache(
  async () => {
  try {
    const snapshot = await db.collection(COLLECTIONS.STAFF)
      .where('isActive', '==', true)
      .limit(50)
      .get();
    return snapshot.docs.map(doc => {
      const data = doc.data() as StaffDoc;
      return { id: doc.id, fullName: data.fullName, code: data.code };
    });
  } catch (error) {
    console.error('Error getting staff:', error);
    return [];
  }
}, ['staff-for-appointment'], { revalidate: 3600 });

export async function getStaffForAppointment() {
  return getStaffForAppointmentCached();
}

/**
 * Lấy danh sách Dịch vụ active để dùng trong form tạo/sửa lịch hẹn
 */
const getServicesForAppointmentCached = unstable_cache(
  async () => {
  try {
    const snapshot = await db.collection(COLLECTIONS.SERVICES)
      .where('isActive', '==', true)
      .limit(50)
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
}, ['services-for-appointment'], { revalidate: 3600 });

export async function getServicesForAppointment() {
  return getServicesForAppointmentCached();
}

/**
 * Tìm kiếm dịch vụ với từ khóa, trả về danh sách giới hạn cho combobox
 */
const searchServicesCached = (query: string) => unstable_cache(
  async () => {
  try {
    const q = query.trim().toLowerCase();

    const snapshot = await db.collection(COLLECTIONS.SERVICES)
      .where('isActive', '==', true)
      .limit(100) // Tăng lên 100 để mở rộng phạm vi tìm kiếm in-memory
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
}, ['search-services', query], { revalidate: 3600 });

export async function searchServices(query: string = '') {
  return searchServicesCached(query)();
}

import { refundInvoiceInTx } from '@/lib/invoice-helpers';

/**
 * Mở lại lịch (Reopen): Thực hiện Refund hóa đơn phạt cũ (nếu có) và Clone sang một Lịch B mới với trạng thái DEPOSIT
 */
export async function reopenAppointmentAsClone(
  oldId: string, 
  cancelledBy?: string
): Promise<{ success: true; newAppointment: ClientAppointmentDoc } | { success: false; error: string }> {
  try {
    const oldDocRef = db.collection(COLLECTIONS.APPOINTMENTS).doc(oldId);
    let clonedAppointment: ClientAppointmentDoc | null = null;

    await db.runTransaction(async (transaction) => {
      const oldSnap = await transaction.get(oldDocRef);
      if (!oldSnap.exists) {
        throw new Error('Lịch hẹn cũ không tồn tại');
      }

      const oldData = oldSnap.data() as AppointmentDoc;
      if (!['CANCELLED', 'NO_SHOW'].includes(oldData.status)) {
        throw new Error('Chỉ có thể Reopen lịch đã bị hủy (CANCELLED/NO_SHOW)');
      }

      // 1. Auto-Refund hóa đơn phạt nếu có
      if (oldData.invoiceId) {
        await refundInvoiceInTx(
          transaction,
          oldData.invoiceId,
          `Hoàn tiền tự động do Mở lại lịch (Reopen) từ Lịch ID: ${oldId}`,
          cancelledBy || 'System',
          true // isPenalty = true (Bỏ qua trừ điểm/visit)
        );
      }

      // 2. Clone thông tin lịch cũ sang lịch mới (Lịch B)
      const newAppointmentData: AppointmentDoc = {
        customerId: oldData.customerId,
        customerName: oldData.customerName,
        serviceId: oldData.serviceId || null,
        serviceName: oldData.serviceName || null,
        staffId: oldData.staffId || null,
        staffName: oldData.staffName || null,
        services: oldData.services || [],
        date: oldData.date, // Sẽ được lễ tân đổi sau trên UI
        startTime: oldData.startTime, // Sẽ được lễ tân đổi sau trên UI
        endTime: oldData.endTime || null,
        status: 'DEPOSIT', // Khởi tạo với DEPOSIT vì tiền cọc được bảo toàn
        statusHistory: [{
          status: 'DEPOSIT',
          timestamp: Timestamp.now() as any,
        }],
        notes: `[Lịch Reopen từ hủy] ${oldData.notes || ''}`.trim(),
        deposit: oldData.deposit || 0,
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
      };

      const newDocRef = db.collection(COLLECTIONS.APPOINTMENTS).doc();
      transaction.set(newDocRef, newAppointmentData);

      // Cập nhật lại lịch cũ để ghi chú đã được Reopen (Optional - Audit Trail)
      transaction.update(oldDocRef, {
        notes: `Đã được nhân bản sang Lịch mới (Reopened). ${oldData.notes || ''}`.trim(),
        updatedAt: serverTimestamp() as any,
      });

      // Lưu lại thông tin Lịch B để trả về client
      // Lưu ý: Timestamp.now() được dùng tạm thời cho dữ liệu client để tránh lỗi render
      clonedAppointment = serializeDoc(newDocRef.id, {
        ...newAppointmentData,
        date: newAppointmentData.date,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      } as any) as ClientAppointmentDoc;
    });

    revalidatePath('/lich-hen');
    revalidatePath('/doanh-thu');
    revalidatePath('/chi-phi'); // Bổ sung reload chi-phi vì có sinh Expense phiếu chi
    revalidatePath('/');
    revalidateTag('appointments', undefined as any);

    if (!clonedAppointment) {
      throw new Error("Lỗi khi clone lịch hẹn");
    }

    return { success: true, newAppointment: clonedAppointment };
  } catch (error: any) {
    console.error('Error reopening appointment as clone:', error);
    return { success: false, error: error.message || 'Không thể Reopen lịch hẹn' };
  }
}
