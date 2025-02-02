import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Box,
  TextField,
  Button,
  Typography,
  Container,
  Paper,
  CircularProgress,
} from "@mui/material";
import axios from "axios";

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);

  const { sendOTP, verifyOTP, currentUser } = useAuth();
  const navigate = useNavigate();

  // Redirect if user is already logged in
  useEffect(() => {
    if (currentUser) {
      navigate("/dashboard");
    }
  }, [currentUser, navigate]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const confirmationResult = await sendOTP(phoneNumber);
      setVerificationId(confirmationResult.verificationId);
      setShowOtpInput(true);
    } catch (error: any) {
      setError(error.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await verifyOTP(verificationId, otp);

      // If user exists and has completed registration, redirect to dashboard
      if (response.user.firstName && response.user.lastName) {
        navigate("/dashboard");
      } else {
        // If user hasn't completed registration, redirect to register
        navigate("/register");
      }
    } catch (error: any) {
      setError(error.message || "Failed to verify OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Sign in to your account
          </Typography>

          {error && (
            <Typography color="error" align="center" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}

          {!showOtpInput ? (
            <form onSubmit={handleSendOTP}>
              <TextField
                fullWidth
                label="Phone Number"
                variant="outlined"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+994XXXXXXXXX"
                sx={{ mb: 2 }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                disabled={loading}
                sx={{ mt: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : "Send OTP"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP}>
              <TextField
                fullWidth
                label="OTP Code"
                variant="outlined"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                disabled={loading}
                sx={{ mt: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : "Verify OTP"}
              </Button>
            </form>
          )}

          <div id="recaptcha-container" />
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
