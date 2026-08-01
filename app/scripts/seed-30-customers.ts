import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
  console.error('❌ Missing Firebase credentials');
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

const lastNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý'];
const middleNames = ['Thị', 'Văn', 'Đức', 'Minh', 'Ngọc', 'Thanh', 'Hải', 'Hồng', 'Thành', 'Thu', 'Thủy', 'Quang', 'Hữu', 'Kim'];
const firstNames = ['Anh', 'Tuấn', 'Linh', 'Lan', 'Nam', 'Hoa', 'Bình', 'Hương', 'Hùng', 'Yến', 'Trang', 'Sơn', 'Dũng', 'Oanh', 'Thảo', 'Cường', 'Long', 'Nguyên', 'Khánh', 'My', 'Kha', 'An', 'Tâm', 'Khoa'];

function randomElement(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateName() {
  return `${randomElement(lastNames)} ${randomElement(middleNames)} ${randomElement(firstNames)}`;
}

function generatePhone() {
  const prefix = ['090', '091', '092', '093', '094', '096', '097', '098', '032', '033', '034', '035', '036', '037', '038', '039', '070', '076', '077', '078', '079', '081', '082', '083', '084', '085', '086', '088', '089'];
  const suf = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
  return `${randomElement(prefix)}${suf}`;
}

const tiers = ['MEMBER', 'SILVER', 'GOLD', 'PLATINUM'];

async function getNextSequence(counterName: string): Promise<number> {
  const counterRef = db.collection('counters').doc(counterName);
  return db.runTransaction(async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    let nextVal: number;
    if (!counterDoc.exists) {
      nextVal = 1;
      transaction.set(counterRef, { current: 1 });
    } else {
      nextVal = counterDoc.data()!.current + 1;
      transaction.update(counterRef, { current: nextVal });
    }
    return nextVal;
  });
}

async function main() {
  console.log('🌱 Bắt đầu tạo 30 khách hàng mẫu...\n');
  const batch = db.batch();
  
  for (let i = 0; i < 30; i++) {
    const sequence = await getNextSequence('customer_seq');
    const customerId = `KH${sequence.toString().padStart(4, '0')}`;
    const tier = randomElement(tiers);
    
    const ref = db.collection('customers').doc();
    batch.set(ref, {
      customerId,
      fullName: generateName(),
      phone: generatePhone(),
      email: `khachhang${i}@example.com`,
      address: 'TP.HCM',
      gender: Math.random() > 0.5 ? 'MALE' : 'FEMALE',
      birthday: null,
      skinCondition: 'Bình thường',
      medicalNotes: '',
      loyaltyTier: tier,
      rewardPoints: Math.floor(Math.random() * 1000),
      totalSpent: Math.floor(Math.random() * 10000000),
      visitCount: Math.floor(Math.random() * 20),
      lastVisit: FieldValue.serverTimestamp(),
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  
  await batch.commit();
  console.log(`✅ Đã tạo thành công 30 khách hàng.`);
}

main().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
