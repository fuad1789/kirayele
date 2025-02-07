import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { auth } from "../config/firebase";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import axios from "../config/axios";
import {
  getReCaptchaToken,
  initRecaptcha,
  checkSessionExpiration,
  updateLastActivity,
  clearAuthData,
  getDeviceInfo,
} from "../utils/auth";

interface User {
  _id: string;
  phoneNumber: string;
  firstName?: string;
  lastName?: string;
}

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  sendOTP: (phoneNumber: string) => Promise<any>;
  verifyOTP: (
    verificationId: string,
    code: string
  ) => Promise<{ isNewUser: boolean }>;
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
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Initialize axios interceptors
  useEffect(() => {
    // Add request interceptor for authentication
    const requestInterceptor = axios.interceptors.request.use(
      async (config) => {
        // Update last activity timestamp
        updateLastActivity();

        // Add Firebase ID token to Authorization header if user is logged in
        if (auth.currentUser) {
          const idToken = await auth.currentUser.getIdToken();
          config.headers.Authorization = `Bearer ${idToken}`;
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for handling auth errors
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && !isAuthenticating) {
          // Clear auth data and redirect to login
          await logout();
        }
        return Promise.reject(error);
      }
    );

    // Initialize reCAPTCHA
    initRecaptcha();

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Check session expiration periodically
  useEffect(() => {
    const checkSession = () => {
      if (checkSessionExpiration()) {
        logout();
      }
    };

    const interval = setInterval(checkSession, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const logout = useCallback(async () => {
    try {
      await axios.post("/auth/logout");
      await auth.signOut();
      clearAuthData();
      setUserData(null);
    } catch (error) {
      console.error("Error logging out:", error);
      throw error;
    }
  }, []);

  const sendOTP = async (phoneNumber: string) => {
    try {
      // Initialize reCAPTCHA verifier if not already initialized
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          {
            size: "invisible",
            callback: () => {
              // reCAPTCHA solved, allow signInWithPhoneNumber.
            },
          }
        );
      }

      // Send OTP using Firebase
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        window.recaptchaVerifier
      );

      return confirmationResult;
    } catch (error) {
      console.error("Error sending OTP:", error);
      // Reset reCAPTCHA verifier
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
      throw error;
    }
  };

  const verifyOTP = async (verificationId: string, code: string) => {
    setIsAuthenticating(true);
    try {
      // Get reCAPTCHA token
      const recaptchaToken = await getReCaptchaToken();

      // Verify OTP with Firebase
      const credential = PhoneAuthProvider.credential(verificationId, code);
      const userCredential = await signInWithCredential(auth, credential);
      const idToken = await userCredential.user.getIdToken();

      // Get device information
      const deviceInfo = getDeviceInfo();

      // Verify with backend
      const response = await axios.post("/auth/verify-otp", {
        idToken,
        deviceInfo,
        recaptchaToken,
      });

      // Set current user first
      setCurrentUser(userCredential.user);

      // Determine if user is new based on missing name fields
      const isNewUser =
        !response.data.user?.firstName || !response.data.user?.lastName;

      // Only set user data if user has complete profile
      if (
        !isNewUser &&
        response.data.user?._id &&
        response.data.user?.phoneNumber
      ) {
        setUserData(response.data.user);
      } else {
        // Explicitly set userData to null for new users
        setUserData(null);
      }

      console.log("verifyOTP complete:", {
        isNewUser,
        hasFirstName: !!response.data.user?.firstName,
        hasLastName: !!response.data.user?.lastName,
        currentUser: !!userCredential.user,
        phoneNumber: response.data.user?.phoneNumber,
      });

      return { isNewUser };
    } catch (error) {
      console.error("Error verifying OTP:", error);
      // Reset auth state on error
      setCurrentUser(null);
      setUserData(null);
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const registerUser = async (firstName: string, lastName: string) => {
    setIsAuthenticating(true);
    try {
      // Get reCAPTCHA token
      const recaptchaToken = await getReCaptchaToken();

      const response = await axios.post("/auth/register", {
        firstName,
        lastName,
        recaptchaToken,
      });

      console.log("Registration complete:", {
        user: response.data.user,
        hasData: !!response.data.user,
        phoneNumber: response.data.user?.phoneNumber,
      });

      // Only set user data if we have valid data
      if (
        response.data.user?._id &&
        response.data.user?.phoneNumber &&
        response.data.user?.firstName &&
        response.data.user?.lastName
      ) {
        setUserData(response.data.user);
        return response.data;
      } else {
        throw new Error("Invalid user data received from server");
      }
    } catch (error) {
      console.error("Error registering user:", error);
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Handle Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Firebase auth state changed:", {
        hasUser: !!user,
        userId: user?.uid,
        isAuthenticating,
      });

      if (isAuthenticating) {
        console.log("Skipping auth state change during authentication");
        return;
      }

      setCurrentUser(user);
      setLoading(true);

      if (user) {
        try {
          const response = await axios.get("/api/me");
          if (
            response.data.user?._id &&
            response.data.user?.phoneNumber &&
            response.data.user?.firstName &&
            response.data.user?.lastName
          ) {
            console.log("Setting complete user data");
            setUserData(response.data.user);
          } else {
            console.log("Incomplete user data from /api/me");
            setUserData(null);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUserData(null);
        }
      } else {
        console.log("No Firebase user, clearing user data");
        setUserData(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAuthenticating]);

  const value = {
    currentUser,
    userData,
    loading,
    sendOTP,
    verifyOTP,
    registerUser,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
