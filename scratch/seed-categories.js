const { initializeApp } = require("firebase/app");
const { getFirestore, doc, setDoc, Timestamp } = require("firebase/firestore");
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

const categoriesToSeed = [
  {
    id: "category_floral_nightwear",
    name: "Premium Floral Nightwear",
    slug: "premium-floral-nightwear",
    description: "Elegant and comfortable premium floral nightwear sets.",
    imageUrl: "/images/iris-garden-robe.jpg",
    displayOrder: 1,
    isActive: true,
  },
  {
    id: "category_abayas",
    name: "Elegant Abayas",
    slug: "abayas",
    description: "Timeless and modest elegant abayas designed for grace.",
    imageUrl: "/images/category_abayas.jpg",
    displayOrder: 2,
    isActive: true,
  },
  {
    id: "category_kaftans",
    name: "Graceful Kaftans",
    slug: "kaftans",
    description: "Beautifully draped graceful kaftans blending style and modesty.",
    imageUrl: "/images/category_kaftans.jpg",
    displayOrder: 3,
    isActive: true,
  },
  {
    id: "category_coords",
    name: "Stylish Co-ord Sets",
    slug: "co-ords",
    description: "Modern, matching stylish co-ord sets for ultimate comfort.",
    imageUrl: "/images/category_coords.jpg",
    displayOrder: 4,
    isActive: true,
  },
];

async function seed() {
  console.log("Seeding Category metadata with lookbook images into Firestore...");

  try {
    for (const cat of categoriesToSeed) {
      console.log(`Saving category: ${cat.name}`);
      await setDoc(doc(db, "categories", cat.id), {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        imageUrl: cat.imageUrl,
        displayOrder: cat.displayOrder,
        isActive: cat.isActive,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      console.log(`Successfully created category "${cat.name}"!`);
    }

    console.log("Category seeding finished successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding categories:", err);
    process.exit(1);
  }
}

seed();
