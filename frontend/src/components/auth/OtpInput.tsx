import React, { useRef, useState, useEffect } from "react";
import { Box, TextField, Typography } from "@mui/material";
import { motion } from "framer-motion";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

const OtpInput: React.FC<OtpInputProps> = ({
  length = 6,
  value,
  onChange,
  error,
  disabled = false,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  const handleChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newValue = e.target.value.replace(/\D/g, "");
    if (newValue.length > 1) return;

    const newOtp = value.split("");
    newOtp[index] = newValue;
    const finalOtp = newOtp.join("");
    onChange(finalOtp);

    if (newValue && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      setActiveIndex(index + 1);
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setActiveIndex(index - 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);
    onChange(pastedData);

    if (pastedData.length) {
      const lastIndex = Math.min(pastedData.length - 1, length - 1);
      inputRefs.current[lastIndex]?.focus();
      setActiveIndex(lastIndex);
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Box
        sx={{
          display: "flex",
          gap: 1,
          justifyContent: "center",
          mb: error ? 1 : 0,
        }}
      >
        {Array.from({ length }, (_, index) => (
          <motion.div
            key={index}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: 1,
              y: activeIndex === index ? -4 : 0,
            }}
            transition={{
              delay: index * 0.05,
              type: "spring",
              stiffness: 300,
              damping: 20,
            }}
          >
            <TextField
              inputRef={(el) => (inputRefs.current[index] = el)}
              value={value[index] || ""}
              onChange={(e) => handleChange(index, e)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              disabled={disabled}
              inputProps={{
                maxLength: 1,
                style: {
                  textAlign: "center",
                  fontSize: "1.5rem",
                  padding: "0.5rem",
                  width: "2.5rem",
                  height: "2.5rem",
                },
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  transition: "all 0.2s ease-in-out",
                  "&.Mui-focused": {
                    boxShadow: (theme) =>
                      `0 0 0 2px ${theme.palette.primary.main}25`,
                  },
                },
              }}
            />
          </motion.div>
        ))}
      </Box>
      {error && (
        <Typography
          color="error"
          variant="caption"
          sx={{ display: "block", textAlign: "center", mt: 1 }}
        >
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default OtpInput;
