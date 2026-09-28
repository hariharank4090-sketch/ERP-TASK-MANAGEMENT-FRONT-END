import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

// --------------------
// Props Type
// --------------------
interface ProtectedRouteProps {
  children: ReactNode;
}

// --------------------
// Component
// --------------------
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    // If no token, redirect to login
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
