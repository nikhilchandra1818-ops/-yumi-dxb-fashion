const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs, doc, deleteDoc, updateDoc } = require("firebase/firestore");
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "../.env.local");
if (!fs.existsSync(envPath)) {
  console.error("Missing .env.local");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, "utf8");
const envVars = {};
envContent.split("\n").forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    envVars[match[1]] = match[2].trim().replace(/^"|"$/g, "");
  }
});

const firebaseConfig = {
  apiKey: envVars.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: envVars.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: envVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: envVars.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: envVars.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: envVars.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  console.log("Auditing and cleaning up products collection...");
  const snap = await getDocs(collection(db, "products"));

  for (const document of snap.docs) {
    const data = document.data();
    
    // 1. Delete corrupted, empty document
    if (!data.name || data.name === "undefined") {
      console.log(`Deleting corrupted document: "${document.id}"...`);
      await deleteDoc(doc(db, "products", document.id));
      console.log(`Successfully deleted "${document.id}"!`);
      continue;
    }

    // 2. Fix internal 'id' mismatch if present
    if (data.id && data.id !== document.id) {
      console.log(`Fixing internal ID field on product "${document.id}" (was "${data.id}")...`);
      await updateDoc(doc(db, "products", document.id), {
        id: document.id
      });
      console.log(`Successfully updated internal ID for "${document.id}"!`);
    }
  }

  console.log("Cleanup complete!");
  process.exit(0);
}

run();
