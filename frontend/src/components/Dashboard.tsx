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
import axios from "axios";

interface UserData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  createdAt: string;
}

const Dashboard = () => {
  const { currentUser, userData, logout } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    // If no user is logged in, redirect to login
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error: any) {
      setError(error.message || "Failed to log out");
    }
  };

  // Don't render anything while checking authentication or if user hasn't completed registration
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

          {userData && (
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
              <Typography>
                <strong>Member Since:</strong>{" "}
                {new Date(userData.createdAt).toLocaleDateString()}
              </Typography>
            </Box>
          )}

          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={handleLogout}
            sx={{ mt: 4 }}
          >
            Logout
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default Dashboard;
