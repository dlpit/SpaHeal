// ============================================================================
// CLONE LIVE FIRESTORE DATA TO LOCAL EMULATOR / BACKUP
// Lệnh chạy: npm run db:clone
// ============================================================================

import * as dotenv from 'dotenv';
import * as path from 'path';

// Store emulator host string before deleting from process.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';

// Remove emulator env vars so liveApp connects directly to Cloud Firestore
delete process.env.FIRESTORE_EMULATOR_HOST;
delete process.env.FIREBASE_AUTH_EMULATOR_HOST;

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
  console.error('❌ Thiếu thông tin cấu hình Firebase trong .env');
  process.exit(1);
}

// 1. App kết nối Firebase Cloud Live
const liveApp = initializeApp(
  {
    credential: cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
  },
  'live-app'
);
const liveDb = getFirestore(liveApp);

// 2. App kết nối Local Emulator
process.env.FIRESTORE_EMULATOR_HOST = emulatorHost;
const localApp = initializeApp({ projectId }, 'local-app');
const localDb = getFirestore(localApp);

async function cloneLiveToLocal() {
  console.log(`📡 Đang kết nối tới Firebase Live Cloud (${projectId})...`);
  try {
    const collections = await liveDb.listCollections();
    if (collections.length === 0) {
      console.log('⚠️ Không tìm thấy collection nào trên Firebase Live.');
      return;
    }

    console.log(`🔍 Tìm thấy ${collections.length} collections trên Live. Đang sao chép về Local Emulator (${emulatorHost})...\n`);

    for (const col of collections) {
      const snap = await col.get();
      if (snap.empty) {
        console.log(` 📂 Collection "${col.id}": 0 documents (Bỏ qua)`);
        continue;
      }

      console.log(` 📂 Collection "${col.id}": Bắt đầu sao chép ${snap.size} documents...`);

      // Write in batches of 500 documents
      let batch = localDb.batch();
      let count = 0;

      for (const doc of snap.docs) {
        const localDocRef = localDb.collection(col.id).doc(doc.id);
        batch.set(localDocRef, doc.data());
        count++;

        if (count % 400 === 0) {
          await batch.commit();
          batch = localDb.batch();
        }
      }

      await batch.commit();
      console.log(`   ✅ Sao chép hoàn tất "${col.id}" (${snap.size} docs).`);
    }

    console.log('\n🎉 Hoàn tất clone toàn bộ dữ liệu từ Firebase Live về Local Emulator!');
  } catch (error: any) {
    if (error?.message?.includes('RESOURCE_EXHAUSTED') || error?.code === 8) {
      console.error('\n❌ THÔNG BÁO: Firebase Cloud live hiện đang vượt quá Quota (RESOURCE_EXHAUSTED).');
      console.error('👉 Vui lòng đợi Quota reset (qua ngày mới) hoặc nâng cấp gói Firebase Cloud để clone dữ liệu.');
    } else {
      console.error('\n❌ Lỗi khi tải dữ liệu từ Live Firestore:', error);
    }
  }
}

cloneLiveToLocal();
