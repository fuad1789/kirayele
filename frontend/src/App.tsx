import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import {
  ThemeProvider,
  createTheme,
  CircularProgress,
  Box,
} from "@mui/material";
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

// Loading component
const LoadingScreen = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="100vh"
  >
    <CircularProgress />
  </Box>
);

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { currentUser, userData, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!currentUser || !userData?.firstName || !userData?.lastName) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Public Route component (prevents authenticated users from accessing auth pages)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, userData, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (currentUser && userData?.firstName && userData?.lastName) {
    // Redirect to the intended page or dashboard
    const from = (location.state as any)?.from?.pathname || "/dashboard";
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      <Route
        path="/auth"
        element={
          <PublicRoute>
            <Auth />
          </PublicRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      {/* Add a catch-all route that redirects to dashboard for authenticated users or auth for non-authenticated */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;
