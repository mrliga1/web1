import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const PROJECT_ID = 'gen-lang-client-0069086086';
const DB_ID = 'ai-studio-5a2c21bb-ef5d-4db2-925a-18338cf41fcb';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rorvzyxjoenlrpxoptnu.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const collections = [
  'products', 'projects', 'news', 'contacts', 'configuration',
  'settings', 'layouts', 'categories', 'consultations', 'activity_logs', 'reviews'
];

function parseFirestoreValue(val) {
  if (val.stringValue !== undefined) return val.stringValue;
  if (val.integerValue !== undefined) return parseInt(val.integerValue, 10);
  if (val.doubleValue !== undefined) return parseFloat(val.doubleValue);
  if (val.booleanValue !== undefined) return val.booleanValue;
  if (val.mapValue !== undefined) {
    const res = {};
    for (const k in val.mapValue.fields) {
      res[k] = parseFirestoreValue(val.mapValue.fields[k]);
    }
    return res;
  }
  if (val.arrayValue !== undefined) {
    if (!val.arrayValue.values) return [];
    return val.arrayValue.values.map(v => parseFirestoreValue(v));
  }
  if (val.nullValue !== undefined) return null;
  if (val.timestampValue !== undefined) return val.timestampValue;
  if (val.referenceValue !== undefined) return val.referenceValue;
  return null;
}

async function migrate() {
  for (const col of collections) {
    console.log(`Migrating ${col}...`);
    let pageToken = '';
    let allDocs = [];
    do {
      let url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DB_ID}/documents/${col}?pageSize=300&key=AIzaSyBb5V9rHttiMjC8Obvt7nE2I5QG2xP3YWk`;
      if (pageToken) url += `&pageToken=${pageToken}`;
      console.log("Fetching", url);
      const res = await fetch(url, {
        headers: {
          'Origin': 'https://greeniahomes.vn',
          'Referer': 'https://greeniahomes.vn/'
        }
      });
      const data = await res.json();
      if (data.documents && Array.isArray(data.documents)) {
        allDocs = allDocs.concat(data.documents);
      } else if (data.error) {
        console.error("Firestore error:", data.error);
        break;
      }
      pageToken = data.nextPageToken;
    } while (pageToken);

    if (allDocs.length === 0) {
      console.log(` No documents in ${col}`);
      continue;
    }

    const payload = allDocs.map(doc => {
      const parts = doc.name.split('/');
      const id = parts[parts.length - 1];
      const parsedData = {};
      if (doc.fields) {
        for (const k in doc.fields) {
          parsedData[k] = parseFirestoreValue(doc.fields[k]);
        }
      }
      return { id, data: parsedData };
    });

    // Upsert to Supabase
    const supabaseRes = await fetch(`${SUPABASE_URL}/rest/v1/${col}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(payload)
    });

    if (!supabaseRes.ok) {
      console.error(` Failed to upsert ${col}:`, await supabaseRes.text());
    } else {
      console.log(` Successfully migrated ${payload.length} docs to ${col}`);
    }
  }
}

migrate().catch(console.error);
