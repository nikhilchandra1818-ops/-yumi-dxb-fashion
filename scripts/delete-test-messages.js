const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs, deleteDoc, doc } = require("firebase/firestore");

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

async function cleanFakeData() {
  console.log("Cleaning fake/test data from Firestore...");

  // 1. Delete all fake messages from contactMessages
  const msgSnap = await getDocs(collection(db, "contactMessages"));
  for (const messageDoc of msgSnap.docs) {
    await deleteDoc(doc(db, "contactMessages", messageDoc.id));
    console.log(`Deleted message ${messageDoc.id}`);
  }

  // 2. Delete test notifications from notifications
  const notifSnap = await getDocs(collection(db, "notifications"));
  for (const notifDoc of notifSnap.docs) {
    if (notifDoc.data().type === "new_message") {
      await deleteDoc(doc(db, "notifications", notifDoc.id));
      console.log(`Deleted notification ${notifDoc.id}`);
    }
  }

  console.log("✅ All test/fake messages removed from database!");
  process.exit(0);
}

cleanFakeData().catch(err => {
  console.error("Cleanup error:", err);
  process.exit(1);
});
