const { initializeApp } = require("firebase/app");
const { getFirestore, doc, setDoc, Timestamp } = require("firebase/firestore");
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

const faqs = [
  {
    id: "faq_1",
    question: "How long does shipping take across India?",
    answer: "All orders are hand-packed at our Mangaluru Atelier within 24 hours. Express pan-India courier delivery typically takes 2–5 business days depending on your pin code.",
    category: "shipping",
    displayOrder: 1,
    isPublished: true,
  },
  {
    id: "faq_2",
    question: "What fabrics do you use for your floral nightwear & kaftans?",
    answer: "We use 100% premium soft organic cotton, breathable modal, silky rayon, and satin finish fabric blends chosen specifically for ultimate drape, skin comfort, and durability.",
    category: "products",
    displayOrder: 2,
    isPublished: true,
  },
  {
    id: "faq_3",
    question: "How do I choose my correct size?",
    answer: "You can click the 'Size Guide & Measurement Chart' on any product page or use our interactive 'Find My Drape & Fit' assistant to get a personalized recommendation based on your fit preferences.",
    category: "sizing",
    displayOrder: 3,
    isPublished: true,
  },
  {
    id: "faq_4",
    question: "What is your return & exchange policy?",
    answer: "We offer a 7-day hassle-free return or exchange policy from the date of delivery. You can initiate a return request directly from your Customer Account order history timeline.",
    category: "returns",
    displayOrder: 4,
    isPublished: true,
  },
  {
    id: "faq_5",
    question: "Do you offer Cash on Delivery (COD)?",
    answer: "Yes! We offer both Cash on Delivery (COD) and secure online UPI, NetBanking, and Card payment options across all delivery pin codes in India.",
    category: "payment",
    displayOrder: 5,
    isPublished: true,
  },
];

const policies = [
  {
    id: "privacy-policy",
    slug: "privacy-policy",
    title: "Privacy Policy",
    content: `## YUMI DXB Fashion — Privacy Policy

At YUMI DXB Fashion, operated from Mangaluru, India, we are committed to safeguarding your privacy and protecting your personal information.

### 1. Information We Collect
We collect personal information necessary for processing orders and providing a seamless luxury shopping experience:
- Full Name, Shipping Address, Email Address, and Phone Number.
- Payment details processed securely via encrypted payment gateways (we do not store raw card numbers).
- Customer preferences, wishlists, and order history.

### 2. How We Use Your Data
- Processing and fulfilling your orders with courier delivery tracking.
- Sending transactional order confirmations and delivery updates via SMS, Email, or WhatsApp.
- Improving our catalog, sizing fit recommendations, and customer support.

### 3. Data Protection & Security
We enforce strict encryption and access controls powered by Firebase Cloud Infrastructure. Your information is never sold or shared with unauthorized third parties.`,
  },
  {
    id: "terms-conditions",
    slug: "terms-conditions",
    title: "Terms & Conditions",
    content: `## YUMI DXB Fashion — Terms & Conditions

Welcome to YUMI DXB Fashion. By accessing our website and placing orders, you agree to comply with the following terms:

### 1. Order Acceptance & Pricing
- All prices listed on YUMI DXB Fashion are inclusive of applicable taxes.
- We reserve the right to cancel orders in the event of stock unavailability or technical pricing discrepancies, with immediate refund initiation.

### 2. Product Characteristics
- All garments are crafted with care. Minor color variations may occur due to photography lighting or monitor color calibration.

### 3. Intellectual Property
- All images, typography, design assets, and trademarks on this platform belong exclusively to YUMI DXB Fashion.`,
  },
  {
    id: "shipping-policy",
    slug: "shipping-policy",
    title: "Shipping Policy",
    content: `## YUMI DXB Fashion — Pan-India Shipping Policy

### 1. Processing Time
- All orders are hand-inspected and packed at our Mangaluru Atelier within **24 to 48 business hours**.

### 2. Delivery Timeline & Charges
- Standard Pan-India Express Delivery: **2 to 5 business days**.
- Free Shipping on orders over ₹1,999 across India.

### 3. Order Tracking
- Once dispatched, you will receive a unique tracking ID (\`YUMI-YYYYMMDD-XXXX\`) via SMS and Email to track your package live.`,
  },
  {
    id: "return-refund-policy",
    slug: "return-refund-policy",
    title: "Return & Refund Policy",
    content: `## YUMI DXB Fashion — Return & Exchange Policy

### 1. 7-Day Return Window
- We accept return and exchange requests within **7 days** of delivery.

### 2. Conditions for Returns
- Items must be unused, unwashed, and in their original packaging with intact tags.

### 3. Refund Process
- Once returned items pass quality inspection at our atelier, refunds are credited back to your original payment method or UPI ID within 3–5 business days.`,
  },
];

async function run() {
  console.log("Seeding FAQs into Firestore...");
  for (const f of faqs) {
    await setDoc(doc(db, "faqs", f.id), {
      ...f,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    console.log("Seeded FAQ:", f.question);
  }

  console.log("Seeding Policies into Firestore...");
  for (const p of policies) {
    await setDoc(doc(db, "policies", p.id), {
      ...p,
      updatedAt: Timestamp.now(),
    });
    console.log("Seeded Policy:", p.title);
  }

  console.log("FAQs & Policies seeding finished successfully!");
  process.exit(0);
}

run();
