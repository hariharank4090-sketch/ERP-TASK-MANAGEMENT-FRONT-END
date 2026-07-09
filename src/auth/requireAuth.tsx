import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./authContext";

export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) return <Navigate to="/" replace />;
    return <>{children}</>;
};