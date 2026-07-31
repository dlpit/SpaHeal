// ============================================================================
// BU'S BEAUTY HIDEOUT - FIRESTORE SEED DATA
// Dữ liệu mẫu từ file Excel "BU'S BEAUTY HIDEOUT .xlsx"
// Chạy: npx tsx scripts/seed-firestore.ts
// ============================================================================

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from app directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ---- Firebase Admin init ----
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
  console.error('❌ Missing Firebase credentials in .env');
  console.error('   Required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
  process.exit(1);
}

const app = getApps().length === 0
  ? initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    })
  : getApps()[0];

const db = getFirestore(app);

// ---- Collection names ----
const COLLECTIONS = {
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

// ---- Helper ----
function ts(date: Date | string): Timestamp {
  return Timestamp.fromDate(typeof date === 'string' ? new Date(date) : date);
}

const now = FieldValue.serverTimestamp();

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

async function main() {
  console.log('🌱 Bắt đầu seed dữ liệu Firestore cho Bu\'s Beauty Hideout...\n');

  // =============================================
  // 1. SERVICE CATEGORIES
  // =============================================
  console.log('📂 Tạo nhóm dịch vụ...');

  const catGoiDauRef = db.collection(COLLECTIONS.SERVICE_CATEGORIES).doc();
  const catWaxingRef = db.collection(COLLECTIONS.SERVICE_CATEGORIES).doc();

  const catGoiDauId = catGoiDauRef.id;
  const catWaxingId = catWaxingRef.id;

  const batch1 = db.batch();
  batch1.set(catGoiDauRef, {
    name: 'GỘI ĐẦU DƯỠNG SINH',
    slug: 'goi-dau-duong-sinh',
    sortOrder: 1,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });
  batch1.set(catWaxingRef, {
    name: 'WAXING',
    slug: 'waxing',
    sortOrder: 2,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });
  await batch1.commit();
  console.log('   ✅ 2 nhóm dịch vụ đã được tạo.');

  // =============================================
  // 2. SERVICES
  // =============================================
  console.log('💆 Tạo dịch vụ...');

  const servicesData = [
    // --- GỘI ĐẦU DƯỠNG SINH ---
    { code: 'HS35',  name: 'Gội đầu dưỡng sinh Thư Giãn',           price: 35000,   categoryId: catGoiDauId, categoryName: 'GỘI ĐẦU DƯỠNG SINH', sortOrder: 1 },
    { code: 'HS79',  name: 'Gội đầu dưỡng sinh Lim Dim',            price: 79000,   categoryId: catGoiDauId, categoryName: 'GỘI ĐẦU DƯỠNG SINH', sortOrder: 2 },
    { code: 'HS149', name: 'Gội đầu dưỡng sinh Ngủ Ngon',           price: 149000,  categoryId: catGoiDauId, categoryName: 'GỘI ĐẦU DƯỠNG SINH', sortOrder: 3 },
    { code: 'TBCM',  name: 'Tẩy tế bào chết mặt',                   price: 10000,   categoryId: catGoiDauId, categoryName: 'GỘI ĐẦU DƯỠNG SINH', sortOrder: 4 },
    { code: 'TBCD',  name: 'Tẩy tế bào chết da đầu',                price: 10000,   categoryId: catGoiDauId, categoryName: 'GỘI ĐẦU DƯỠNG SINH', sortOrder: 5 },
    { code: 'WF',    name: 'Rửa mặt - Massage (Sữa rửa mặt)',      price: 20000,   categoryId: catGoiDauId, categoryName: 'GỘI ĐẦU DƯỠNG SINH', sortOrder: 6 },
    { code: 'FM',    name: 'Massage nâng cơ mặt (Kem massage)',     price: 30000,   categoryId: catGoiDauId, categoryName: 'GỘI ĐẦU DƯỠNG SINH', sortOrder: 7 },
    { code: 'AM',    name: 'Massage tay',                            price: 50000,   categoryId: catGoiDauId, categoryName: 'GỘI ĐẦU DƯỠNG SINH', sortOrder: 8 },
    { code: 'SM',    name: 'Massage vai',                            price: 50000,   categoryId: catGoiDauId, categoryName: 'GỘI ĐẦU DƯỠNG SINH', sortOrder: 9 },
    { code: 'CM',    name: 'Massage ngực',                           price: 50000,   categoryId: catGoiDauId, categoryName: 'GỘI ĐẦU DƯỠNG SINH', sortOrder: 10 },
    { code: 'HEC',   name: 'Chườm túi thảo dược mắt',              price: 5000,    categoryId: catGoiDauId, categoryName: 'GỘI ĐẦU DƯỠNG SINH', sortOrder: 11 },
    { code: 'HFC',   name: 'Chườm túi thảo dược lòng bàn chân',    price: 5000,    categoryId: catGoiDauId, categoryName: 'GỘI ĐẦU DƯỠNG SINH', sortOrder: 12 },
    { code: 'HC',    name: 'Chườm đá nóng tự vị',                   price: 5000,    categoryId: catGoiDauId, categoryName: 'GỘI ĐẦU DƯỠNG SINH', sortOrder: 13 },
    { code: 'HAF',   name: 'Đi vòi nước vòm',                       price: 10000,   categoryId: catGoiDauId, categoryName: 'GỘI ĐẦU DƯỠNG SINH', sortOrder: 14 },
    { code: 'NFM',   name: 'Mặt nạ thiên nhiên',                    price: 10000,   categoryId: catGoiDauId, categoryName: 'GỘI ĐẦU DƯỠNG SINH', sortOrder: 15 },
    { code: 'MASK',  name: 'Mặt nạ giấy',                           price: 20000,   categoryId: catGoiDauId, categoryName: 'GỘI ĐẦU DƯỠNG SINH', sortOrder: 16 },
    { code: 'HW',    name: 'Nước nóng',                              price: 10000,   categoryId: catGoiDauId, categoryName: 'GỘI ĐẦU DƯỠNG SINH', sortOrder: 17 },
    { code: 'SCD',   name: 'Dầu gội cặp',                           price: 10000,   categoryId: catGoiDauId, categoryName: 'GỘI ĐẦU DƯỠNG SINH', sortOrder: 18 },
    { code: 'CR',    name: 'Trượt giác',                             price: 20000,   categoryId: catGoiDauId, categoryName: 'GỘI ĐẦU DƯỠNG SINH', sortOrder: 19 },
    { code: 'PB',    name: 'Phủ bạc tóc',                           price: 50000,   categoryId: catGoiDauId, categoryName: 'GỘI ĐẦU DƯỠNG SINH', sortOrder: 20 },
    // --- WAXING ---
    { code: 'BSF',   name: 'Máy Nữ (Thiết kế)',                     price: 60000,   categoryId: catWaxingId, categoryName: 'WAXING', sortOrder: 1 },
    { code: 'BSM',   name: 'Máy Nam (Thiết kế)',                    price: 50000,   categoryId: catWaxingId, categoryName: 'WAXING', sortOrder: 2 },
    { code: 'BM',    name: 'Máy Nam',                               price: 50000,   categoryId: catWaxingId, categoryName: 'WAXING', sortOrder: 3 },
    { code: 'BF',    name: 'Máy Nữ',                                price: 50000,   categoryId: catWaxingId, categoryName: 'WAXING', sortOrder: 4 },
    { code: 'ULF',   name: 'Ria mép Nữ',                            price: 40000,   categoryId: catWaxingId, categoryName: 'WAXING', sortOrder: 5 },
    { code: 'ULM',   name: 'Ria mép Nam',                           price: 60000,   categoryId: catWaxingId, categoryName: 'WAXING', sortOrder: 6 },
    { code: 'FHF',   name: 'Đường viền trán Nữ',                   price: 70000,   categoryId: catWaxingId, categoryName: 'WAXING', sortOrder: 7 },
    { code: 'FHM',   name: 'Đường viền trán Nam',                  price: 80000,   categoryId: catWaxingId, categoryName: 'WAXING', sortOrder: 8 },
    { code: 'NHF',   name: 'Tóc gáy Nữ',                           price: 70000,   categoryId: catWaxingId, categoryName: 'WAXING', sortOrder: 9 },
    { code: 'NHM',   name: 'Tóc gáy Nam',                          price: 80000,   categoryId: catWaxingId, categoryName: 'WAXING', sortOrder: 10 },
    { code: 'BEM',   name: 'Râu Nam',                               price: 80000,   categoryId: catWaxingId, categoryName: 'WAXING', sortOrder: 11 },
    { code: 'UNF',   name: 'Nách Nữ',                               price: 50000,   categoryId: catWaxingId, categoryName: 'WAXING', sortOrder: 12 },
    { code: 'UNM',   name: 'Nách Nam',                              price: 70000,   categoryId: catWaxingId, categoryName: 'WAXING', sortOrder: 13 },
    { code: 'FAF',   name: 'Full tay Nữ',                           price: 180000,  categoryId: catWaxingId, categoryName: 'WAXING', sortOrder: 14 },
    { code: 'FAM',   name: 'Full tay Nam',                          price: 200000,  categoryId: catWaxingId, categoryName: 'WAXING', sortOrder: 15 },
    { code: 'HAFX',  name: '1/2 tay Nữ',                            price: 90000,   categoryId: catWaxingId, categoryName: 'WAXING', sortOrder: 16 },
    { code: 'HAM',   name: '1/2 tay Nam',                           price: 110000,  categoryId: catWaxingId, categoryName: 'WAXING', sortOrder: 17 },
    { code: 'HLF',   name: '1/2 chân Nữ',                           price: 180000,  categoryId: catWaxingId, categoryName: 'WAXING', sortOrder: 18 },
    { code: 'HLM',   name: '1/2 chân Nam',                          price: 200000,  categoryId: catWaxingId, categoryName: 'WAXING', sortOrder: 19 },
    { code: 'FLF',   name: 'Full chân Nữ',                          price: 280000,  categoryId: catWaxingId, categoryName: 'WAXING', sortOrder: 20 },
    { code: 'FLM',   name: 'Full chân Nam',                         price: 300000,  categoryId: catWaxingId, categoryName: 'WAXING', sortOrder: 21 },
    { code: 'CAF',   name: 'Ngực - Bụng Nữ',                       price: 280000,  categoryId: catWaxingId, categoryName: 'WAXING', sortOrder: 22 },
    { code: 'CAM',   name: 'Ngực - Bụng Nam',                      price: 300000,  categoryId: catWaxingId, categoryName: 'WAXING', sortOrder: 23 },
    { code: 'BAF',   name: 'Lưng Nữ',                               price: 290000,  categoryId: catWaxingId, categoryName: 'WAXING', sortOrder: 24 },
    { code: 'BAM',   name: 'Lưng Nam',                              price: 310000,  categoryId: catWaxingId, categoryName: 'WAXING', sortOrder: 25 },
    { code: 'BWF',   name: 'Bikini - Vùng hậu Nữ',                 price: 250000,  categoryId: catWaxingId, categoryName: 'WAXING', sortOrder: 26 },
    { code: 'BDF',   name: 'Bikini - Vùng hậu Nữ (tạo hình)',     price: 300000,  categoryId: catWaxingId, categoryName: 'WAXING', sortOrder: 27 },
  ];

  // Firestore batch max 500 operations — we have ~47 services, fine for one batch
  const batch2 = db.batch();
  const serviceRefs: Record<string, string> = {}; // code -> docId

  for (const svc of servicesData) {
    const ref = db.collection(COLLECTIONS.SERVICES).doc();
    serviceRefs[svc.code] = ref.id;
    batch2.set(ref, {
      ...svc,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }
  await batch2.commit();
  console.log(`   ✅ ${servicesData.length} dịch vụ đã được tạo.`);

  // =============================================
  // 3. STAFF
  // =============================================
  console.log('👩‍💼 Tạo nhân viên...');
  const staffData = [
    { code: 'BH', fullName: 'Bích Huyền', role: 'Nhân viên' },
    { code: 'MK', fullName: 'My Kha',     role: 'Nhân viên' },
  ];
  const staffRefs: Record<string, string> = {};
  const batch3 = db.batch();
  for (const s of staffData) {
    const ref = db.collection(COLLECTIONS.STAFF).doc();
    staffRefs[s.code] = ref.id;
    batch3.set(ref, { ...s, phone: null, isActive: true, createdAt: now, updatedAt: now });
  }
  await batch3.commit();
  console.log(`   ✅ ${staffData.length} nhân viên đã được tạo.`);

  // =============================================
  // 4. PAYMENT METHODS
  // =============================================
  console.log('💳 Tạo hình thức thanh toán...');
  const pmData = [
    { code: 'TM', name: 'Tiền mặt' },
    { code: 'QR', name: 'QR Code' },
    { code: 'CK', name: 'Chuyển khoản' },
  ];
  const pmRefs: Record<string, string> = {};
  const batch4 = db.batch();
  for (const pm of pmData) {
    const ref = db.collection(COLLECTIONS.PAYMENT_METHODS).doc();
    pmRefs[pm.code] = ref.id;
    batch4.set(ref, { ...pm, isActive: true, createdAt: now, updatedAt: now });
  }
  await batch4.commit();
  console.log(`   ✅ ${pmData.length} hình thức thanh toán đã được tạo.`);

  // =============================================
  // 5. PAYMENT ACCOUNTS
  // =============================================
  console.log('🏦 Tạo tài khoản ngân hàng...');
  const paData = [
    { code: 'MB',  bankName: 'MB BANK' },
    { code: 'VCB', bankName: 'VIETCOMBANK' },
  ];
  const paRefs: Record<string, string> = {};
  const batch5 = db.batch();
  for (const pa of paData) {
    const ref = db.collection(COLLECTIONS.PAYMENT_ACCOUNTS).doc();
    paRefs[pa.code] = ref.id;
    batch5.set(ref, { ...pa, accountNumber: null, accountName: null, isActive: true, createdAt: now, updatedAt: now });
  }
  await batch5.commit();
  console.log(`   ✅ ${paData.length} tài khoản ngân hàng đã được tạo.`);

  // =============================================
  // 6. EXPENSE CATEGORIES
  // =============================================
  console.log('📊 Tạo danh mục chi phí...');

  type Nature = 'FIXED' | 'SEMI_FIXED' | 'VARIABLE' | 'ONE_TIME';
  const ecData: { code: string; nature: Nature; group: string; itemName: string; serviceGroup: string }[] = [
    { code: 'CP001', nature: 'FIXED',      group: 'Thuê mặt bằng', itemName: 'Thuê mặt bằng',    serviceGroup: 'Chung' },
    { code: 'CP002', nature: 'SEMI_FIXED', group: 'Điện',           itemName: 'Điện',              serviceGroup: 'Chung' },
    { code: 'CP003', nature: 'SEMI_FIXED', group: 'Nước',           itemName: 'Nước',              serviceGroup: 'Chung' },
    { code: 'CP004', nature: 'FIXED',      group: 'Internet',       itemName: 'Wifi',              serviceGroup: 'Chung' },
    { code: 'CP005', nature: 'FIXED',      group: 'Phần mềm',      itemName: 'Capcut',            serviceGroup: 'Chung' },
    { code: 'CP006', nature: 'VARIABLE',   group: 'Sửa chữa',      itemName: 'Sửa chữa',         serviceGroup: 'Chung' },
    // Gội Đầu Dưỡng Sinh
    { code: 'CP007', nature: 'VARIABLE', group: 'Dụng cụ bổ trợ', itemName: 'Cây massage da đầu',       serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP008', nature: 'VARIABLE', group: 'Dụng cụ bổ trợ', itemName: 'Lược chải massage da đầu', serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP009', nature: 'VARIABLE', group: 'Dụng cụ bổ trợ', itemName: 'Túi chườm mắt thảo dược',  serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP010', nature: 'VARIABLE', group: 'Dụng cụ bổ trợ', itemName: 'Túi chườm chân thảo dược', serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP011', nature: 'VARIABLE', group: 'Dụng cụ bổ trợ', itemName: 'Đá nóng',                  serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP012', nature: 'VARIABLE', group: 'Dụng cụ bổ trợ', itemName: 'Khăn trải giường',         serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP013', nature: 'VARIABLE', group: 'Dụng cụ bổ trợ', itemName: 'Khăn đắp',                 serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP014', nature: 'VARIABLE', group: 'Dụng cụ bổ trợ', itemName: 'Khăn gối',                 serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP015', nature: 'VARIABLE', group: 'Dụng cụ bổ trợ', itemName: 'Áo quây',                  serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP016', nature: 'VARIABLE', group: 'Dụng cụ bổ trợ', itemName: 'Giỏ đựng quần áo khách',  serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP017', nature: 'VARIABLE', group: 'Dụng cụ bổ trợ', itemName: 'Xe đẩy 3 tầng',           serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP018', nature: 'VARIABLE', group: 'Dụng cụ bổ trợ', itemName: 'Sịt đồ dơ',               serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP019', nature: 'VARIABLE', group: 'Dụng cụ bổ trợ', itemName: 'Gối gác chân',            serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP020', nature: 'VARIABLE', group: 'Dụng cụ bổ trợ', itemName: 'Lược chải tóc',           serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP021', nature: 'VARIABLE', group: 'Dụng cụ bổ trợ', itemName: 'Tinh dầu',                serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP022', nature: 'VARIABLE', group: 'Vật tư', itemName: 'Sữa rửa mặt Mocha',              serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP023', nature: 'VARIABLE', group: 'Vật tư', itemName: 'Sữa rửa mặt Hatomugi',           serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP024', nature: 'VARIABLE', group: 'Vật tư', itemName: 'Xịt dưỡng Kassi',                 serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP025', nature: 'VARIABLE', group: 'Vật tư', itemName: 'Kem massage Mira',                 serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP026', nature: 'VARIABLE', group: 'Vật tư', itemName: 'Kem tẩy tế bào chết da đầu TWG',  serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP027', nature: 'VARIABLE', group: 'Vật tư', itemName: 'Kem tẩy tế bào chết da Images',   serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP028', nature: 'VARIABLE', group: 'Vật tư', itemName: 'Dầu gội Ôliu',                    serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP029', nature: 'VARIABLE', group: 'Vật tư', itemName: 'Dầu xả Ôliu',                     serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP030', nature: 'VARIABLE', group: 'Vật tư', itemName: 'Dầu gội Dove',                    serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP031', nature: 'VARIABLE', group: 'Vật tư', itemName: 'Dầu gội Hachi',                   serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP032', nature: 'VARIABLE', group: 'Vật tư', itemName: 'Dầu xải Hachi',                   serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP033', nature: 'VARIABLE', group: 'Vật tư', itemName: 'Dầu gội Tigi',                    serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP034', nature: 'VARIABLE', group: 'Vật tư', itemName: 'Dầu xả Tigi',                     serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP035', nature: 'VARIABLE', group: 'Vật tư', itemName: 'Bông tẩy trang',                  serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP036', nature: 'VARIABLE', group: 'Vật tư', itemName: 'Nước tẩy trang',                  serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP037', nature: 'VARIABLE', group: 'Vật tư', itemName: 'Dầu xả ủ tóc Hair mask Collagen', serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP038', nature: 'VARIABLE', group: 'Vật tư', itemName: 'Mặt nạ giấy',                     serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP039', nature: 'VARIABLE', group: 'Vật tư', itemName: 'Mặt nạ tảo xoắn',                serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    // Thiết bị - Gội Đầu
    { code: 'CP0040', nature: 'ONE_TIME', group: 'Thiết bị', itemName: 'Máy làm nóng',          serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP0041', nature: 'ONE_TIME', group: 'Thiết bị', itemName: 'Máy massage chân',      serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP0042', nature: 'ONE_TIME', group: 'Thiết bị', itemName: 'Máy xông tinh dầu',     serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP0043', nature: 'ONE_TIME', group: 'Thiết bị', itemName: 'Giường gội',             serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    // Waxing
    { code: 'CP0044', nature: 'VARIABLE', group: 'Dụng cụ bổ trợ', itemName: 'Thùng rác',       serviceGroup: 'Waxing' },
    { code: 'CP0045', nature: 'VARIABLE', group: 'Dụng cụ bổ trợ', itemName: 'Tấm lót nylon',   serviceGroup: 'Waxing' },
    { code: 'CP0046', nature: 'VARIABLE', group: 'Dụng cụ bổ trợ', itemName: 'Túi rác',         serviceGroup: 'Waxing' },
    { code: 'CP0047', nature: 'VARIABLE', group: 'Dụng cụ bổ trợ', itemName: 'Khẩu trang',      serviceGroup: 'Waxing' },
    { code: 'CP0048', nature: 'VARIABLE', group: 'Dụng cụ bổ trợ', itemName: 'Găng tay',        serviceGroup: 'Waxing' },
    { code: 'CP0049', nature: 'VARIABLE', group: 'Dụng cụ bổ trợ', itemName: 'Khăn giấy khô',   serviceGroup: 'Waxing' },
    { code: 'CP0050', nature: 'VARIABLE', group: 'Dụng cụ bổ trợ', itemName: 'Khăn vải khô',    serviceGroup: 'Waxing' },
    { code: 'CP0051', nature: 'VARIABLE', group: 'Vật tư',         itemName: 'Sáp',             serviceGroup: 'Waxing' },
    { code: 'CP0052', nature: 'VARIABLE', group: 'Vật tư',         itemName: 'Sáp lên',         serviceGroup: 'Waxing' },
    { code: 'CP0053', nature: 'VARIABLE', group: 'Vật tư',         itemName: 'Phấn rôm Baby Johnson', serviceGroup: 'Waxing' },
    { code: 'CP0054', nature: 'VARIABLE', group: 'Vật tư',         itemName: 'Nước muối',       serviceGroup: 'Waxing' },
    { code: 'CP0055', nature: 'VARIABLE', group: 'Vật tư',         itemName: 'Que gỡ lớn',      serviceGroup: 'Waxing' },
    { code: 'CP0056', nature: 'VARIABLE', group: 'Vật tư',         itemName: 'Que gỡ nhỏ',      serviceGroup: 'Waxing' },
    { code: 'CP0057', nature: 'VARIABLE', group: 'Vật tư',         itemName: 'Dưỡng sau Wax',   serviceGroup: 'Waxing' },
    { code: 'CP0058', nature: 'VARIABLE', group: 'Vật tư',         itemName: 'Mặt nạ dẻo bạc hà', serviceGroup: 'Waxing' },
    // Thiết bị - Waxing
    { code: 'CP0059', nature: 'ONE_TIME', group: 'Thiết bị', itemName: 'Nồi sáp',               serviceGroup: 'Waxing' },
    { code: 'CP0060', nature: 'ONE_TIME', group: 'Thiết bị', itemName: 'Gương',                 serviceGroup: 'Waxing' },
    { code: 'CP0061', nature: 'ONE_TIME', group: 'Thiết bị', itemName: 'Kéo',                   serviceGroup: 'Waxing' },
    { code: 'CP0062', nature: 'ONE_TIME', group: 'Thiết bị', itemName: 'Nhíp',                  serviceGroup: 'Waxing' },
    { code: 'CP0063', nature: 'ONE_TIME', group: 'Thiết bị', itemName: 'Máy làm nóng sáp lên',  serviceGroup: 'Waxing' },
  ];

  const ecRefs: Record<string, string> = {};
  // Split into batches of 450 (Firestore limit 500)
  for (let i = 0; i < ecData.length; i += 450) {
    const chunk = ecData.slice(i, i + 450);
    const batch = db.batch();
    for (const ec of chunk) {
      const ref = db.collection(COLLECTIONS.EXPENSE_CATEGORIES).doc();
      ecRefs[ec.code] = ref.id;
      batch.set(ref, { ...ec, isActive: true, createdAt: now, updatedAt: now });
    }
    await batch.commit();
  }
  console.log(`   ✅ ${ecData.length} danh mục chi phí đã được tạo.`);

  // =============================================
  // 7. CUSTOMERS
  // =============================================
  console.log('👤 Tạo khách hàng mẫu...');
  type Gender = 'MALE' | 'FEMALE' | 'OTHER';
  const customersData: { fullName: string; phone: string; gender: Gender; notes: string | null }[] = [
    { fullName: 'Nguyễn Thị Lan',     phone: '0901234567', gender: 'FEMALE', notes: 'Khách quen - thích gội đầu dưỡng sinh' },
    { fullName: 'Trần Văn Minh',      phone: '0912345678', gender: 'MALE',   notes: 'Khách nam - hay waxing' },
    { fullName: 'Lê Thị Hồng',        phone: '0923456789', gender: 'FEMALE', notes: 'Khách VIP' },
    { fullName: 'Phạm Đức Anh',       phone: '0934567890', gender: 'MALE',   notes: null },
    { fullName: 'Võ Thị Mai',          phone: '0945678901', gender: 'FEMALE', notes: 'Thích combo gội + massage' },
    { fullName: 'Hoàng Minh Tuấn',    phone: '0956789012', gender: 'MALE',   notes: null },
    { fullName: 'Đặng Thị Thanh',     phone: '0967890123', gender: 'FEMALE', notes: 'Da nhạy cảm' },
    { fullName: 'Bùi Quốc Huy',       phone: '0978901234', gender: 'MALE',   notes: null },
    { fullName: 'Ngô Thị Yến',        phone: '0989012345', gender: 'FEMALE', notes: 'Đặt lịch trước qua Zalo' },
    { fullName: 'Phan Thanh Long',     phone: '0990123456', gender: 'MALE',   notes: null },
  ];

  const customerRefs: Record<string, string> = {};
  const batch6 = db.batch();
  for (const c of customersData) {
    const ref = db.collection(COLLECTIONS.CUSTOMERS).doc();
    customerRefs[c.phone] = ref.id;
    batch6.set(ref, {
      ...c,
      email: null,
      address: null,
      birthday: null,
      totalSpent: 0,
      visitCount: 0,
      lastVisit: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }
  await batch6.commit();
  console.log(`   ✅ ${customersData.length} khách hàng mẫu đã được tạo.`);

  // =============================================
  // 8. INVOICES
  // =============================================
  console.log('🧾 Tạo hóa đơn mẫu...');

  // Helper to lookup service by code
  const svcByCode = (code: string) => {
    const svc = servicesData.find(s => s.code === code);
    return svc ? { id: serviceRefs[code], name: svc.name, code: svc.code, price: svc.price } : null;
  };

  const invoicesData = [
    {
      invoiceCode: 'HD001', date: '2026-07-01',
      customerPhone: '0901234567', staffCode: 'BH', pmCode: 'TM', paCode: null,
      discount: 0, surcharge: 0, notes: 'Khách quen',
      items: [
        { code: 'HS79', qty: 1 }, { code: 'WF', qty: 1 }, { code: 'HEC', qty: 1 },
      ],
    },
    {
      invoiceCode: 'HD002', date: '2026-07-02',
      customerPhone: '0912345678', staffCode: 'MK', pmCode: 'QR', paCode: 'MB',
      discount: 10000, surcharge: 0, notes: null,
      items: [
        { code: 'BEM', qty: 1 }, { code: 'NHM', qty: 1 },
      ],
    },
    {
      invoiceCode: 'HD003', date: '2026-07-05',
      customerPhone: '0923456789', staffCode: 'BH', pmCode: 'CK', paCode: 'VCB',
      discount: 0, surcharge: 5000, notes: 'Phụ thu thêm tinh dầu',
      items: [
        { code: 'HS149', qty: 1 }, { code: 'FM', qty: 1 }, { code: 'AM', qty: 1 },
        { code: 'MASK', qty: 1 }, { code: 'HFC', qty: 1 },
      ],
    },
    {
      invoiceCode: 'HD004', date: '2026-07-08',
      customerPhone: '0945678901', staffCode: 'MK', pmCode: 'TM', paCode: null,
      discount: 5000, surcharge: 0, notes: null,
      items: [
        { code: 'HS35', qty: 1 }, { code: 'WF', qty: 1 },
      ],
    },
    {
      invoiceCode: 'HD005', date: '2026-07-10',
      customerPhone: '0934567890', staffCode: 'BH', pmCode: 'QR', paCode: 'MB',
      discount: 0, surcharge: 0, notes: null,
      items: [
        { code: 'UNF', qty: 1 }, { code: 'FAF', qty: 1 },
      ],
    },
    {
      invoiceCode: 'HD006', date: '2026-07-12',
      customerPhone: '0967890123', staffCode: 'BH', pmCode: 'CK', paCode: 'VCB',
      discount: 15000, surcharge: 0, notes: 'Khách da nhạy cảm - chú ý sản phẩm',
      items: [
        { code: 'HS149', qty: 1 }, { code: 'WF', qty: 1 }, { code: 'FM', qty: 1 },
      ],
    },
    {
      invoiceCode: 'HD007', date: '2026-07-15',
      customerPhone: '0956789012', staffCode: 'MK', pmCode: 'TM', paCode: null,
      discount: 0, surcharge: 0, notes: null,
      items: [
        { code: 'HS35', qty: 1 },
      ],
    },
    {
      invoiceCode: 'HD008', date: '2026-07-18',
      customerPhone: '0989012345', staffCode: 'BH', pmCode: 'QR', paCode: 'MB',
      discount: 20000, surcharge: 0, notes: 'Combo ưu đãi',
      items: [
        { code: 'HS79', qty: 1 }, { code: 'AM', qty: 1 }, { code: 'MASK', qty: 1 },
        { code: 'HEC', qty: 1 }, { code: 'HFC', qty: 1 },
      ],
    },
    {
      invoiceCode: 'HD009', date: '2026-07-22',
      customerPhone: '0978901234', staffCode: 'MK', pmCode: 'CK', paCode: 'VCB',
      discount: 0, surcharge: 0, notes: null,
      items: [
        { code: 'BSF', qty: 1 },
      ],
    },
    {
      invoiceCode: 'HD010', date: '2026-07-25',
      customerPhone: '0990123456', staffCode: 'BH', pmCode: 'TM', paCode: null,
      discount: 0, surcharge: 10000, notes: 'Phụ thu dầu gội đặc biệt',
      items: [
        { code: 'HS149', qty: 1 }, { code: 'FM', qty: 1 }, { code: 'MASK', qty: 1 },
      ],
    },
  ];

  const invoiceBatch = db.batch();
  for (const inv of invoicesData) {
    const items = inv.items.map(i => {
      const svc = svcByCode(i.code)!;
      return {
        serviceId: svc.id,
        serviceName: svc.name,
        serviceCode: svc.code,
        quantity: i.qty,
        unitPrice: svc.price,
        amount: svc.price * i.qty,
      };
    });

    const subTotal = items.reduce((s, i) => s + i.amount, 0);
    const totalAmount = subTotal - inv.discount + inv.surcharge;
    const customer = customersData.find(c => c.phone === inv.customerPhone)!;
    const staff = staffData.find(s => s.code === inv.staffCode)!;
    const pm = pmData.find(p => p.code === inv.pmCode)!;
    const pa = inv.paCode ? paData.find(p => p.code === inv.paCode)! : null;

    const ref = db.collection(COLLECTIONS.INVOICES).doc();
    invoiceBatch.set(ref, {
      invoiceCode: inv.invoiceCode,
      date: ts(inv.date),
      customerId: customerRefs[inv.customerPhone],
      customerName: customer.fullName,
      staffId: staffRefs[inv.staffCode],
      staffName: staff.fullName,
      paymentMethodId: pmRefs[inv.pmCode],
      paymentMethodName: pm.name,
      paymentAccountId: inv.paCode ? paRefs[inv.paCode] : null,
      paymentAccountName: pa ? pa.bankName : null,
      subTotal,
      discount: inv.discount,
      surcharge: inv.surcharge,
      totalAmount,
      status: 'COMPLETED',
      notes: inv.notes,
      items,
      createdAt: now,
      updatedAt: now,
    });

    // Update customer stats
    const custRef = db.collection(COLLECTIONS.CUSTOMERS).doc(customerRefs[inv.customerPhone]);
    invoiceBatch.update(custRef, {
      totalSpent: FieldValue.increment(totalAmount),
      visitCount: FieldValue.increment(1),
      lastVisit: ts(inv.date),
      updatedAt: now,
    });
  }
  await invoiceBatch.commit();
  console.log(`   ✅ ${invoicesData.length} hóa đơn mẫu đã được tạo.`);

  // =============================================
  // 9. EXPENSES
  // =============================================
  console.log('💸 Tạo chi phí mẫu...');
  const expensesData = [
    { date: '2026-07-01', ecCode: 'CP001', amount: 5000000, description: 'Thuê mặt bằng tháng 7/2026' },
    { date: '2026-07-01', ecCode: 'CP004', amount: 200000,  description: 'Internet tháng 7/2026' },
    { date: '2026-07-15', ecCode: 'CP002', amount: 850000,  description: 'Tiền điện tháng 7/2026' },
    { date: '2026-07-15', ecCode: 'CP003', amount: 350000,  description: 'Tiền nước tháng 7/2026' },
    { date: '2026-07-05', ecCode: 'CP028', amount: 180000,  description: 'Nhập dầu gội Ôliu x3 chai' },
    { date: '2026-07-10', ecCode: 'CP0051', amount: 250000, description: 'Nhập sáp waxing x5 hộp' },
  ];

  const expBatch = db.batch();
  for (const exp of expensesData) {
    const ec = ecData.find(e => e.code === exp.ecCode)!;
    const ref = db.collection(COLLECTIONS.EXPENSES).doc();
    expBatch.set(ref, {
      date: ts(exp.date),
      expenseCategoryId: ecRefs[exp.ecCode],
      categoryName: ec.itemName,
      categoryGroup: ec.group,
      amount: exp.amount,
      quantity: 1,
      description: exp.description,
      notes: null,
      createdAt: now,
      updatedAt: now,
    });
  }
  await expBatch.commit();
  console.log(`   ✅ ${expensesData.length} bản ghi chi phí mẫu đã được tạo.`);

  // =============================================
  // 10. APPOINTMENTS
  // =============================================
  console.log('📅 Tạo lịch hẹn mẫu...');
  type AptStatus = 'CONFIRMED' | 'DEPOSIT';
  const aptsData: { customerPhone: string; date: string; startTime: string; endTime: string; status: AptStatus; deposit?: number; notes: string }[] = [
    { customerPhone: '0901234567', date: '2026-08-01', startTime: '09:00', endTime: '10:30', status: 'CONFIRMED', notes: 'Gội đầu dưỡng sinh Ngủ Ngon + Massage mặt' },
    { customerPhone: '0923456789', date: '2026-08-01', startTime: '14:00', endTime: '15:00', status: 'CONFIRMED', notes: 'Combo gội đầu + mặt nạ' },
    { customerPhone: '0912345678', date: '2026-08-02', startTime: '10:00', endTime: '11:00', status: 'DEPOSIT', deposit: 50000, notes: 'Waxing full tay - đã cọc 50k' },
    { customerPhone: '0989012345', date: '2026-08-03', startTime: '15:30', endTime: '17:00', status: 'CONFIRMED', notes: 'Combo VIP' },
  ];

  const aptBatch = db.batch();
  for (const apt of aptsData) {
    const customer = customersData.find(c => c.phone === apt.customerPhone)!;
    const ref = db.collection(COLLECTIONS.APPOINTMENTS).doc();
    aptBatch.set(ref, {
      customerId: customerRefs[apt.customerPhone],
      customerName: customer.fullName,
      date: ts(apt.date),
      startTime: apt.startTime,
      endTime: apt.endTime,
      status: apt.status,
      notes: apt.notes,
      deposit: apt.deposit || null,
      createdAt: now,
      updatedAt: now,
    });
  }
  await aptBatch.commit();
  console.log(`   ✅ ${aptsData.length} lịch hẹn mẫu đã được tạo.`);

  // =============================================
  // 11. SUPPLIERS & INVENTORY
  // =============================================
  console.log('📦 Tạo nhà cung cấp và kho vật tư mẫu...');

  // Suppliers
  const sup1Ref = db.collection(COLLECTIONS.SUPPLIERS).doc();
  const sup2Ref = db.collection(COLLECTIONS.SUPPLIERS).doc();

  const supBatch = db.batch();
  supBatch.set(sup1Ref, {
    name: 'Công ty TNHH Mỹ Phẩm Hachi', contactName: 'Anh Tuấn',
    phone: '0281234567', email: null, address: 'Quận 10, TP.HCM', notes: null,
    isActive: true, createdAt: now, updatedAt: now,
  });
  supBatch.set(sup2Ref, {
    name: 'Đại lý Waxing Supplies VN', contactName: 'Chị Hương',
    phone: '0287654321', email: null, address: 'Quận Bình Thạnh, TP.HCM', notes: null,
    isActive: true, createdAt: now, updatedAt: now,
  });
  await supBatch.commit();

  // Inventory
  const inventoryData = [
    { code: 'VT001', name: 'Dầu gội Ôliu',             unit: 'Chai',  quantity: 12, costPrice: 60000,  supplierId: sup1Ref.id, supplierName: 'Công ty TNHH Mỹ Phẩm Hachi' },
    { code: 'VT002', name: 'Dầu xả Ôliu',              unit: 'Chai',  quantity: 10, costPrice: 65000,  supplierId: sup1Ref.id, supplierName: 'Công ty TNHH Mỹ Phẩm Hachi' },
    { code: 'VT003', name: 'Dầu gội Hachi',             unit: 'Chai',  quantity: 8,  costPrice: 85000,  supplierId: sup1Ref.id, supplierName: 'Công ty TNHH Mỹ Phẩm Hachi' },
    { code: 'VT004', name: 'Dầu xải Hachi',             unit: 'Chai',  quantity: 8,  costPrice: 90000,  supplierId: sup1Ref.id, supplierName: 'Công ty TNHH Mỹ Phẩm Hachi' },
    { code: 'VT005', name: 'Dầu gội Tigi',              unit: 'Chai',  quantity: 5,  costPrice: 120000, supplierId: sup1Ref.id, supplierName: 'Công ty TNHH Mỹ Phẩm Hachi' },
    { code: 'VT006', name: 'Kem massage Mira',          unit: 'Hộp',   quantity: 6,  costPrice: 95000,  supplierId: sup1Ref.id, supplierName: 'Công ty TNHH Mỹ Phẩm Hachi' },
    { code: 'VT007', name: 'Sữa rửa mặt Mocha',        unit: 'Chai',  quantity: 4,  costPrice: 75000,  supplierId: sup1Ref.id, supplierName: 'Công ty TNHH Mỹ Phẩm Hachi' },
    { code: 'VT008', name: 'Mặt nạ giấy',               unit: 'Miếng', quantity: 50, costPrice: 8000,   supplierId: sup1Ref.id, supplierName: 'Công ty TNHH Mỹ Phẩm Hachi' },
    { code: 'VT009', name: 'Tinh dầu',                  unit: 'Lọ',    quantity: 3,  costPrice: 150000, supplierId: sup1Ref.id, supplierName: 'Công ty TNHH Mỹ Phẩm Hachi' },
    { code: 'VT010', name: 'Sáp waxing',                unit: 'Hộp',   quantity: 15, costPrice: 50000,  supplierId: sup2Ref.id, supplierName: 'Đại lý Waxing Supplies VN' },
    { code: 'VT011', name: 'Sáp lên',                   unit: 'Hộp',   quantity: 10, costPrice: 45000,  supplierId: sup2Ref.id, supplierName: 'Đại lý Waxing Supplies VN' },
    { code: 'VT012', name: 'Que gỡ lớn',                unit: 'Gói',   quantity: 20, costPrice: 25000,  supplierId: sup2Ref.id, supplierName: 'Đại lý Waxing Supplies VN' },
    { code: 'VT013', name: 'Que gỡ nhỏ',                unit: 'Gói',   quantity: 20, costPrice: 20000,  supplierId: sup2Ref.id, supplierName: 'Đại lý Waxing Supplies VN' },
    { code: 'VT014', name: 'Dưỡng sau Wax',             unit: 'Chai',  quantity: 7,  costPrice: 80000,  supplierId: sup2Ref.id, supplierName: 'Đại lý Waxing Supplies VN' },
    { code: 'VT015', name: 'Găng tay',                  unit: 'Hộp',   quantity: 5,  costPrice: 120000, supplierId: sup2Ref.id, supplierName: 'Đại lý Waxing Supplies VN' },
    { code: 'VT016', name: 'Phấn rôm Baby Johnson',     unit: 'Chai',  quantity: 3,  costPrice: 55000,  supplierId: sup2Ref.id, supplierName: 'Đại lý Waxing Supplies VN' },
    { code: 'VT017', name: 'Khẩu trang',                unit: 'Hộp',   quantity: 4,  costPrice: 60000,  supplierId: sup2Ref.id, supplierName: 'Đại lý Waxing Supplies VN' },
    { code: 'VT018', name: 'Bông tẩy trang',            unit: 'Gói',   quantity: 10, costPrice: 35000,  supplierId: sup1Ref.id, supplierName: 'Công ty TNHH Mỹ Phẩm Hachi' },
    { code: 'VT019', name: 'Kem tẩy tế bào chết da TWG', unit: 'Hộp', quantity: 3,  costPrice: 110000, supplierId: sup1Ref.id, supplierName: 'Công ty TNHH Mỹ Phẩm Hachi' },
    { code: 'VT020', name: 'Xịt dưỡng Kassi',           unit: 'Chai',  quantity: 5,  costPrice: 70000,  supplierId: sup1Ref.id, supplierName: 'Công ty TNHH Mỹ Phẩm Hachi' },
  ];

  const invBatch = db.batch();
  for (const item of inventoryData) {
    const itemRef = db.collection(COLLECTIONS.INVENTORY_ITEMS).doc();
    invBatch.set(itemRef, {
      code: item.code,
      name: item.name,
      unit: item.unit,
      quantity: item.quantity,
      minQuantity: Math.max(2, Math.floor(item.quantity / 3)),
      costPrice: item.costPrice,
      supplierId: item.supplierId,
      supplierName: item.supplierName,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    // Stock transaction
    const txRef = db.collection(COLLECTIONS.STOCK_TRANSACTIONS).doc();
    invBatch.set(txRef, {
      inventoryItemId: itemRef.id,
      itemName: item.name,
      type: 'IMPORT',
      quantity: item.quantity,
      unitCost: item.costPrice,
      totalCost: item.costPrice * item.quantity,
      date: ts('2026-07-01'),
      notes: 'Nhập kho ban đầu',
      createdAt: now,
    });
  }
  await invBatch.commit();
  console.log(`   ✅ ${inventoryData.length} vật tư kho đã được tạo.`);

  // =============================================
  // DONE
  // =============================================
  console.log('\n🎉 Seed dữ liệu Firestore hoàn tất!');
  console.log('📊 Tóm tắt:');
  console.log(`   - 2 nhóm dịch vụ`);
  console.log(`   - ${servicesData.length} dịch vụ`);
  console.log(`   - ${staffData.length} nhân viên`);
  console.log(`   - ${pmData.length} hình thức thanh toán`);
  console.log(`   - ${paData.length} tài khoản ngân hàng`);
  console.log(`   - ${ecData.length} danh mục chi phí`);
  console.log(`   - ${customersData.length} khách hàng`);
  console.log(`   - ${invoicesData.length} hóa đơn`);
  console.log(`   - ${aptsData.length} lịch hẹn`);
  console.log(`   - ${inventoryData.length} vật tư kho`);
}

main()
  .then(() => {
    console.log('\n✅ Script hoàn thành. Thoát...');
    process.exit(0);
  })
  .catch((e) => {
    console.error('❌ Seed thất bại:', e);
    process.exit(1);
  });
