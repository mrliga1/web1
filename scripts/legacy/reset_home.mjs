import { initializeApp } from "firebase/app";
import { getFirestore, doc, deleteDoc } from "firebase/firestore";
import fs from "fs";

const configPath = './firebase-applet-config.json';
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
const app = initializeApp(config);
const db = getFirestore(app);

async function resetHome() {
  const docRef = doc(db, 'layouts', 'home');
  await deleteDoc(docRef);
  console.log("Deleted layouts/home");
  process.exit(0);
}
resetHome();
