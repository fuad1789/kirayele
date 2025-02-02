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
import axios from "axios";

interface User {
  phoneNumber: string;
  firstName?: string;
  lastName?: string;
  _id: string;
}

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
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
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Define logout function first using useCallback
  const logout = useCallback(async () => {
    try {
      await auth.signOut();
      setUserData(null);
    } catch (error) {
      console.error("Error logging out:", error);
      throw error;
    }
  }, []);

  // Set up axios interceptor for authentication
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      async (config) => {
        try {
          if (currentUser) {
            // Force token refresh if it's close to expiring
            const token = await currentUser.getIdToken(true);
            config.headers.Authorization = `Bearer ${token}`;
          }
          return config;
        } catch (error) {
          console.error("Error getting auth token:", error);
          // If we can't get a token, we should probably log the user out
          await logout();
          return Promise.reject(error);
        }
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle 401 errors
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && currentUser) {
          try {
            // Try to get a fresh token
            const token = await currentUser.getIdToken(true);
            error.config.headers.Authorization = `Bearer ${token}`;
            // Retry the original request with the new token
            return axios(error.config);
          } catch (refreshError) {
            console.error("Error refreshing token:", refreshError);
            // If we can't refresh the token, log the user out
            await logout();
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(interceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [currentUser, logout]);

  // Handle Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setLoading(true);

      if (user) {
        try {
          // Get a fresh token before making the request
          const token = await user.getIdToken(true);
          const response = await axios.get("http://localhost:5000/auth/me", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          setUserData(response.data.user);
        } catch (error) {
          console.error("Error fetching user data:", error);
          // If we get a 401, try to refresh the token once more
          if (axios.isAxiosError(error) && error.response?.status === 401) {
            try {
              const freshToken = await user.getIdToken(true);
              const retryResponse = await axios.get(
                "http://localhost:5000/auth/me",
                {
                  headers: {
                    Authorization: `Bearer ${freshToken}`,
                  },
                }
              );
              setUserData(retryResponse.data.user);
            } catch (retryError) {
              console.error("Error retrying user data fetch:", retryError);
              // If retry fails, log out the user
              await logout();
            }
          }
        }
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [logout]);

  const sendOTP = async (phoneNumber: string) => {
    try {
      const recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
        }
      );

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        recaptchaVerifier
      );

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
      const credential = PhoneAuthProvider.credential(verificationId, code);
      const userCredential = await signInWithCredential(auth, credential);
      const idToken = await userCredential.user.getIdToken();

      const response = await axios.post(
        "http://localhost:5000/auth/verify-otp",
        { idToken }
      );

      setUserData(response.data.user);
      return response.data;
    } catch (error) {
      console.error("Error verifying OTP:", error);
      throw error;
    }
  };

  const registerUser = async (firstName: string, lastName: string) => {
    try {
      const response = await axios.post("http://localhost:5000/auth/register", {
        firstName,
        lastName,
      });

      setUserData(response.data.user);
      return response.data;
    } catch (error) {
      console.error("Error registering user:", error);
      throw error;
    }
  };

  const value = {
    currentUser,
    userData,
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
