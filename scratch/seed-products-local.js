const { initializeApp } = require("firebase/app");
const { getFirestore, doc, setDoc, collection, getDocs, query, where, Timestamp } = require("firebase/firestore");
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

// Product Data definitions with local public assets URLs
const productsToSeed = [
  {
    name: "Iris Garden Robe",
    slug: "iris-garden-robe",
    sku: "YUMI-NW-01",
    price: 1299,
    discountPrice: 999,
    fabric: "Soft Cotton Blend",
    description: "Unwind in the premium comfort of our Iris Garden Robe. Adorned with beautiful floral motifs, this piece features a relaxed drape, short sleeves, and soft lace collar trims to bring an air of elegant lounge charm to your evenings.",
    careInstructions: "Machine wash cold with like colors. Tumble dry low. Warm iron if needed.",
    imageUrl: "/images/iris-garden-robe.jpg",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Iris Blue", "Midnight Blue"],
    stock: 25,
  },
  {
    name: "Vintage Peony Set",
    slug: "vintage-peony-set",
    sku: "YUMI-NW-02",
    price: 1499,
    discountPrice: 999,
    fabric: "Premium Rayon",
    description: "Crafted from incredibly silky and smooth premium rayon fabric, the Vintage Peony Set highlights vintage peony floral prints on a rich charcoal background. Perfect balance of breathability and elegant flow for sweet dreams.",
    careInstructions: "Hand wash or gentle machine wash cold. Do not bleach. Dry flat in shade.",
    imageUrl: "/images/vintage-peony-set.jpg",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Charcoal Peony", "Soft Blush"],
    stock: 30,
  },
  {
    name: "Midnight Bloom",
    slug: "midnight-bloom",
    sku: "YUMI-NW-03",
    price: 1299,
    discountPrice: 999,
    fabric: "Breathable Modal",
    description: "Elegant meets comfortable with the Midnight Bloom gown. Showcasing vivid floral illustrations over a deep navy background, this modal fabric gown feels light as air on your skin. Includes delicate lace neck trims.",
    careInstructions: "Machine wash delicate cycle cold. Do not tumble dry. Iron on low heat.",
    imageUrl: "/images/midnight-bloom.jpg",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Midnight Floral", "Royal Blue"],
    stock: 18,
  },
  {
    name: "Ethereal Orchid",
    slug: "ethereal-orchid",
    sku: "YUMI-NW-04",
    price: 1599,
    discountPrice: 999,
    fabric: "Satin Finish Blend",
    description: "Bring a touch of luxury to your nightwear wardrobe with the Ethereal Orchid gown. Fabricated with a soft, quiet sheen satin finish, this gown features intricate orchid floral spreads and a structured yet breathable silhouette.",
    careInstructions: "Gentle hand wash. Iron on reverse satin setting. Do not wring or twist.",
    imageUrl: "/images/ethereal-orchid.jpg",
    sizes: ["Standard", "S", "M", "L"],
    colors: ["Orchid Blue", "Lilac Rose"],
    stock: 15,
  },
  {
    name: "Desert Rose Kaftan",
    slug: "desert-rose-kaftan",
    sku: "YUMI-NW-05",
    price: 1399,
    discountPrice: 999,
    fabric: "Pure Cotton",
    description: "Our Desert Rose Kaftan merges traditional comfort with a bright, refreshing look. Tailored with premium pure cotton fabric for maximum breathability, it presents rich crimson rose floral prints and details optimized for all-day wear.",
    careInstructions: "Wash dark colors separately. Machine wash warm. Line dry in shade.",
    imageUrl: "/images/desert-rose-kaftan.jpg",
    sizes: ["Standard", "M", "L", "XL"],
    colors: ["Desert Crimson", "Rose Red"],
    stock: 22,
  },
];

async function seed() {
  console.log("Seeding products with local asset paths into Firestore...");

  try {
    // 1. Resolve or Create "Premium Floral Nightwear" Category
    let categoryId = "category_floral_nightwear";
    let categoryName = "Premium Floral Nightwear";

    const catQuery = query(collection(db, "categories"), where("name", "==", categoryName));
    const catSnap = await getDocs(catQuery);

    if (!catSnap.empty) {
      const docData = catSnap.docs[0];
      categoryId = docData.id;
      categoryName = docData.data().name;
      console.log(`Resolved existing category: "${categoryName}" (${categoryId})`);
    } else {
      console.log(`Category "${categoryName}" not found. Creating it...`);
      await setDoc(doc(db, "categories", categoryId), {
        id: categoryId,
        name: categoryName,
        slug: "premium-floral-nightwear",
        description: "Elegant and comfortable premium floral nightwear sets.",
        displayOrder: 1,
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }

    // 2. Loop through products and save to Firestore
    for (const prod of productsToSeed) {
      console.log(`Creating product: ${prod.name}`);

      const productId = `product_${prod.slug}_${Date.now()}`;
      const productDocData = {
        id: productId,
        name: prod.name,
        slug: prod.slug,
        sku: prod.sku,
        description: prod.description,
        shortDescription: `Elegant ${prod.fabric} nightwear set.`,
        fabric: prod.fabric,
        price: prod.price,
        discountPrice: prod.discountPrice,
        categoryId,
        categoryName,
        images: [
          {
            url: prod.imageUrl,
            storagePath: "", // Empty for local assets
            order: 1,
            isPrimary: true,
          },
        ],
        sizes: prod.sizes,
        colors: prod.colors,
        stock: prod.stock,
        careInstructions: prod.careInstructions,
        isFeatured: true,
        isNewArrival: true,
        isActive: true,
        isArchived: false,
        seoTitle: `${prod.name} | Premium Lounge Wear | YUMI DXB`,
        seoDescription: prod.description.slice(0, 150),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      console.log(`Saving product document to Firestore collection: /products/${productId}...`);
      await setDoc(doc(db, "products", productId), productDocData);
      console.log(`Successfully created "${prod.name}"!`);
    }

    console.log("Seeding process finished successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding products:", err);
    process.exit(1);
  }
}

seed();
