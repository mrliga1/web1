import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import fs from 'fs';

// We need to use the applet's firebase config from firebase-applet-config.json
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

async function run() {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data();
      if (data.email?.toLowerCase() !== 'nguyenthanhthuan091095@gmail.com') {
        console.log(`Deleting user ${data.email} (${docSnap.id})...`);
        await deleteDoc(doc(db, 'users', docSnap.id));
      } else {
        console.log(`Keeping admin ${data.email} (${docSnap.id})`);
      }
    }
    console.log("Cleanup done.");
    process.exit(0);
  } catch (error) {
    console.error("Error cleaning up:", error);
    process.exit(1);
  }
}

run();
