// ============================================================================
// BU'S BEAUTY HIDEOUT - SEED DATA
// Dữ liệu mẫu từ file Excel "BU'S BEAUTY HIDEOUT .xlsx"
// ============================================================================

import { PrismaClient, Gender, AppointmentStatus, InvoiceStatus, ExpenseNature, StockTransactionType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Bắt đầu seed dữ liệu cho Bu\'s Beauty Hideout...\n');

  // =============================================
  // 1. SERVICE CATEGORIES (Nhóm dịch vụ)
  // =============================================
  console.log('📂 Tạo nhóm dịch vụ...');
  const catGoiDau = await prisma.serviceCategory.upsert({
    where: { slug: 'goi-dau-duong-sinh' },
    update: {},
    create: {
      name: 'GỘI ĐẦU DƯỠNG SINH',
      slug: 'goi-dau-duong-sinh',
      sortOrder: 1,
    },
  });

  const catWaxing = await prisma.serviceCategory.upsert({
    where: { slug: 'waxing' },
    update: {},
    create: {
      name: 'WAXING',
      slug: 'waxing',
      sortOrder: 2,
    },
  });

  // =============================================
  // 2. SERVICES (Dịch vụ)
  // Dữ liệu từ sheet "Cài đặt hệ thống" - Cột A-D
  // =============================================
  console.log('💆 Tạo dịch vụ...');

  const servicesData = [
    // --- GỘI ĐẦU DƯỠNG SINH ---
    { code: 'HS35',  name: 'Gội đầu dưỡng sinh Thư Giãn',           price: 35000,   categoryId: catGoiDau.id, sortOrder: 1 },
    { code: 'HS79',  name: 'Gội đầu dưỡng sinh Lim Dim',            price: 79000,   categoryId: catGoiDau.id, sortOrder: 2 },
    { code: 'HS149', name: 'Gội đầu dưỡng sinh Ngủ Ngon',           price: 149000,  categoryId: catGoiDau.id, sortOrder: 3 },
    { code: 'TBCM',  name: 'Tẩy tế bào chết mặt',                   price: 10000,   categoryId: catGoiDau.id, sortOrder: 4 },
    { code: 'TBCD',  name: 'Tẩy tế bào chết da đầu',                price: 10000,   categoryId: catGoiDau.id, sortOrder: 5 },
    { code: 'WF',    name: 'Rửa mặt - Massage (Sữa rửa mặt)',      price: 20000,   categoryId: catGoiDau.id, sortOrder: 6 },
    { code: 'FM',    name: 'Massage nâng cơ mặt (Kem massage)',     price: 30000,   categoryId: catGoiDau.id, sortOrder: 7 },
    { code: 'AM',    name: 'Massage tay',                            price: 50000,   categoryId: catGoiDau.id, sortOrder: 8 },
    { code: 'SM',    name: 'Massage vai',                            price: 50000,   categoryId: catGoiDau.id, sortOrder: 9 },
    { code: 'CM',    name: 'Massage ngực',                           price: 50000,   categoryId: catGoiDau.id, sortOrder: 10 },
    { code: 'HEC',   name: 'Chườm túi thảo dược mắt',              price: 5000,    categoryId: catGoiDau.id, sortOrder: 11 },
    { code: 'HFC',   name: 'Chườm túi thảo dược lòng bàn chân',    price: 5000,    categoryId: catGoiDau.id, sortOrder: 12 },
    { code: 'HC',    name: 'Chườm đá nóng tự vị',                   price: 5000,    categoryId: catGoiDau.id, sortOrder: 13 },
    { code: 'HAF',   name: 'Đi vòi nước vòm',                       price: 10000,   categoryId: catGoiDau.id, sortOrder: 14 },
    { code: 'NFM',   name: 'Mặt nạ thiên nhiên',                    price: 10000,   categoryId: catGoiDau.id, sortOrder: 15 },
    { code: 'MASK',  name: 'Mặt nạ giấy',                           price: 20000,   categoryId: catGoiDau.id, sortOrder: 16 },
    { code: 'HW',    name: 'Nước nóng',                              price: 10000,   categoryId: catGoiDau.id, sortOrder: 17 },
    { code: 'SCD',   name: 'Dầu gội cặp',                           price: 10000,   categoryId: catGoiDau.id, sortOrder: 18 },
    { code: 'CR',    name: 'Trượt giác',                             price: 20000,   categoryId: catGoiDau.id, sortOrder: 19 },
    { code: 'PB',    name: 'Phủ bạc tóc',                           price: 50000,   categoryId: catGoiDau.id, sortOrder: 20 },

    // --- WAXING ---
    { code: 'BSF',   name: 'Máy Nữ (Thiết kế)',                     price: 60000,   categoryId: catWaxing.id, sortOrder: 1 },
    { code: 'BSM',   name: 'Máy Nam (Thiết kế)',                    price: 50000,   categoryId: catWaxing.id, sortOrder: 2 },
    { code: 'BM',    name: 'Máy Nam',                               price: 50000,   categoryId: catWaxing.id, sortOrder: 3 },
    { code: 'BF',    name: 'Máy Nữ',                                price: 50000,   categoryId: catWaxing.id, sortOrder: 4 },
    { code: 'ULF',   name: 'Ria mép Nữ',                            price: 40000,   categoryId: catWaxing.id, sortOrder: 5 },
    { code: 'ULM',   name: 'Ria mép Nam',                           price: 60000,   categoryId: catWaxing.id, sortOrder: 6 },
    { code: 'FHF',   name: 'Đường viền trán Nữ',                   price: 70000,   categoryId: catWaxing.id, sortOrder: 7 },
    { code: 'FHM',   name: 'Đường viền trán Nam',                  price: 80000,   categoryId: catWaxing.id, sortOrder: 8 },
    { code: 'NHF',   name: 'Tóc gáy Nữ',                           price: 70000,   categoryId: catWaxing.id, sortOrder: 9 },
    { code: 'NHM',   name: 'Tóc gáy Nam',                          price: 80000,   categoryId: catWaxing.id, sortOrder: 10 },
    { code: 'BEM',   name: 'Râu Nam',                               price: 80000,   categoryId: catWaxing.id, sortOrder: 11 },
    { code: 'UNF',   name: 'Nách Nữ',                               price: 50000,   categoryId: catWaxing.id, sortOrder: 12 },
    { code: 'UNM',   name: 'Nách Nam',                              price: 70000,   categoryId: catWaxing.id, sortOrder: 13 },
    { code: 'FAF',   name: 'Full tay Nữ',                           price: 180000,  categoryId: catWaxing.id, sortOrder: 14 },
    { code: 'FAM',   name: 'Full tay Nam',                          price: 200000,  categoryId: catWaxing.id, sortOrder: 15 },
    { code: 'HAFX',  name: '1/2 tay Nữ',                            price: 90000,   categoryId: catWaxing.id, sortOrder: 16 },
    { code: 'HAM',   name: '1/2 tay Nam',                           price: 110000,  categoryId: catWaxing.id, sortOrder: 17 },
    { code: 'HLF',   name: '1/2 chân Nữ',                           price: 180000,  categoryId: catWaxing.id, sortOrder: 18 },
    { code: 'HLM',   name: '1/2 chân Nam',                          price: 200000,  categoryId: catWaxing.id, sortOrder: 19 },
    { code: 'FLF',   name: 'Full chân Nữ',                          price: 280000,  categoryId: catWaxing.id, sortOrder: 20 },
    { code: 'FLM',   name: 'Full chân Nam',                         price: 300000,  categoryId: catWaxing.id, sortOrder: 21 },
    { code: 'CAF',   name: 'Ngực - Bụng Nữ',                       price: 280000,  categoryId: catWaxing.id, sortOrder: 22 },
    { code: 'CAM',   name: 'Ngực - Bụng Nam',                      price: 300000,  categoryId: catWaxing.id, sortOrder: 23 },
    { code: 'BAF',   name: 'Lưng Nữ',                               price: 290000,  categoryId: catWaxing.id, sortOrder: 24 },
    { code: 'BAM',   name: 'Lưng Nam',                              price: 310000,  categoryId: catWaxing.id, sortOrder: 25 },
    { code: 'BWF',   name: 'Bikini - Vùng hậu Nữ',                 price: 250000,  categoryId: catWaxing.id, sortOrder: 26 },
    { code: 'BDF',   name: 'Bikini - Vùng hậu Nữ (tạo hình)',     price: 300000,  categoryId: catWaxing.id, sortOrder: 27 },
  ];

  for (const svc of servicesData) {
    await prisma.service.upsert({
      where: { code: svc.code },
      update: { name: svc.name, price: svc.price, sortOrder: svc.sortOrder },
      create: svc,
    });
  }
  console.log(`   ✅ ${servicesData.length} dịch vụ đã được tạo.`);

  // =============================================
  // 3. STAFF (Nhân viên)
  // Dữ liệu từ sheet "Cài đặt hệ thống" - Cột F-G
  // =============================================
  console.log('👩‍💼 Tạo nhân viên...');

  const staffData = [
    { code: 'BH', fullName: 'Bích Huyền', role: 'Nhân viên' },
    { code: 'MK', fullName: 'My Kha',     role: 'Nhân viên' },
  ];

  for (const s of staffData) {
    await prisma.staff.upsert({
      where: { code: s.code },
      update: { fullName: s.fullName },
      create: s,
    });
  }
  console.log(`   ✅ ${staffData.length} nhân viên đã được tạo.`);

  // =============================================
  // 4. PAYMENT METHODS (Hình thức thanh toán)
  // Dữ liệu từ sheet "Cài đặt hệ thống" - Cột I-J
  // =============================================
  console.log('💳 Tạo hình thức thanh toán...');

  const paymentMethodsData = [
    { code: 'TM', name: 'Tiền mặt' },
    { code: 'QR', name: 'QR Code' },
    { code: 'CK', name: 'Chuyển khoản' },
  ];

  for (const pm of paymentMethodsData) {
    await prisma.paymentMethod.upsert({
      where: { code: pm.code },
      update: { name: pm.name },
      create: pm,
    });
  }
  console.log(`   ✅ ${paymentMethodsData.length} hình thức thanh toán đã được tạo.`);

  // =============================================
  // 5. PAYMENT ACCOUNTS (Tài khoản ngân hàng)
  // Dữ liệu từ sheet "Cài đặt hệ thống" - Cột F (dòng STK)
  // =============================================
  console.log('🏦 Tạo tài khoản ngân hàng...');

  const paymentAccountsData = [
    { code: 'MB',  bankName: 'MB BANK' },
    { code: 'VCB', bankName: 'VIETCOMBANK' },
  ];

  for (const pa of paymentAccountsData) {
    await prisma.paymentAccount.upsert({
      where: { code: pa.code },
      update: { bankName: pa.bankName },
      create: pa,
    });
  }
  console.log(`   ✅ ${paymentAccountsData.length} tài khoản ngân hàng đã được tạo.`);

  // =============================================
  // 6. EXPENSE CATEGORIES (Danh mục chi phí)
  // Dữ liệu từ sheet "Cài đặt hệ thống" - Cột M-P (Chung), R-U (Gội đầu), W-Z (Waxing)
  // =============================================
  console.log('📊 Tạo danh mục chi phí...');

  const expenseCategoriesData = [
    // --- CHI PHÍ VẬN HÀNH CHUNG ---
    { code: 'CP001', nature: ExpenseNature.FIXED,       group: 'Thuê mặt bằng',  itemName: 'Thuê mặt bằng',     serviceGroup: 'Chung' },
    { code: 'CP002', nature: ExpenseNature.SEMI_FIXED,  group: 'Điện',            itemName: 'Điện',               serviceGroup: 'Chung' },
    { code: 'CP003', nature: ExpenseNature.SEMI_FIXED,  group: 'Nước',            itemName: 'Nước',               serviceGroup: 'Chung' },
    { code: 'CP004', nature: ExpenseNature.FIXED,       group: 'Internet',        itemName: 'Wifi',               serviceGroup: 'Chung' },
    { code: 'CP005', nature: ExpenseNature.FIXED,       group: 'Phần mềm',       itemName: 'Capcut',             serviceGroup: 'Chung' },
    { code: 'CP006', nature: ExpenseNature.VARIABLE,    group: 'Sửa chữa',       itemName: 'Sửa chữa',          serviceGroup: 'Chung' },

    // --- CHI PHÍ VẬT TƯ - GỘI ĐẦU DƯỠNG SINH ---
    { code: 'CP007', nature: ExpenseNature.VARIABLE, group: 'Dụng cụ bổ trợ',   itemName: 'Cây massage da đầu',          serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP008', nature: ExpenseNature.VARIABLE, group: 'Dụng cụ bổ trợ',   itemName: 'Lược chải massage da đầu',    serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP009', nature: ExpenseNature.VARIABLE, group: 'Dụng cụ bổ trợ',   itemName: 'Túi chườm mắt thảo dược',    serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP010', nature: ExpenseNature.VARIABLE, group: 'Dụng cụ bổ trợ',   itemName: 'Túi chườm chân thảo dược',   serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP011', nature: ExpenseNature.VARIABLE, group: 'Dụng cụ bổ trợ',   itemName: 'Đá nóng',                     serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP012', nature: ExpenseNature.VARIABLE, group: 'Dụng cụ bổ trợ',   itemName: 'Khăn trải giường',            serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP013', nature: ExpenseNature.VARIABLE, group: 'Dụng cụ bổ trợ',   itemName: 'Khăn đắp',                    serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP014', nature: ExpenseNature.VARIABLE, group: 'Dụng cụ bổ trợ',   itemName: 'Khăn gối',                    serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP015', nature: ExpenseNature.VARIABLE, group: 'Dụng cụ bổ trợ',   itemName: 'Áo quây',                     serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP016', nature: ExpenseNature.VARIABLE, group: 'Dụng cụ bổ trợ',   itemName: 'Giỏ đựng quần áo khách',     serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP017', nature: ExpenseNature.VARIABLE, group: 'Dụng cụ bổ trợ',   itemName: 'Xe đẩy 3 tầng',              serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP018', nature: ExpenseNature.VARIABLE, group: 'Dụng cụ bổ trợ',   itemName: 'Sịt đồ dơ',                  serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP019', nature: ExpenseNature.VARIABLE, group: 'Dụng cụ bổ trợ',   itemName: 'Gối gác chân',               serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP020', nature: ExpenseNature.VARIABLE, group: 'Dụng cụ bổ trợ',   itemName: 'Lược chải tóc',              serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP021', nature: ExpenseNature.VARIABLE, group: 'Dụng cụ bổ trợ',   itemName: 'Tinh dầu',                    serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP022', nature: ExpenseNature.VARIABLE, group: 'Vật tư',            itemName: 'Sữa rửa mặt Mocha',         serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP023', nature: ExpenseNature.VARIABLE, group: 'Vật tư',            itemName: 'Sữa rửa mặt Hatomugi',      serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP024', nature: ExpenseNature.VARIABLE, group: 'Vật tư',            itemName: 'Xịt dưỡng Kassi',            serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP025', nature: ExpenseNature.VARIABLE, group: 'Vật tư',            itemName: 'Kem massage Mira',            serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP026', nature: ExpenseNature.VARIABLE, group: 'Vật tư',            itemName: 'Kem tẩy tế bào chết da đầu TWG', serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP027', nature: ExpenseNature.VARIABLE, group: 'Vật tư',            itemName: 'Kem tẩy tế bào chết da Images',   serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP028', nature: ExpenseNature.VARIABLE, group: 'Vật tư',            itemName: 'Dầu gội Ôliu',               serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP029', nature: ExpenseNature.VARIABLE, group: 'Vật tư',            itemName: 'Dầu xả Ôliu',                serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP030', nature: ExpenseNature.VARIABLE, group: 'Vật tư',            itemName: 'Dầu gội Dove',               serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP031', nature: ExpenseNature.VARIABLE, group: 'Vật tư',            itemName: 'Dầu gội Hachi',              serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP032', nature: ExpenseNature.VARIABLE, group: 'Vật tư',            itemName: 'Dầu xải Hachi',              serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP033', nature: ExpenseNature.VARIABLE, group: 'Vật tư',            itemName: 'Dầu gội Tigi',               serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP034', nature: ExpenseNature.VARIABLE, group: 'Vật tư',            itemName: 'Dầu xả Tigi',                serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP035', nature: ExpenseNature.VARIABLE, group: 'Vật tư',            itemName: 'Bông tẩy trang',             serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP036', nature: ExpenseNature.VARIABLE, group: 'Vật tư',            itemName: 'Nước tẩy trang',             serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP037', nature: ExpenseNature.VARIABLE, group: 'Vật tư',            itemName: 'Dầu xả ủ tóc Hair mask Collagen', serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP038', nature: ExpenseNature.VARIABLE, group: 'Vật tư',            itemName: 'Mặt nạ giấy',                serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP039', nature: ExpenseNature.VARIABLE, group: 'Vật tư',            itemName: 'Mặt nạ tảo xoắn',           serviceGroup: 'Gội Đầu Dưỡng Sinh' },

    // --- CHI PHÍ THIẾT BỊ - GỘI ĐẦU DƯỠNG SINH ---
    { code: 'CP0040', nature: ExpenseNature.ONE_TIME, group: 'Thiết bị', itemName: 'Máy làm nóng',          serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP0041', nature: ExpenseNature.ONE_TIME, group: 'Thiết bị', itemName: 'Máy massage chân',      serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP0042', nature: ExpenseNature.ONE_TIME, group: 'Thiết bị', itemName: 'Máy xông tinh dầu',     serviceGroup: 'Gội Đầu Dưỡng Sinh' },
    { code: 'CP0043', nature: ExpenseNature.ONE_TIME, group: 'Thiết bị', itemName: 'Giường gội',             serviceGroup: 'Gội Đầu Dưỡng Sinh' },

    // --- CHI PHÍ VẬT TƯ - WAXING ---
    { code: 'CP0044', nature: ExpenseNature.VARIABLE, group: 'Dụng cụ bổ trợ', itemName: 'Thùng rác',               serviceGroup: 'Waxing' },
    { code: 'CP0045', nature: ExpenseNature.VARIABLE, group: 'Dụng cụ bổ trợ', itemName: 'Tấm lót nylon',           serviceGroup: 'Waxing' },
    { code: 'CP0046', nature: ExpenseNature.VARIABLE, group: 'Dụng cụ bổ trợ', itemName: 'Túi rác',                 serviceGroup: 'Waxing' },
    { code: 'CP0047', nature: ExpenseNature.VARIABLE, group: 'Dụng cụ bổ trợ', itemName: 'Khẩu trang',              serviceGroup: 'Waxing' },
    { code: 'CP0048', nature: ExpenseNature.VARIABLE, group: 'Dụng cụ bổ trợ', itemName: 'Găng tay',                serviceGroup: 'Waxing' },
    { code: 'CP0049', nature: ExpenseNature.VARIABLE, group: 'Dụng cụ bổ trợ', itemName: 'Khăn giấy khô',           serviceGroup: 'Waxing' },
    { code: 'CP0050', nature: ExpenseNature.VARIABLE, group: 'Dụng cụ bổ trợ', itemName: 'Khăn vải khô',            serviceGroup: 'Waxing' },
    { code: 'CP0051', nature: ExpenseNature.VARIABLE, group: 'Vật tư',          itemName: 'Sáp',                     serviceGroup: 'Waxing' },
    { code: 'CP0052', nature: ExpenseNature.VARIABLE, group: 'Vật tư',          itemName: 'Sáp lên',                 serviceGroup: 'Waxing' },
    { code: 'CP0053', nature: ExpenseNature.VARIABLE, group: 'Vật tư',          itemName: 'Phấn rôm Baby Johnson',   serviceGroup: 'Waxing' },
    { code: 'CP0054', nature: ExpenseNature.VARIABLE, group: 'Vật tư',          itemName: 'Nước muối',               serviceGroup: 'Waxing' },
    { code: 'CP0055', nature: ExpenseNature.VARIABLE, group: 'Vật tư',          itemName: 'Que gỡ lớn',              serviceGroup: 'Waxing' },
    { code: 'CP0056', nature: ExpenseNature.VARIABLE, group: 'Vật tư',          itemName: 'Que gỡ nhỏ',              serviceGroup: 'Waxing' },
    { code: 'CP0057', nature: ExpenseNature.VARIABLE, group: 'Vật tư',          itemName: 'Dưỡng sau Wax',           serviceGroup: 'Waxing' },
    { code: 'CP0058', nature: ExpenseNature.VARIABLE, group: 'Vật tư',          itemName: 'Mặt nạ dẻo bạc hà',     serviceGroup: 'Waxing' },

    // --- CHI PHÍ THIẾT BỊ - WAXING ---
    { code: 'CP0059', nature: ExpenseNature.ONE_TIME, group: 'Thiết bị', itemName: 'Nồi sáp',                serviceGroup: 'Waxing' },
    { code: 'CP0060', nature: ExpenseNature.ONE_TIME, group: 'Thiết bị', itemName: 'Gương',                  serviceGroup: 'Waxing' },
    { code: 'CP0061', nature: ExpenseNature.ONE_TIME, group: 'Thiết bị', itemName: 'Kéo',                    serviceGroup: 'Waxing' },
    { code: 'CP0062', nature: ExpenseNature.ONE_TIME, group: 'Thiết bị', itemName: 'Nhíp',                   serviceGroup: 'Waxing' },
    { code: 'CP0063', nature: ExpenseNature.ONE_TIME, group: 'Thiết bị', itemName: 'Máy làm nóng sáp lên',  serviceGroup: 'Waxing' },
  ];

  for (const ec of expenseCategoriesData) {
    await prisma.expenseCategory.upsert({
      where: { code: ec.code },
      update: { nature: ec.nature, group: ec.group, itemName: ec.itemName, serviceGroup: ec.serviceGroup },
      create: ec,
    });
  }
  console.log(`   ✅ ${expenseCategoriesData.length} danh mục chi phí đã được tạo.`);

  // =============================================
  // 7. SAMPLE CUSTOMERS (Khách hàng mẫu)
  // =============================================
  console.log('👤 Tạo khách hàng mẫu...');

  const customersData = [
    { fullName: 'Nguyễn Thị Lan',     phone: '0901234567', gender: Gender.FEMALE, notes: 'Khách quen - thích gội đầu dưỡng sinh' },
    { fullName: 'Trần Văn Minh',      phone: '0912345678', gender: Gender.MALE,   notes: 'Khách nam - hay waxing' },
    { fullName: 'Lê Thị Hồng',        phone: '0923456789', gender: Gender.FEMALE, notes: 'Khách VIP' },
    { fullName: 'Phạm Đức Anh',       phone: '0934567890', gender: Gender.MALE,   notes: null },
    { fullName: 'Võ Thị Mai',          phone: '0945678901', gender: Gender.FEMALE, notes: 'Thích combo gội + massage' },
    { fullName: 'Hoàng Minh Tuấn',    phone: '0956789012', gender: Gender.MALE,   notes: null },
    { fullName: 'Đặng Thị Thanh',     phone: '0967890123', gender: Gender.FEMALE, notes: 'Da nhạy cảm' },
    { fullName: 'Bùi Quốc Huy',       phone: '0978901234', gender: Gender.MALE,   notes: null },
    { fullName: 'Ngô Thị Yến',        phone: '0989012345', gender: Gender.FEMALE, notes: 'Đặt lịch trước qua Zalo' },
    { fullName: 'Phan Thanh Long',     phone: '0990123456', gender: Gender.MALE,   notes: null },
  ];

  const customers: Record<string, any> = {};
  for (const c of customersData) {
    const customer = await prisma.customer.upsert({
      where: { phone: c.phone },
      update: { fullName: c.fullName },
      create: c,
    });
    customers[c.phone] = customer;
  }
  console.log(`   ✅ ${customersData.length} khách hàng mẫu đã được tạo.`);

  // =============================================
  // 8. SAMPLE INVOICES (Hóa đơn mẫu)
  // =============================================
  console.log('🧾 Tạo hóa đơn mẫu...');

  // Lấy references
  const staffBH = await prisma.staff.findUnique({ where: { code: 'BH' } });
  const staffMK = await prisma.staff.findUnique({ where: { code: 'MK' } });
  const pmTM = await prisma.paymentMethod.findUnique({ where: { code: 'TM' } });
  const pmQR = await prisma.paymentMethod.findUnique({ where: { code: 'QR' } });
  const pmCK = await prisma.paymentMethod.findUnique({ where: { code: 'CK' } });
  const paMB = await prisma.paymentAccount.findUnique({ where: { code: 'MB' } });
  const paVCB = await prisma.paymentAccount.findUnique({ where: { code: 'VCB' } });

  // Lấy services
  const svcHS35 = await prisma.service.findUnique({ where: { code: 'HS35' } });
  const svcHS79 = await prisma.service.findUnique({ where: { code: 'HS79' } });
  const svcHS149 = await prisma.service.findUnique({ where: { code: 'HS149' } });
  const svcWF = await prisma.service.findUnique({ where: { code: 'WF' } });
  const svcFM = await prisma.service.findUnique({ where: { code: 'FM' } });
  const svcAM = await prisma.service.findUnique({ where: { code: 'AM' } });
  const svcMASK = await prisma.service.findUnique({ where: { code: 'MASK' } });
  const svcUNF = await prisma.service.findUnique({ where: { code: 'UNF' } });
  const svcFAF = await prisma.service.findUnique({ where: { code: 'FAF' } });
  const svcBSF = await prisma.service.findUnique({ where: { code: 'BSF' } });
  const svcHEC = await prisma.service.findUnique({ where: { code: 'HEC' } });
  const svcHFC = await prisma.service.findUnique({ where: { code: 'HFC' } });
  const svcBEM = await prisma.service.findUnique({ where: { code: 'BEM' } });
  const svcNHM = await prisma.service.findUnique({ where: { code: 'NHM' } });

  if (!staffBH || !staffMK || !pmTM || !pmQR || !pmCK || !paMB || !paVCB) {
    throw new Error('Missing required reference data');
  }
  if (!svcHS35 || !svcHS79 || !svcHS149 || !svcWF || !svcFM || !svcAM || !svcMASK || !svcUNF || !svcFAF || !svcBSF || !svcHEC || !svcHFC || !svcBEM || !svcNHM) {
    throw new Error('Missing required service data');
  }

  const invoicesData = [
    {
      invoiceCode: 'HD001',
      date: new Date('2026-07-01'),
      customerId: customers['0901234567'].id,
      staffId: staffBH.id,
      paymentMethodId: pmTM.id,
      paymentAccountId: null,
      discount: 0,
      surcharge: 0,
      notes: 'Khách quen',
      items: [
        { serviceId: svcHS79!.id, unitPrice: 79000 },
        { serviceId: svcWF!.id,   unitPrice: 20000 },
        { serviceId: svcHEC!.id,  unitPrice: 5000 },
      ],
    },
    {
      invoiceCode: 'HD002',
      date: new Date('2026-07-02'),
      customerId: customers['0912345678'].id,
      staffId: staffMK.id,
      paymentMethodId: pmQR.id,
      paymentAccountId: paMB.id,
      discount: 10000,
      surcharge: 0,
      notes: null,
      items: [
        { serviceId: svcBEM!.id, unitPrice: 80000 },
        { serviceId: svcNHM!.id, unitPrice: 80000 },
      ],
    },
    {
      invoiceCode: 'HD003',
      date: new Date('2026-07-05'),
      customerId: customers['0923456789'].id,
      staffId: staffBH.id,
      paymentMethodId: pmCK.id,
      paymentAccountId: paVCB.id,
      discount: 0,
      surcharge: 5000,
      notes: 'Phụ thu thêm tinh dầu',
      items: [
        { serviceId: svcHS149!.id, unitPrice: 149000 },
        { serviceId: svcFM!.id,    unitPrice: 30000 },
        { serviceId: svcAM!.id,    unitPrice: 50000 },
        { serviceId: svcMASK!.id,  unitPrice: 20000 },
        { serviceId: svcHFC!.id,   unitPrice: 5000 },
      ],
    },
    {
      invoiceCode: 'HD004',
      date: new Date('2026-07-08'),
      customerId: customers['0945678901'].id,
      staffId: staffMK.id,
      paymentMethodId: pmTM.id,
      paymentAccountId: null,
      discount: 5000,
      surcharge: 0,
      notes: null,
      items: [
        { serviceId: svcHS35!.id, unitPrice: 35000 },
        { serviceId: svcWF!.id,   unitPrice: 20000 },
      ],
    },
    {
      invoiceCode: 'HD005',
      date: new Date('2026-07-10'),
      customerId: customers['0934567890'].id,
      staffId: staffBH.id,
      paymentMethodId: pmQR.id,
      paymentAccountId: paMB.id,
      discount: 0,
      surcharge: 0,
      notes: null,
      items: [
        { serviceId: svcUNF!.id, unitPrice: 50000 },
        { serviceId: svcFAF!.id, unitPrice: 180000 },
      ],
    },
    {
      invoiceCode: 'HD006',
      date: new Date('2026-07-12'),
      customerId: customers['0967890123'].id,
      staffId: staffBH.id,
      paymentMethodId: pmCK.id,
      paymentAccountId: paVCB.id,
      discount: 15000,
      surcharge: 0,
      notes: 'Khách da nhạy cảm - chú ý sản phẩm',
      items: [
        { serviceId: svcHS149!.id, unitPrice: 149000 },
        { serviceId: svcWF!.id,    unitPrice: 20000 },
        { serviceId: svcFM!.id,    unitPrice: 30000 },
      ],
    },
    {
      invoiceCode: 'HD007',
      date: new Date('2026-07-15'),
      customerId: customers['0956789012'].id,
      staffId: staffMK.id,
      paymentMethodId: pmTM.id,
      paymentAccountId: null,
      discount: 0,
      surcharge: 0,
      notes: null,
      items: [
        { serviceId: svcHS35!.id, unitPrice: 35000 },
      ],
    },
    {
      invoiceCode: 'HD008',
      date: new Date('2026-07-18'),
      customerId: customers['0989012345'].id,
      staffId: staffBH.id,
      paymentMethodId: pmQR.id,
      paymentAccountId: paMB.id,
      discount: 20000,
      surcharge: 0,
      notes: 'Combo ưu đãi',
      items: [
        { serviceId: svcHS79!.id,  unitPrice: 79000 },
        { serviceId: svcAM!.id,    unitPrice: 50000 },
        { serviceId: svcMASK!.id,  unitPrice: 20000 },
        { serviceId: svcHEC!.id,   unitPrice: 5000 },
        { serviceId: svcHFC!.id,   unitPrice: 5000 },
      ],
    },
    {
      invoiceCode: 'HD009',
      date: new Date('2026-07-22'),
      customerId: customers['0978901234'].id,
      staffId: staffMK.id,
      paymentMethodId: pmCK.id,
      paymentAccountId: paVCB.id,
      discount: 0,
      surcharge: 0,
      notes: null,
      items: [
        { serviceId: svcBSF!.id, unitPrice: 60000 },
      ],
    },
    {
      invoiceCode: 'HD010',
      date: new Date('2026-07-25'),
      customerId: customers['0990123456'].id,
      staffId: staffBH.id,
      paymentMethodId: pmTM.id,
      paymentAccountId: null,
      discount: 0,
      surcharge: 10000,
      notes: 'Phụ thu dầu gội đặc biệt',
      items: [
        { serviceId: svcHS149!.id, unitPrice: 149000 },
        { serviceId: svcFM!.id,    unitPrice: 30000 },
        { serviceId: svcMASK!.id,  unitPrice: 20000 },
      ],
    },
  ];

  for (const inv of invoicesData) {
    const existingInvoice = await prisma.invoice.findUnique({
      where: { invoiceCode: inv.invoiceCode },
    });
    if (existingInvoice) continue; // Skip if already exists

    const subTotal = inv.items.reduce((sum, item) => sum + item.unitPrice, 0);
    const totalAmount = subTotal - inv.discount + inv.surcharge;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceCode: inv.invoiceCode,
        date: inv.date,
        customerId: inv.customerId,
        staffId: inv.staffId,
        paymentMethodId: inv.paymentMethodId,
        paymentAccountId: inv.paymentAccountId,
        subTotal: subTotal,
        discount: inv.discount,
        surcharge: inv.surcharge,
        totalAmount: totalAmount,
        status: InvoiceStatus.COMPLETED,
        notes: inv.notes,
        items: {
          create: inv.items.map((item) => ({
            serviceId: item.serviceId,
            unitPrice: item.unitPrice,
            quantity: 1,
            amount: item.unitPrice,
          })),
        },
      },
    });

    // Cập nhật thông tin khách hàng
    await prisma.customer.update({
      where: { id: inv.customerId },
      data: {
        totalSpent: { increment: totalAmount },
        visitCount: { increment: 1 },
        lastVisit: inv.date,
      },
    });
  }
  console.log(`   ✅ ${invoicesData.length} hóa đơn mẫu đã được tạo.`);

  // =============================================
  // 9. SAMPLE EXPENSES (Chi phí mẫu)
  // =============================================
  console.log('💸 Tạo chi phí mẫu...');

  const cpThue = await prisma.expenseCategory.findUnique({ where: { code: 'CP001' } });
  const cpDien = await prisma.expenseCategory.findUnique({ where: { code: 'CP002' } });
  const cpNuoc = await prisma.expenseCategory.findUnique({ where: { code: 'CP003' } });
  const cpWifi = await prisma.expenseCategory.findUnique({ where: { code: 'CP004' } });
  const cpDauGoi = await prisma.expenseCategory.findUnique({ where: { code: 'CP028' } });
  const cpSap = await prisma.expenseCategory.findUnique({ where: { code: 'CP0051' } });

  if (cpThue && cpDien && cpNuoc && cpWifi && cpDauGoi && cpSap) {
    const expensesData = [
      { date: new Date('2026-07-01'), expenseCategoryId: cpThue.id,   amount: 5000000,  description: 'Thuê mặt bằng tháng 7/2026' },
      { date: new Date('2026-07-01'), expenseCategoryId: cpWifi.id,   amount: 200000,   description: 'Internet tháng 7/2026' },
      { date: new Date('2026-07-15'), expenseCategoryId: cpDien.id,   amount: 850000,   description: 'Tiền điện tháng 7/2026' },
      { date: new Date('2026-07-15'), expenseCategoryId: cpNuoc.id,   amount: 350000,   description: 'Tiền nước tháng 7/2026' },
      { date: new Date('2026-07-05'), expenseCategoryId: cpDauGoi.id, amount: 180000,   description: 'Nhập dầu gội Ôliu x3 chai' },
      { date: new Date('2026-07-10'), expenseCategoryId: cpSap.id,    amount: 250000,   description: 'Nhập sáp waxing x5 hộp' },
    ];

    for (const exp of expensesData) {
      await prisma.expense.create({ data: exp });
    }
    console.log(`   ✅ ${expensesData.length} bản ghi chi phí mẫu đã được tạo.`);
  }

  // =============================================
  // 10. SAMPLE APPOINTMENTS (Lịch hẹn mẫu)
  // =============================================
  console.log('📅 Tạo lịch hẹn mẫu...');

  const appointmentsData = [
    {
      customerId: customers['0901234567'].id,
      date: new Date('2026-08-01'),
      startTime: '09:00',
      endTime: '10:30',
      status: AppointmentStatus.CONFIRMED,
      notes: 'Gội đầu dưỡng sinh Ngủ Ngon + Massage mặt',
    },
    {
      customerId: customers['0923456789'].id,
      date: new Date('2026-08-01'),
      startTime: '14:00',
      endTime: '15:00',
      status: AppointmentStatus.CONFIRMED,
      notes: 'Combo gội đầu + mặt nạ',
    },
    {
      customerId: customers['0912345678'].id,
      date: new Date('2026-08-02'),
      startTime: '10:00',
      endTime: '11:00',
      status: AppointmentStatus.DEPOSIT,
      deposit: 50000,
      notes: 'Waxing full tay - đã cọc 50k',
    },
    {
      customerId: customers['0989012345'].id,
      date: new Date('2026-08-03'),
      startTime: '15:30',
      endTime: '17:00',
      status: AppointmentStatus.CONFIRMED,
      notes: 'Combo VIP',
    },
  ];

  for (const apt of appointmentsData) {
    await prisma.appointment.create({ data: apt });
  }
  console.log(`   ✅ ${appointmentsData.length} lịch hẹn mẫu đã được tạo.`);

  // =============================================
  // 11. SAMPLE SUPPLIERS & INVENTORY
  // =============================================
  console.log('📦 Tạo nhà cung cấp và kho vật tư mẫu...');

  const supplier1 = await prisma.supplier.create({
    data: {
      name: 'Công ty TNHH Mỹ Phẩm Hachi',
      contactName: 'Anh Tuấn',
      phone: '0281234567',
      address: 'Quận 10, TP.HCM',
    },
  });

  const supplier2 = await prisma.supplier.create({
    data: {
      name: 'Đại lý Waxing Supplies VN',
      contactName: 'Chị Hương',
      phone: '0287654321',
      address: 'Quận Bình Thạnh, TP.HCM',
    },
  });

  const inventoryData = [
    { code: 'VT001', name: 'Dầu gội Ôliu',                unit: 'Chai',  quantity: 12, costPrice: 60000,  supplierId: supplier1.id },
    { code: 'VT002', name: 'Dầu xả Ôliu',                 unit: 'Chai',  quantity: 10, costPrice: 65000,  supplierId: supplier1.id },
    { code: 'VT003', name: 'Dầu gội Hachi',                unit: 'Chai',  quantity: 8,  costPrice: 85000,  supplierId: supplier1.id },
    { code: 'VT004', name: 'Dầu xải Hachi',                unit: 'Chai',  quantity: 8,  costPrice: 90000,  supplierId: supplier1.id },
    { code: 'VT005', name: 'Dầu gội Tigi',                 unit: 'Chai',  quantity: 5,  costPrice: 120000, supplierId: supplier1.id },
    { code: 'VT006', name: 'Kem massage Mira',             unit: 'Hộp',   quantity: 6,  costPrice: 95000,  supplierId: supplier1.id },
    { code: 'VT007', name: 'Sữa rửa mặt Mocha',           unit: 'Chai',  quantity: 4,  costPrice: 75000,  supplierId: supplier1.id },
    { code: 'VT008', name: 'Mặt nạ giấy',                  unit: 'Miếng', quantity: 50, costPrice: 8000,   supplierId: supplier1.id },
    { code: 'VT009', name: 'Tinh dầu',                     unit: 'Lọ',    quantity: 3,  costPrice: 150000, supplierId: supplier1.id },
    { code: 'VT010', name: 'Sáp waxing',                   unit: 'Hộp',   quantity: 15, costPrice: 50000,  supplierId: supplier2.id },
    { code: 'VT011', name: 'Sáp lên',                      unit: 'Hộp',   quantity: 10, costPrice: 45000,  supplierId: supplier2.id },
    { code: 'VT012', name: 'Que gỡ lớn',                   unit: 'Gói',   quantity: 20, costPrice: 25000,  supplierId: supplier2.id },
    { code: 'VT013', name: 'Que gỡ nhỏ',                   unit: 'Gói',   quantity: 20, costPrice: 20000,  supplierId: supplier2.id },
    { code: 'VT014', name: 'Dưỡng sau Wax',                unit: 'Chai',  quantity: 7,  costPrice: 80000,  supplierId: supplier2.id },
    { code: 'VT015', name: 'Găng tay',                     unit: 'Hộp',   quantity: 5,  costPrice: 120000, supplierId: supplier2.id },
    { code: 'VT016', name: 'Phấn rôm Baby Johnson',        unit: 'Chai',  quantity: 3,  costPrice: 55000,  supplierId: supplier2.id },
    { code: 'VT017', name: 'Khẩu trang',                   unit: 'Hộp',   quantity: 4,  costPrice: 60000,  supplierId: supplier2.id },
    { code: 'VT018', name: 'Bông tẩy trang',               unit: 'Gói',   quantity: 10, costPrice: 35000,  supplierId: supplier1.id },
    { code: 'VT019', name: 'Kem tẩy tế bào chết da TWG',  unit: 'Hộp',   quantity: 3,  costPrice: 110000, supplierId: supplier1.id },
    { code: 'VT020', name: 'Xịt dưỡng Kassi',              unit: 'Chai',  quantity: 5,  costPrice: 70000,  supplierId: supplier1.id },
  ];

  for (const item of inventoryData) {
    const created = await prisma.inventoryItem.upsert({
      where: { code: item.code },
      update: {},
      create: {
        code: item.code,
        name: item.name,
        unit: item.unit,
        quantity: item.quantity,
        minQuantity: Math.max(2, Math.floor(item.quantity / 3)),
        costPrice: item.costPrice,
        supplierId: item.supplierId,
      },
    });

    // Tạo giao dịch nhập kho ban đầu
    await prisma.stockTransaction.create({
      data: {
        inventoryItemId: created.id,
        type: StockTransactionType.IMPORT,
        quantity: item.quantity,
        unitCost: item.costPrice,
        totalCost: item.costPrice * item.quantity,
        date: new Date('2026-07-01'),
        notes: 'Nhập kho ban đầu',
      },
    });
  }
  console.log(`   ✅ ${inventoryData.length} vật tư kho đã được tạo.`);

  // =============================================
  // DONE
  // =============================================
  console.log('\n🎉 Seed dữ liệu hoàn tất!');
  console.log('📊 Tóm tắt:');
  console.log(`   - ${2} nhóm dịch vụ`);
  console.log(`   - ${servicesData.length} dịch vụ`);
  console.log(`   - ${staffData.length} nhân viên`);
  console.log(`   - ${paymentMethodsData.length} hình thức thanh toán`);
  console.log(`   - ${paymentAccountsData.length} tài khoản ngân hàng`);
  console.log(`   - ${expenseCategoriesData.length} danh mục chi phí`);
  console.log(`   - ${customersData.length} khách hàng`);
  console.log(`   - ${invoicesData.length} hóa đơn`);
  console.log(`   - ${appointmentsData.length} lịch hẹn`);
  console.log(`   - ${inventoryData.length} vật tư kho`);
}

main()
  .catch((e) => {
    console.error('❌ Seed thất bại:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
