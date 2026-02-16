import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";

export type DialogType = "success" | "error" | "info";

interface PaymentDialogProps {
  open: boolean;
  type?: DialogType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

const PaymentDialog: React.FC<PaymentDialogProps> = ({
  open,
  type = "success",
  title,
  message,
  confirmText = "OK",
  cancelText,
  onConfirm,
  onCancel,
}) => {
  const getIcon = () => {
    switch (type) {
      case "success":
        return (
          <CheckCircleIcon
            sx={{
              fontSize: 65,
              color: "#ff4081",
              filter: "drop-shadow(0 0 2px rgba(255, 64, 129, 0.6))",
            }}
          />
        );

      case "error":
        return (
          <ErrorIcon
            sx={{
              fontSize: 65,
              color: "#f50057",
              filter: "drop-shadow(0 0 2px rgba(245, 0, 87, 0.6))",
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="xs"
      fullWidth
      BackdropProps={{
        sx: {
          backdropFilter: "blur(10px)",
          backgroundColor: "rgba(0, 0, 0, 0.4)",
        },
      }}
      PaperProps={{
        sx: {
          borderRadius: 4,
          p: 2,
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 64, 129, 0.2)",
        },
      }}
    >
      <Box textAlign="center" mt={2}>
        {getIcon()}
      </Box>

      <DialogTitle textAlign="center" sx={{ fontWeight: 600 }}>
        {title}
      </DialogTitle>

      <DialogContent>
        <Typography textAlign="center" color="text.secondary">
          {message}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
        {cancelText && (
          <Button
            variant="outlined"
            onClick={onCancel}
            sx={{
              borderRadius: 3,
              px: 3,
              borderColor: "#ff4081",
              color: "#ff4081",
              "&:hover": {
                borderColor: "#f50057",
                backgroundColor: "rgba(255, 64, 129, 0.08)",
              },
            }}
          >
            {cancelText}
          </Button>
        )}

        <Button
          variant="contained"
          onClick={onConfirm}
          sx={{
            px: 4,
            color: "#fff",
            letterSpacing: 0.5,
            fontWeight: 600,
            paddingY: 1.3,
            borderRadius: 3,
            background: "linear-gradient(135deg, #ff4081, #f50057)",
            boxShadow: "0 4px 15px rgba(245, 0, 87, 0.4)",
            "&:hover": {
              background: "linear-gradient(135deg, #f50057, #c51162)",
              boxShadow: "0 6px 20px rgba(245, 0, 87, 0.6)",
            },
          }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentDialog;
