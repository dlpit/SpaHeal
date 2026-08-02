import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load env from .env.local or .env
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
}

async function runMigration() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error('Missing Firebase Admin credentials in environment.');
    process.exit(1);
  }

  let app: App;
  if (getApps().length === 0) {
    app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
  } else {
    app = getApps()[0];
  }

  const db = getFirestore(app);
  
  console.log('Starting migration for appointments...');

  // 1. Fetch all services to get their prices
  const servicesSnapshot = await db.collection('services').get();
  const servicePriceMap = new Map<string, number>();
  servicesSnapshot.forEach(doc => {
    servicePriceMap.set(doc.id, doc.data().price || 0);
  });
  console.log(`Loaded ${servicePriceMap.size} services.`);

  // 2. Fetch all appointments
  const appointmentsSnapshot = await db.collection('appointments').get();
  console.log(`Found ${appointmentsSnapshot.size} appointments total.`);

  let migratedCount = 0;
  let errorCount = 0;

  for (const doc of appointmentsSnapshot.docs) {
    const data = doc.data();
    
    // Check if it already has services array
    if (data.services && Array.isArray(data.services) && data.services.length > 0) {
      continue; // Already migrated
    }

    // Check if it has a legacy serviceId
    if (data.serviceId) {
      const price = servicePriceMap.get(data.serviceId) || 0;
      
      const newService = {
        serviceId: data.serviceId,
        serviceName: data.serviceName || 'Dịch vụ cũ',
        quantity: 1,
        price: price,
      };

      try {
        await doc.ref.update({
          services: [newService],
          // Optionally delete the old fields if we want, but schema says optional,
          // so we can leave them or set to null/delete to save space.
          // serviceId: FieldValue.delete(),
          // serviceName: FieldValue.delete(),
        });
        migratedCount++;
        console.log(`Migrated appointment ${doc.id}`);
      } catch (err) {
        console.error(`Failed to migrate appointment ${doc.id}:`, err);
        errorCount++;
      }
    }
  }

  console.log(`Migration complete. Migrated: ${migratedCount}, Errors: ${errorCount}`);
}

runMigration().catch(console.error);
