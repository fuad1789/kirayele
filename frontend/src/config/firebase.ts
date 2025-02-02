import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAa50th3x8Ij1NSmSdJ-dVXqwetQbnTrBk",
  authDomain: "kirayele-7b052.firebaseapp.com",
  projectId: "kirayele-7b052",
  storageBucket: "kirayele-7b052.firebasestorage.app",
  messagingSenderId: "242608611395",
  appId: "1:242608611395:web:ab43364e196c5f8bf6f4f6",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Set persistence to local to persist the auth state
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("Firebase persistence set to local");
  })
  .catch((error) => {
    console.error("Error setting persistence:", error);
  });

export default app;
