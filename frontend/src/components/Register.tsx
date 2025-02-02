import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Avatar,
  useTheme,
} from "@mui/material";
import { PersonAdd as PersonAddIcon } from "@mui/icons-material";

const Register = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  const { registerUser, currentUser, userData } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If no user is logged in, redirect to login
    if (!currentUser) {
      navigate("/login");
      return;
    }

    // If user has already completed registration, redirect to dashboard
    if (userData?.firstName && userData?.lastName) {
      navigate("/dashboard");
    }
  }, [currentUser, userData, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate input
    if (!firstName.trim() || !lastName.trim()) {
      setError("Both first name and last name are required");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await registerUser(firstName.trim(), lastName.trim());
      navigate("/dashboard");
    } catch (error: any) {
      setError(error.message || "Failed to register");
    } finally {
      setLoading(false);
    }
  };

  // Don't render anything while checking authentication status
  if (!currentUser) {
    return null;
  }

  // If user is already registered, don't render the form
  if (userData?.firstName && userData?.lastName) {
    return null;
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        backgroundColor: theme.palette.grey[50],
        py: 12,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            borderRadius: 2,
          }}
        >
          <Avatar
            sx={{
              m: 1,
              bgcolor: theme.palette.primary.main,
              width: 56,
              height: 56,
            }}
          >
            <PersonAddIcon fontSize="large" />
          </Avatar>

          <Typography
            component="h1"
            variant="h4"
            sx={{
              mb: 3,
              fontWeight: 600,
              color: theme.palette.text.primary,
            }}
          >
            Complete Your Profile
          </Typography>

          <Typography
            variant="body1"
            sx={{
              mb: 4,
              color: theme.palette.text.secondary,
              textAlign: "center",
            }}
          >
            Please provide your name to complete the registration process
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: "100%", mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              width: "100%",
              mt: 1,
            }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              id="firstName"
              label="First Name"
              name="firstName"
              autoComplete="given-name"
              autoFocus
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={loading}
              sx={{ mb: 2 }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              id="lastName"
              label="Last Name"
              name="lastName"
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={loading}
              sx={{ mb: 3 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                mt: 2,
                mb: 2,
                py: 1.5,
                fontSize: "1.1rem",
                textTransform: "none",
                borderRadius: 2,
                boxShadow: theme.shadows[3],
                "&:hover": {
                  boxShadow: theme.shadows[6],
                },
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Complete Registration"
              )}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Register;
