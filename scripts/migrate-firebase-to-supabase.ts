import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore/lite';
import { createClient } from '@supabase/supabase-js';
import firebaseConfig from '../firebase-applet-config.json' assert { type: 'json' };

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const firestoreDb = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables.");
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
        console.log(`   └─ No documents found in Firebase collection '${collectionName}'. Skipping.`);
        continue;
      }

      console.log(`   └─ Found ${snapshot.size} documents. Inserting into Supabase...`);
      
      // Prepare data for Supabase
      const insertData = snapshot.docs.map(doc => {
        return {
          id: doc.id,
          data: doc.data()
        };
      });

      // Insert all documents using upsert
      const { data, error } = await supabase
        .from(collectionName)
        .upsert(insertData, { onConflict: 'id' });

      if (error) {
        if (error.code === '42P01') {
           console.error(`   ❌ Table '${collectionName}' does not exist in Supabase. Please run supabase_schema.sql first!`);
        } else {
           console.error(`   ❌ Supabase insert error for '${collectionName}':`, error);
        }
      } else {
        console.log(`   ✅ Successfully migrated ${snapshot.size} documents to '${collectionName}'.`);
      }
    } catch (err: any) {
      console.error(`   ❌ Error fetching Firebase collection '${collectionName}':`, err.message);
    }
  }
  
  console.log("\n🎉 Migration process completed!");
}

migrate().catch(console.error);
