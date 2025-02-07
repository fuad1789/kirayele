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
  const theme = useTheme();

  const { sendOTP, verifyOTP, registerUser, currentUser, userData } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser && userData?.firstName && userData?.lastName) {
      navigate("/dashboard");
    }
  }, [currentUser, userData, navigate]);

  const handlePhoneSubmit = async () => {
    if (phone.length !== 9) {
      setError("Düzgün telefon nömrəsi daxil edin");
      return;
    }
    setError("");
    setLoading(true);
    try {
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

      const result = await verifyOTP(confirmationResult.verificationId, otp);

      // Clear any existing errors
      setError("");

      // Always check the userData after verification
      if (!userData?.firstName || !userData?.lastName) {
        console.log("User needs to complete profile, moving to step 2");
        setStep(2);
      } else {
        console.log("User profile complete, useEffect will handle navigation");
      }
    } catch (error: any) {
      console.error("OTP verification error:", error);
      if (error.message?.includes("reCAPTCHA")) {
        setError(
          "Təhlükəsizlik yoxlaması uğursuz oldu. Zəhmət olmasa səhifəni yeniləyin və yenidən cəhd edin."
        );
      } else if (error.message?.includes("expired")) {
        setError("Təsdiq kodunun müddəti bitib. Zəhmət olmasa yeni kod alın.");
        // Don't automatically go back to step 0 on expiration
        // Let user choose to go back using the "Change number" button
      } else {
        setError(
          error.message || "Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin."
        );
      }
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
      await registerUser(firstName.trim(), lastName.trim());
      // Navigation will be handled by useEffect after userData updates
    } catch (error: any) {
      setError(error.message || "Xəta baş verdi");
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
