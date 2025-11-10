/**
 * Firebase Data Export Script
 * 
 * Exports sample data from Firebase Firestore collections
 * for analysis and migration planning.
 * 
 * Usage: node scripts/export-firebase-data.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Output directory
const OUTPUT_DIR = path.join(__dirname, '../data/firebase-export');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Convert Firestore Timestamp to ISO string
 */
function convertTimestamp(data) {
  if (!data) return data;
  
  const converted = { ...data };
  
  for (const key in converted) {
    if (converted[key] && typeof converted[key] === 'object') {
      // Check if it's a Firestore Timestamp
      if (converted[key]._seconds !== undefined) {
        converted[key] = new Date(converted[key]._seconds * 1000).toISOString();
      } else if (converted[key].toDate && typeof converted[key].toDate === 'function') {
        converted[key] = converted[key].toDate().toISOString();
      } else if (Array.isArray(converted[key])) {
        converted[key] = converted[key].map(item => convertTimestamp(item));
      } else {
        converted[key] = convertTimestamp(converted[key]);
      }
    }
  }
  
  return converted;
}

/**
 * Export a collection with optional limit
 */
async function exportCollection(collectionName, limit = null) {
  console.log(`\nExporting ${collectionName}...`);
  
  try {
    let query = db.collection(collectionName);
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      console.log(`  ⚠️  No documents found in ${collectionName}`);
      return [];
    }
    
    const documents = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const converted = convertTimestamp(data);
      
      documents.push({
        id: doc.id,
        ...converted
      });
    }
    
    // Save to JSON file
    const filename = path.join(OUTPUT_DIR, `${collectionName}.json`);
    fs.writeFileSync(filename, JSON.stringify(documents, null, 2));
    
    console.log(`  ✅ Exported ${documents.length} documents to ${filename}`);
    
    return documents;
  } catch (error) {
    console.error(`  ❌ Error exporting ${collectionName}:`, error.message);
    return [];
  }
}

/**
 * Export subcollection (e.g., messages within conversations)
 */
async function exportSubcollection(parentCollection, parentId, subcollectionName, limit = null) {
  console.log(`\nExporting ${parentCollection}/${parentId}/${subcollectionName}...`);
  
  try {
    let query = db.collection(parentCollection).doc(parentId).collection(subcollectionName);
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      return [];
    }
    
    const documents = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const converted = convertTimestamp(data);
      
      documents.push({
        id: doc.id,
        parentId: parentId,
        ...converted
      });
    }
    
    console.log(`  ✅ Exported ${documents.length} documents`);
    
    return documents;
  } catch (error) {
    console.error(`  ❌ Error exporting subcollection:`, error.message);
    return [];
  }
}

/**
 * Export conversations with their messages
 */
async function exportConversationsWithMessages(limit = 5) {
  console.log(`\nExporting conversations with messages...`);
  
  try {
    const conversationsSnapshot = await db.collection('conversations').limit(limit).get();
    
    if (conversationsSnapshot.empty) {
      console.log(`  ⚠️  No conversations found`);
      return;
    }
    
    const conversations = [];
    const allMessages = [];
    
    for (const convDoc of conversationsSnapshot.docs) {
      const convData = convDoc.data();
      const converted = convertTimestamp(convData);
      
      conversations.push({
        id: convDoc.id,
        ...converted
      });
      
      // Export messages for this conversation
      const messages = await exportSubcollection('conversations', convDoc.id, 'messages', 20);
      allMessages.push(...messages);
    }
    
    // Save conversations
    const conversationsFile = path.join(OUTPUT_DIR, 'conversations.json');
    fs.writeFileSync(conversationsFile, JSON.stringify(conversations, null, 2));
    console.log(`  ✅ Exported ${conversations.length} conversations to ${conversationsFile}`);
    
    // Save messages
    const messagesFile = path.join(OUTPUT_DIR, 'messages.json');
    fs.writeFileSync(messagesFile, JSON.stringify(allMessages, null, 2));
    console.log(`  ✅ Exported ${allMessages.length} messages to ${messagesFile}`);
    
  } catch (error) {
    console.error(`  ❌ Error exporting conversations:`, error.message);
  }
}

/**
 * Generate statistics about the data
 */
async function generateStatistics() {
  console.log(`\n📊 Generating statistics...`);
  
  const stats = {
    exportDate: new Date().toISOString(),
    collections: {}
  };
  
  const collections = ['users', 'patients', 'schedules', 'requests', 'notifications', 'conversations'];
  
  for (const collectionName of collections) {
    try {
      const snapshot = await db.collection(collectionName).count().get();
      stats.collections[collectionName] = {
        totalCount: snapshot.data().count
      };
    } catch (error) {
      console.error(`  ❌ Error counting ${collectionName}:`, error.message);
      stats.collections[collectionName] = {
        totalCount: 'error',
        error: error.message
      };
    }
  }
  
  // Count messages across all conversations
  try {
    const conversationsSnapshot = await db.collection('conversations').get();
    let totalMessages = 0;
    
    for (const convDoc of conversationsSnapshot.docs) {
      const messagesSnapshot = await convDoc.ref.collection('messages').count().get();
      totalMessages += messagesSnapshot.data().count;
    }
    
    stats.collections.messages = {
      totalCount: totalMessages
    };
  } catch (error) {
    console.error(`  ❌ Error counting messages:`, error.message);
  }
  
  // Save statistics
  const statsFile = path.join(OUTPUT_DIR, 'statistics.json');
  fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
  
  console.log(`\n📈 Statistics:`);
  for (const [collection, data] of Object.entries(stats.collections)) {
    console.log(`  ${collection}: ${data.totalCount} documents`);
  }
  
  console.log(`\n  ✅ Statistics saved to ${statsFile}`);
}

/**
 * Main export function
 */
async function main() {
  console.log('🚀 Starting Firebase data export...\n');
  console.log(`Output directory: ${OUTPUT_DIR}\n`);
  
  try {
    // Export main collections (with limits for sample data)
    await exportCollection('users', 10);
    await exportCollection('patients', 10);
    await exportCollection('schedules', 30);
    await exportCollection('requests', 15);
    await exportCollection('notifications', 20);
    
    // Export conversations with messages
    await exportConversationsWithMessages(5);
    
    // Generate statistics
    await generateStatistics();
    
    console.log('\n✅ Export completed successfully!');
    console.log(`\nExported files are in: ${OUTPUT_DIR}`);
    
  } catch (error) {
    console.error('\n❌ Export failed:', error);
    process.exit(1);
  } finally {
    // Cleanup
    await admin.app().delete();
  }
}

// Run the export
main();

