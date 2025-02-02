import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserSessionPersistence,
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

// Set persistence to session instead of local for better security
setPersistence(auth, browserSessionPersistence)
  .then(() => {
    console.log("Firebase persistence set to session");
  })
  .catch((error) => {
    console.error("Error setting persistence:", error);
  });

export default app;
