import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./authContext";

export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { token } = useAuth();
    if (!token) return <Navigate to="/" replace />;
    return <>{children}</>;
};