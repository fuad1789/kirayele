import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  Box,
  Button,
  Typography,
  TextField,
  CircularProgress,
  Alert,
  Avatar,
  useTheme,
} from "@mui/material";
import {
  Phone as PhoneIcon,
  Key as KeyIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import AuthLayout from "./AuthLayout";
import PhoneInput from "./PhoneInput";
import OtpInput from "./OtpInput";

const Auth = () => {
  const [step, setStep] = useState(0);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [isRegistrationFlow, setIsRegistrationFlow] = useState(false);
  const theme = useTheme();

  const { sendOTP, verifyOTP, registerUser, currentUser, userData } = useAuth();
  const navigate = useNavigate();

  // Reset registration flow when component mounts
  useEffect(() => {
    setIsRegistrationFlow(false);
    // Reset all form fields
    setPhone("");
    setOtp("");
    setFirstName("");
    setLastName("");
    setError("");
    setConfirmationResult(null);
    setStep(0);
  }, []);

  useEffect(() => {
    // Only redirect if we have complete user data and it's not a registration flow
    if (
      currentUser &&
      userData?.firstName &&
      userData?.lastName &&
      !isRegistrationFlow
    ) {
      console.log("Redirecting to dashboard:", {
        hasCurrentUser: !!currentUser,
        hasUserData: !!userData,
        hasFirstName: !!userData?.firstName,
        hasLastName: !!userData?.lastName,
        isRegistrationFlow,
        step,
      });
      navigate("/dashboard");
    } else {
      console.log("Not redirecting:", {
        hasCurrentUser: !!currentUser,
        hasUserData: !!userData,
        hasFirstName: !!userData?.firstName,
        hasLastName: !!userData?.lastName,
        isRegistrationFlow,
        step,
      });

      // If we're in step 2 but not in registration flow, reset to step 0
      if (step === 2 && !isRegistrationFlow) {
        console.log("Resetting to step 0 due to invalid state");
        setStep(0);
      }
    }
  }, [currentUser, userData, navigate, isRegistrationFlow, step]);

  const handlePhoneSubmit = async () => {
    if (phone.length !== 9) {
      setError("Düzgün telefon nömrəsi daxil edin");
      return;
    }
    setError("");
    setLoading(true);
    try {
      // Reset registration flow and clear previous data
      setIsRegistrationFlow(false);
      setOtp("");
      setFirstName("");
      setLastName("");
      setConfirmationResult(null);

      const formattedPhone = `+994${phone}`;
      const result = await sendOTP(formattedPhone);
      setConfirmationResult(result);
      setStep(1);
    } catch (error: any) {
      console.error("Phone verification error:", error);
      if (error.message?.includes("reCAPTCHA")) {
        setError(
          "Təhlükəsizlik yoxlaması uğursuz oldu. Zəhmət olmasa yenidən cəhd edin."
        );
      } else {
        setError(error.message || "Xəta baş verdi");
      }
      // Reset on error
      setConfirmationResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    if (otp.length !== 6) {
      setError("Düzgün təsdiq kodu daxil edin");
      return;
    }
    setError("");
    setLoading(true);
    try {
      if (!confirmationResult) {
        throw new Error("Phone verification not initiated");
      }

      const { isNewUser } = await verifyOTP(
        confirmationResult.verificationId,
        otp
      );

      // Clear any existing errors
      setError("");

      if (isNewUser) {
        console.log("New user detected, moving to registration step");
        setIsRegistrationFlow(true);
        setStep(2);
      } else {
        console.log("Existing user detected, waiting for redirect");
        setIsRegistrationFlow(false);
      }
    } catch (error: any) {
      console.error("OTP verification error:", error);
      if (error.message?.includes("reCAPTCHA")) {
        setError(
          "Təhlükəsizlik yoxlaması uğursuz oldu. Zəhmət olmasa səhifəni yeniləyin və yenidən cəhd edin."
        );
      } else if (error.message?.includes("expired")) {
        setError("Təsdiq kodunun müddəti bitib. Zəhmət olmasa yeni kod alın.");
        // Reset to phone input step on expiration
        setStep(0);
        setOtp("");
        setConfirmationResult(null);
      } else {
        setError(
          error.message || "Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin."
        );
      }
      // Reset registration flow and OTP on error
      setIsRegistrationFlow(false);
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  const handleUserInfoSubmit = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setError("Ad və soyad daxil edin");
      return;
    }
    setError("");
    setLoading(true);
    try {
      console.log("Starting user registration");
      await registerUser(firstName.trim(), lastName.trim());
      console.log("Registration successful");
      // Keep registration flow true until redirect happens
    } catch (error: any) {
      console.error("Registration error:", error);
      setError(error.message || "Xəta baş verdi");
      // Don't clear registration flow on error to allow retry
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    const slideVariants = {
      enter: (direction: number) => ({
        x: direction > 0 ? 100 : -100,
        opacity: 0,
      }),
      center: {
        x: 0,
        opacity: 1,
      },
      exit: (direction: number) => ({
        x: direction < 0 ? 100 : -100,
        opacity: 0,
      }),
    };

    return (
      <AnimatePresence mode="wait" custom={step}>
        <motion.div
          key={step}
          custom={step}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{ width: "100%" }}
        >
          {step === 0 && (
            <Box sx={{ width: "100%" }}>
              <Box sx={{ mb: 4 }}>
                <Avatar
                  sx={{
                    mx: "auto",
                    mb: 2,
                    bgcolor: theme.palette.primary.main,
                    width: 56,
                    height: 56,
                  }}
                >
                  <PhoneIcon fontSize="large" />
                </Avatar>
                <Typography variant="h6" sx={{ textAlign: "center", mb: 1 }}>
                  Telefon nömrənizi daxil edin
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ textAlign: "center", color: "text.secondary" }}
                >
                  Təsdiq kodu göndəriləcək
                </Typography>
              </Box>

              <PhoneInput
                value={phone}
                onChange={setPhone}
                error={error}
                disabled={loading}
              />
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handlePhoneSubmit}
                disabled={loading || phone.length !== 9}
                sx={{
                  mt: 3,
                  py: 1.5,
                  fontSize: "1.1rem",
                  textTransform: "none",
                }}
              >
                {loading ? <CircularProgress size={24} /> : "Davam et"}
              </Button>
            </Box>
          )}

          {step === 1 && (
            <Box sx={{ width: "100%" }}>
              <Box sx={{ mb: 4 }}>
                <Avatar
                  sx={{
                    mx: "auto",
                    mb: 2,
                    bgcolor: theme.palette.primary.main,
                    width: 56,
                    height: 56,
                  }}
                >
                  <KeyIcon fontSize="large" />
                </Avatar>
                <Typography variant="h6" sx={{ textAlign: "center", mb: 1 }}>
                  Təsdiq kodunu daxil edin
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ textAlign: "center", color: "text.secondary" }}
                >
                  +994{phone} nömrəsinə göndərilən 6 rəqəmli kodu daxil edin
                </Typography>
              </Box>

              <OtpInput
                value={otp}
                onChange={setOtp}
                error={error}
                disabled={loading}
              />
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleOtpSubmit}
                disabled={loading || otp.length !== 6}
                sx={{
                  mt: 3,
                  py: 1.5,
                  fontSize: "1.1rem",
                  textTransform: "none",
                }}
              >
                {loading ? <CircularProgress size={24} /> : "Təsdiqlə"}
              </Button>

              <Box sx={{ mt: 2, textAlign: "center" }}>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => {
                    setStep(0);
                    setOtp("");
                    setError("");
                  }}
                  sx={{ textTransform: "none" }}
                >
                  Nömrəni dəyiş
                </Button>
              </Box>
            </Box>
          )}

          {step === 2 && (
            <Box sx={{ width: "100%" }}>
              <Box sx={{ mb: 4 }}>
                <Avatar
                  sx={{
                    mx: "auto",
                    mb: 2,
                    bgcolor: theme.palette.primary.main,
                    width: 56,
                    height: 56,
                  }}
                >
                  <PersonIcon fontSize="large" />
                </Avatar>
                <Typography variant="h6" sx={{ textAlign: "center", mb: 1 }}>
                  Məlumatlarınızı daxil edin
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ textAlign: "center", color: "text.secondary" }}
                >
                  Hesabınızı yaratmaq üçün ad və soyadınızı daxil edin
                </Typography>
              </Box>

              <TextField
                fullWidth
                label="Ad"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={loading}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Soyad"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={loading}
                sx={{ mb: 3 }}
              />
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleUserInfoSubmit}
                disabled={loading || !firstName.trim() || !lastName.trim()}
                sx={{
                  py: 1.5,
                  fontSize: "1.1rem",
                  textTransform: "none",
                }}
              >
                {loading ? <CircularProgress size={24} /> : "Tamamla"}
              </Button>
            </Box>
          )}
        </motion.div>
      </AnimatePresence>
    );
  };

  if (currentUser && userData?.firstName && userData?.lastName) {
    return null;
  }

  return (
    <AuthLayout>
      <Box sx={{ width: "100%", textAlign: "center" }}>
        <div id="recaptcha-container"></div>

        <Typography variant="h4" component="h1" sx={{ mb: 1, fontWeight: 600 }}>
          Xoş gəlmisiniz
        </Typography>

        <Typography variant="body1" sx={{ mb: 4, color: "text.secondary" }}>
          Davam etmək üçün telefon nömrənizi daxil edin
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {renderStepContent()}
      </Box>
    </AuthLayout>
  );
};

export default Auth;
