import { app } from './firebase';
import { 
  getFirestore as getFirestoreRealtime,
  onSnapshot,
  doc as docRealtime,
  collection as collectionRealtime
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

export const dbRealtime = getFirestoreRealtime(app, firebaseConfig.firestoreDatabaseId);
export { onSnapshot, docRealtime, collectionRealtime };
