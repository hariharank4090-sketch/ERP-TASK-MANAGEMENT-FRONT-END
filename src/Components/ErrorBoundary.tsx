import React, { Component, type ReactNode } from "react";
import { Box, Card, CardContent, Typography, Button } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import RefreshIcon from "@mui/icons-material/Refresh";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box
          data-testid="error-boundary-container"
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "70vh",
            p: 3,
          }}
        >
          <Card
            data-testid="error-boundary-card"
            sx={{
              maxWidth: 550,
              width: "100%",
              p: 2,
              textAlign: "center",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              borderRadius: 3,
              border: "1px solid #f0b27a",
            }}
          >
            <CardContent>
              <ErrorOutlineIcon
                sx={{ fontSize: 64, color: "#d9534f", mb: 2 }}
              />
              <Typography variant="h5" component="h2" gutterBottom fontWeight={600}>
                Something went wrong
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {this.state.error?.message ||
                  "An unexpected error occurred while rendering this component. Please try reloading."}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<RefreshIcon />}
                onClick={this.handleReload}
                data-testid="error-boundary-retry-btn"
                sx={{
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                Reload Page
              </Button>
            </CardContent>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
