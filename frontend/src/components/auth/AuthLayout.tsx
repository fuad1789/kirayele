import { motion } from "framer-motion";
import { Box, Container, Paper, useTheme, useMediaQuery } from "@mui/material";
import React from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      sx={{
        minHeight: "100vh",
        display: "flex",
        background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
        py: { xs: 4, sm: 8 },
        px: { xs: 2, sm: 4 },
      }}
    >
      <Container maxWidth="sm" sx={{ display: "flex", alignItems: "center" }}>
        <Paper
          component={motion.div}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          elevation={isMobile ? 0 : 6}
          sx={{
            width: "100%",
            p: { xs: 3, sm: 4 },
            borderRadius: { xs: 0, sm: 3 },
            backgroundColor: "background.paper",
            backdropFilter: "blur(10px)",
            position: "relative",
            overflow: "hidden",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            },
          }}
        >
          {children}
        </Paper>
      </Container>
    </Box>
  );
};

export default AuthLayout;
