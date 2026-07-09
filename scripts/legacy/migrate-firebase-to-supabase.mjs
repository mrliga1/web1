import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const firebaseConfig = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));

// Initialize Firebase with full SDK
const firebaseApp = initializeApp(firebaseConfig);
const firestoreDb = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

// Initialize Supabase with ANON key (since RLS is disabled)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const collectionsToMigrate = [
  'products',
  'projects',
  'news',
  'contacts',
  'configuration',
  'settings',
  'layouts',
  'categories',
  'consultations',
  'activity_logs',
  'reviews'
];

async function migrate() {
  console.log("🚀 Starting migration from Firebase to Supabase...");
  
  for (const collectionName of collectionsToMigrate) {
    console.log(`\n📦 Migrating collection: ${collectionName}...`);
    try {
      const colRef = collection(firestoreDb, collectionName);
      const snapshot = await getDocs(colRef);
      
      if (snapshot.empty) {
        console.log(`   └─ No documents found in Firebase collection '${collectionName}'.`);
        continue;
      }

      console.log(`   └─ Found ${snapshot.size} documents. Inserting into Supabase...`);
      
      const insertData = snapshot.docs.map(doc => {
        return {
          id: doc.id,
          data: doc.data()
        };
      });

      const { error } = await supabase
        .from(collectionName)
        .upsert(insertData, { onConflict: 'id' });

      if (error) {
        console.error(`   ❌ Supabase insert error for '${collectionName}':`, error);
      } else {
        console.log(`   ✅ Successfully migrated ${snapshot.size} documents to '${collectionName}'.`);
      }
    } catch (err) {
      console.error(`   ❌ Error fetching Firebase collection '${collectionName}':`, err);
    }
  }
  
  console.log("\n🎉 Migration process completed!");
  process.exit(0);
}

migrate().catch(console.error);
