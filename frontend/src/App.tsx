import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider, createTheme } from "@mui/material";
import Auth from "./components/auth/Auth";
import Dashboard from "./components/Dashboard";
import { useAuth } from "./contexts/AuthContext";

const theme = createTheme({
  palette: {
    primary: {
      light: "#4dabf5",
      main: "#1976d2",
      dark: "#1565c0",
    },
    secondary: {
      light: "#ff4081",
      main: "#f50057",
      dark: "#c51162",
    },
  },
  typography: {
    fontFamily: "'Segoe UI', 'Roboto', 'Arial', sans-serif",
    h4: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 8,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 8,
          },
        },
      },
    },
  },
});

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { currentUser, userData } = useAuth();
  return currentUser && userData?.firstName && userData?.lastName ? (
    <>{children}</>
  ) : (
    <Navigate to="/auth" />
  );
};

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/auth" />} />
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;
