import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Container,
  Paper,
  Button,
  CircularProgress,
} from "@mui/material";
import { ExitToApp as LogoutIcon } from "@mui/icons-material";

const Dashboard = () => {
  const { currentUser, userData, logout } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await logout();
      navigate("/login");
    } catch (error: any) {
      setError(error.message || "Failed to log out");
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser || !userData?.firstName || !userData?.lastName) {
    return null;
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            Welcome to Dashboard
          </Typography>

          {error && (
            <Typography color="error" align="center" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}

          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Profile Information
            </Typography>
            <Typography>
              <strong>Name:</strong> {userData.firstName} {userData.lastName}
            </Typography>
            <Typography>
              <strong>Phone:</strong> {userData.phoneNumber}
            </Typography>
          </Box>

          <Box sx={{ mt: 4 }}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={handleLogout}
              disabled={loading}
              startIcon={<LogoutIcon />}
            >
              {loading ? <CircularProgress size={24} /> : "Logout"}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Dashboard;
