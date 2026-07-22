const { initializeApp } = require("firebase/app");
const { getFirestore, doc, setDoc, serverTimestamp } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyB...",
  authDomain: "yumi-e33cd.firebaseapp.com",
  projectId: "yumi-e33cd",
  storageBucket: "yumi-e33cd.appspot.com",
  messagingSenderId: "1055745123512",
  appId: "1:1055745123512:web:78c52086e41b3e1a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const cleanPolicies = [
  {
    id: "return-refund-policy",
    slug: "return-refund-policy",
    title: "Return & Refund Policy",
    content: `## 7-Day Hassle-Free Returns & Exchanges

At YUMI DXB Fashion, we take immense pride in the quality, handpicked fabrics, and comfort of our creations. If your order does not meet your expectations, we offer a straightforward return and exchange process.

### Return Guidelines & Requirements
- **7-Day Return Window**: You may request a return or exchange within **7 days** of package delivery.
- **Product Condition**: Items must be unworn, unwashed, free of stains or perfumes, and returned with original tags and packaging intact.
- **Quality Inspection**: All returned items undergo a standard quality check at our Mangaluru atelier upon arrival.
- **Refund Credit**: Approved refunds are processed back to your original payment method or UPI account within **3 to 5 business days**.`
  },
  {
    id: "privacy-policy",
    slug: "privacy-policy",
    title: "Privacy Policy",
    content: `## Customer Data Protection & Privacy Promise

Your privacy and trust are paramount to YUMI DXB Fashion. We are committed to safeguarding your personal data with industry-standard encryption and transparent practices.

### Data Protection Standards
- **Information Collected**: We collect your name, delivery address, phone number, and email strictly for order fulfillment and customer support.
- **Payment & Data Security**: All transactions are processed through 256-bit SSL encrypted payment gateways. We never store credit card or banking details.
- **Zero Data Sharing**: Your personal information is never sold, rented, or shared with third-party marketers.
- **Order Notifications**: Real-time status updates are sent via SMS, email, and WhatsApp. You can adjust communication preferences anytime.`
  },
  {
    id: "shipping-policy",
    slug: "shipping-policy",
    title: "Shipping Policy",
    content: `## Pan-India Express Delivery

We are dedicated to delivering your luxury kaftans, abayas, co-ords, and nightwear safely and swiftly to your doorstep anywhere in India.

### Delivery & Dispatch Timelines
- **Atelier Dispatch**: Orders are hand-inspected and dispatched from our Mangaluru hub within **24 to 48 hours** (excluding Sundays & public holidays).
- **Estimated Transit Time**: Standard Pan-India delivery takes **3 to 5 business days** depending on regional courier PIN code accessibility.
- **Live Courier Tracking**: A tracking link is emailed and texted to you immediately upon dispatch.
- **Free Shipping Offer**: Standard delivery charges are calculated at checkout, with free shipping eligibility on qualifying order amounts.`
  },
  {
    id: "terms-conditions",
    slug: "terms-conditions",
    title: "Terms & Conditions",
    content: `## Store Terms of Service

Welcome to YUMI DXB Fashion. By browsing our store, creating an account, or placing an order, you agree to comply with and be bound by the following terms.

### Terms of Purchase & Usage
- **Pricing & Currency**: All prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes.
- **Product Availability**: We make every effort to display accurate stock availability. In rare cases of inventory conflict, affected orders will be promptly refunded.
- **Intellectual Property**: All logo designs, imagery, product copy, and branding are the exclusive property of YUMI DXB Fashion.
- **Order Modifications**: Orders may be cancelled or modified prior to courier dispatch by contacting atelier support.`
  }
];

async function seedCleanPolicies() {
  console.log("Seeding 100% clean policies into Firestore...");
  for (const pol of cleanPolicies) {
    await setDoc(doc(db, "policies", pol.id), {
      ...pol,
      updatedAt: serverTimestamp()
    });
    console.log(`✓ Cleaned ${pol.title}`);
  }
  console.log("✅ All policies successfully cleaned and synced!");
  process.exit(0);
}

seedCleanPolicies().catch(err => {
  console.error("Seeding error:", err);
  process.exit(1);
});
