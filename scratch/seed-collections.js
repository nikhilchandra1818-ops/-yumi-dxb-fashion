const { initializeApp } = require("firebase/app");
const { getFirestore, doc, setDoc, collection, getDocs, updateDoc, Timestamp } = require("firebase/firestore");
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
  console.log("Seeding Premium Floral Nightwear collection into Firestore...");

  const collectionId = "collection_floral_nightwear";
  const collectionName = "Premium Floral Nightwear";

  try {
    // 1. Create the Collection document
    await setDoc(doc(db, "collections", collectionId), {
      id: collectionId,
      name: collectionName,
      slug: "premium-floral-nightwear",
      description: "Our signature debut collection of premium floral nightwear.",
      bannerUrl: "/images/hero_main.jpg",
      displayOrder: 1,
      isFeatured: true,
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    console.log("Created collection document successfully!");

    // 2. Link all existing products to this collection
    const productsSnap = await getDocs(collection(db, "products"));
    console.log(`Updating ${productsSnap.docs.length} products to link to this collection...`);

    for (const productDoc of productsSnap.docs) {
      console.log(`Linking product: ${productDoc.id}`);
      await updateDoc(doc(db, "products", productDoc.id), {
        collectionId,
        collectionName,
        updatedAt: Timestamp.now(),
      });
    }

    console.log("Seeding finished successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding collection:", err);
    process.exit(1);
  }
}

run();
