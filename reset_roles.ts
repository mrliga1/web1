import 'dotenv/config';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD0RNrz_VsCuUyOsNmHi4ADIhPON_sa3GE",
  authDomain: "web-greenia.firebaseapp.com",
  databaseURL: "https://web-greenia-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "web-greenia",
  storageBucket: "web-greenia.firebasestorage.app",
  messagingSenderId: "946308542427",
  appId: "1:946308542427:web:ca6461f32ee755d2b101fe",
  measurementId: "G-J5X8YZQGNL"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function resetRoles() {
  const querySnapshot = await getDocs(collection(db, 'users'));
  for (const docSnap of querySnapshot.docs) {
    const data = docSnap.data();
    if (data.email?.toLowerCase() === 'nguyenthanhthuan091095@gmail.com') {
      await updateDoc(doc(db, 'users', docSnap.id), { role: 'admin' });
      console.log(`Set admin role for ${data.email} (${docSnap.id})`);
    } else if (data.role === 'admin') {
      console.log(`Resetting role for ${data.email} (${docSnap.id})`);
      await updateDoc(doc(db, 'users', docSnap.id), { role: 'user' });
    }
  }
  console.log('Roles reset manually.');
  process.exit(0);
}

resetRoles();
