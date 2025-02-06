import React, { useState } from "react";
import { TextField, InputAdornment, Box } from "@mui/material";
import { motion } from "framer-motion";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  error,
  disabled = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let phone = e.target.value.replace(/\D/g, "");
    if (phone.startsWith("994")) {
      phone = phone.slice(3);
    }
    if (phone.length > 9) {
      phone = phone.slice(0, 9);
    }
    onChange(phone);
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return "";
    const cleaned = phone.replace(/\D/g, "");
    const match = cleaned.match(/^(\d{2})(\d{3})(\d{2})(\d{2})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}-${match[4]}`;
    }
    return phone;
  };

  return (
    <Box
      component={motion.div}
      animate={{ scale: isFocused ? 1.02 : 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      sx={{ width: "100%" }}
    >
      <TextField
        fullWidth
        variant="outlined"
        label="Telefon nömrəsi"
        value={formatPhoneNumber(value)}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        error={!!error}
        helperText={error}
        disabled={disabled}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">+994</InputAdornment>
          ),
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            transition: "all 0.2s ease-in-out",
            "&.Mui-focused": {
              boxShadow: (theme) => `0 0 0 2px ${theme.palette.primary.main}25`,
            },
          },
        }}
      />
    </Box>
  );
};

export default PhoneInput;
