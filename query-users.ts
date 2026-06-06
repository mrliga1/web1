import 'dotenv/config';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

const firebaseConfig = JSON.parse(process.env.VITE_FIREBASE_CONFIG || '{}');
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  const querySnapshot = await getDocs(collection(db, 'users'));
  querySnapshot.forEach((docSnap) => {
    console.log(docSnap.id, ' => ', docSnap.data());
  });
  console.log('Total:', querySnapshot.size);
  process.exit(0);
}
check();
