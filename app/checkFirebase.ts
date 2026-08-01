import { getDb } from './src/lib/firebase';
import { COLLECTIONS } from './src/lib/firestore-types';
import * as dotenv from 'dotenv';
dotenv.config();

async function checkData() {
  try {
    const db = getDb();
    const snapshot = await db.collection(COLLECTIONS.SERVICES).get();
    if (snapshot.empty) {
      console.log('No services found in Firebase.');
    } else {
      console.log(`Found ${snapshot.size} services in Firebase.`);
      snapshot.forEach(doc => {
        console.log(doc.id, '=>', doc.data());
      });
    }

    const categoriesSnapshot = await db.collection(COLLECTIONS.SERVICE_CATEGORIES).get();
    if (categoriesSnapshot.empty) {
      console.log('No service categories found in Firebase.');
    } else {
      console.log(`Found ${categoriesSnapshot.size} service categories in Firebase.`);
      categoriesSnapshot.forEach(doc => {
        console.log(doc.id, '=>', doc.data());
      });
    }

  } catch (error) {
    console.error('Error fetching from Firebase:', error);
  }
}

checkData();
