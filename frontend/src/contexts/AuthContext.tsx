import React, { createContext, useContext, useState, useEffect } from "react";
import { auth } from "../config/firebase";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import axios from "axios";

interface AuthContextType {
  currentUser: any;
  loading: boolean;
  sendOTP: (phoneNumber: string) => Promise<any>;
  verifyOTP: (verificationId: string, code: string) => Promise<any>;
  registerUser: (firstName: string, lastName: string) => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const sendOTP = async (phoneNumber: string) => {
    try {
      // Create a new RecaptchaVerifier instance
      const recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
        }
      );

      // Send OTP using Firebase client SDK
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        recaptchaVerifier
      );

      // Notify our backend that we're starting phone auth
      await axios.post("http://localhost:5000/auth/send-otp", {
        phoneNumber,
      });

      return confirmationResult;
    } catch (error) {
      console.error("Error sending OTP:", error);
      throw error;
    }
  };

  const verifyOTP = async (verificationId: string, code: string) => {
    try {
      // First verify with Firebase
      const credential = PhoneAuthProvider.credential(verificationId, code);
      const userCredential = await signInWithCredential(auth, credential);

      // Get the user's ID token
      const idToken = await userCredential.user.getIdToken();

      // Then authenticate with our backend
      const response = await axios.post(
        "http://localhost:5000/auth/verify-otp",
        {
          idToken,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error verifying OTP:", error);
      throw error;
    }
  };

  const registerUser = async (firstName: string, lastName: string) => {
    try {
      const token = await currentUser?.getIdToken();
      const response = await axios.post(
        "http://localhost:5000/auth/register",
        { firstName, lastName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error("Error registering user:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Error logging out:", error);
      throw error;
    }
  };

  const value = {
    currentUser,
    loading,
    sendOTP,
    verifyOTP,
    registerUser,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
