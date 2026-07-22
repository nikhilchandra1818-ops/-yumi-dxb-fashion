const { initializeApp } = require("firebase/app");
const { getFirestore, collection, addDoc, serverTimestamp } = require("firebase/firestore");

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

async function sendTestMessage() {
  console.log("Sending test customer message to Firestore...");
  const msgRef = await addDoc(collection(db, "contactMessages"), {
    name: "Ayesha Khan",
    email: "ayesha.khan@example.com",
    phone: "+91 98765 43210",
    subject: "Inquiry about Floral Nightwear & Custom Sizing",
    message: "Hello YUMI DXB Atelier! I love your Premium Floral Nightwear collection. Could you let me know if custom length alterations are available for the Iris Garden Robe? Thank you!",
    status: "unread",
    createdAt: serverTimestamp()
  });

  await addDoc(collection(db, "notifications"), {
    type: "new_message",
    title: "New Customer Message",
    body: "Message from Ayesha Khan: 'Inquiry about Floral Nightwear & Custom Sizing'",
    link: "/admin/messages",
    isRead: false,
    createdAt: serverTimestamp()
  });

  console.log("✅ Test message sent! Message ID:", msgRef.id);
  process.exit(0);
}

sendTestMessage().catch(err => {
  console.error("Error sending test message:", err);
  process.exit(1);
});
