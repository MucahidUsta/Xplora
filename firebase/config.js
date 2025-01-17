import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR", // Doğru URL olduğundan emin olun
  messagingSenderId: "YOUR_ID",
  appId: "YOUR_ID",
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);

// Authentication ve Firestore'u dışa aktar
export const auth = getAuth(app);
export const db = getFirestore(app);
export const realtimeDb = getDatabase(app);

// Firestore'a veri ekleme fonksiyonu
const addDataToFirestore = async () => {
  try {
    const docRef = doc(db, "testCollection", "testDoc");
    await setDoc(docRef, {
      name: "Test User",
      email: "testuser@example.com",
    });
    console.log("Document successfully written!");
  } catch (error) {
    console.error("Error adding document: ", error);
  }
};

// Firestore'dan veri okuma fonksiyonu
const getDataFromFirestore = async () => {
  try {
    const docRef = doc(db, "testCollection", "testDoc");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      console.log("Document data:", docSnap.data());
    } else {
      console.log("No such document!");
    }
  } catch (error) {
    console.error("Error getting document: ", error);
  }
};

// Test fonksiyonlarını çağır
addDataToFirestore();
getDataFromFirestore();
