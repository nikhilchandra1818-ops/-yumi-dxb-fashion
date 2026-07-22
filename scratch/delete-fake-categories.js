const { initializeApp } = require("firebase/app");
const { getFirestore, doc, deleteDoc } = require("firebase/firestore");
const fs = require("fs");
const path = require("path");

// 1. Read and parse .env.local
const envPath = path.join(__dirname, "../.env.local");
if (!fs.existsSync(envPath)) {
  console.error("Missing .env.local file in project root.");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, "utf8");
const envVars = {};
envContent.split("\n").forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let val = match[2] || "";
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    envVars[key] = val;
  }
});

const firebaseConfig = {
  apiKey: envVars.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: envVars.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: envVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: envVars.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: envVars.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: envVars.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: envVars.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const categoriesToDelete = [
  "category_abayas",
  "category_kaftans",
  "category_coords",
];

async function run() {
  console.log("Deleting placeholder categories from Firestore...");

  try {
    for (const id of categoriesToDelete) {
      console.log(`Deleting category: ${id}`);
      await deleteDoc(doc(db, "categories", id));
      console.log(`Deleted "${id}" successfully!`);
    }

    console.log("Deletion complete!");
    process.exit(0);
  } catch (err) {
    console.error("Error deleting categories:", err);
    process.exit(1);
  }
}

run();
