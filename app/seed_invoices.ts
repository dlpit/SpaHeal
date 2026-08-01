import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

async function seedInvoices() {
  console.log("Đang tải dữ liệu khách hàng và dịch vụ...");
  // get 1 customer
  const customersSnap = await db.collection('customers').limit(1).get();
  if (customersSnap.empty) {
    console.log("❌ Không tìm thấy khách hàng nào. Vui lòng tạo ít nhất 1 khách hàng trên UI trước.");
    return;
  }
  const customerDoc = customersSnap.docs[0];
  const customerId = customerDoc.id;
  const customerName = customerDoc.data().fullName;
  console.log(`✅ Khách hàng: ${customerName} (${customerId})`);

  // get some services
  const servicesSnap = await db.collection('services').limit(3).get();
  if (servicesSnap.empty) {
    console.log("❌ Không tìm thấy dịch vụ nào. Vui lòng tạo ít nhất 1 dịch vụ.");
    return;
  }
  
  // We'll map each service safely
  const services = servicesSnap.docs.map(d => {
    const data = d.data();
    return { id: d.id, name: data.name, code: data.code, price: data.price || 0 };
  });
  console.log(`✅ Đã tải ${services.length} dịch vụ.`);

  const items = services.map(s => ({
    serviceId: s.id,
    serviceName: s.name,
    serviceCode: s.code || 'N/A',
    quantity: 1,
    unitPrice: s.price,
    amount: s.price
  }));

  const subTotal = items.reduce((sum, item) => sum + item.amount, 0);

  console.log("Đang tạo 12 hoá đơn giả lập...");
  const batch = db.batch();
  
  for (let i = 0; i < 12; i++) {
    const invoiceRef = db.collection('invoices').doc();
    const date = new Date();
    date.setDate(date.getDate() - i); // Tạo hoá đơn cho các ngày gần đây
    
    const yy = date.getFullYear().toString().slice(-2);
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    const seq = String(200 + i).padStart(3, '0');
    const invoiceCode = `HD${yy}${mm}${dd}-${seq}`;

    // Tạo random discount
    const discount = i % 2 === 0 ? 50000 : 0;
    const totalAmount = Math.max(0, subTotal - discount);

    let status = 'COMPLETED';
    if (i === 3) status = 'CANCELLED';
    if (i === 4) status = 'DRAFT';

    batch.set(invoiceRef, {
      invoiceCode,
      date: Timestamp.fromDate(date),
      customerId,
      customerName,
      staffId: null,
      staffName: null,
      paymentMethodId: null,
      paymentMethodName: null,
      paymentAccountId: null,
      paymentAccountName: null,
      subTotal,
      discount,
      surcharge: 0,
      totalAmount,
      status,
      notes: `Hoá đơn tự động tạo (Mock data) ${i + 1}`,
      items: i === 4 ? [items[0]] : items, // Draft chỉ có 1 item
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Chỉ cập nhật thống kê cho hoá đơn COMPLETED
    if (status === 'COMPLETED') {
      batch.update(customerDoc.ref, {
        totalSpent: FieldValue.increment(totalAmount),
        visitCount: FieldValue.increment(1),
        lastVisit: Timestamp.fromDate(date),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  }

  await batch.commit();
  console.log("✅ Thành công! Đã thêm 12 hoá đơn giả lập vào hệ thống.");
}

seedInvoices().catch(console.error);
