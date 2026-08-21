/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef, useEffect, useCallback } from "react";
import { z } from "zod";
import { useAuth, type User } from "./authContext";
import { useNavigate } from "react-router-dom";
import baseURL from "../config/baseURL";
import { toast } from "react-toastify";

// ─────────────────────────────────────────────
// Validation schema
// ─────────────────────────────────────────────
const schema = z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
});

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    padding: "0.75rem",
    border: "1px solid #ddd",
    borderRadius: 8,
    marginBottom: 12,
    outline: "none",
    fontSize: "14px",
    transition: "border-color 0.3s",
    boxSizing: "border-box",
};

const buttonStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.8rem",
    borderRadius: 8,
    border: "none",
    fontWeight: 700,
    cursor: "pointer",
    color: "white",
    fontSize: "16px",
    transition: "background-color 0.3s",
};

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface LoginProps {
    loadingOn?: () => void;
    loadingOff?: () => void;
    loading?: boolean;
}

interface CompanyWithToken {
    companyId: number;
    companyName: string | null;
    dbName: string | null;
    token: string;
    UserTypeId: number;
    Local_User_ID?: number | null;
}

interface LoginResponseData {
    user: {
        Global_User_ID: number;
        Local_User_ID?: number | null;
        Name: string;
        UserName: string;
        UserTypeId: number;
    };
    currentCompany: Array<{
        companyId: number;
        companyName: string | null;
        dbName: string | null;
        dbConnected: boolean;
        token: string;
        UserTypeId: number;
        Local_User_ID?: number | null;
    }>;
    serverTime: string;
}

interface LoginResponse {
    status: string;
    message: string;
    data: LoginResponseData;
    others: object;
}

// ─────────────────────────────────────────────
// CompanySelectionModal (FULLY FIXED - with multiple safety checks)
// ─────────────────────────────────────────────
interface CompanySelectionModalProps {
    visible: boolean;
    userName: string;
    companies: CompanyWithToken[] | null | undefined;
    selectedCompany: number | null;
    companyLoading: boolean;
    globalLoading: boolean;
    onSelect: (companyId: number) => void;
    onCancel: () => void;
}

const CompanySelectionModal: React.FC<CompanySelectionModalProps> = ({
    visible,
    userName,
    companies,
    selectedCompany,
    companyLoading,
    globalLoading,
    onSelect,
    onCancel,
}) => {
    if (!visible) return null;

    const isDisabled = companyLoading || globalLoading;
    
    // ✅ SAFETY FIX: Ensure companies is an array with multiple fallbacks
    const getSafeCompanies = (): CompanyWithToken[] => {
        if (!companies) return [];
        if (Array.isArray(companies)) return companies;
        return [];
    };
    
    const companiesList = getSafeCompanies();

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
            }}
            onClick={e => e.stopPropagation()}
        >
            <div
                style={{
                    backgroundColor: "white",
                    borderRadius: 16,
                    padding: 32,
                    maxWidth: 500,
                    width: "90%",
                    maxHeight: "80vh",
                    overflow: "auto",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                }}
            >
                <h3 style={{ marginBottom: 20, color: "#333" }}>Select Company</h3>
                <p style={{ marginBottom: 20, color: "#666" }}>
                    Welcome <strong>{userName}</strong>! Please select a company to continue:
                </p>

                {companyLoading && (
                    <div
                        style={{
                            textAlign: "center",
                            padding: "16px 0",
                            color: "#4f46e5",
                            fontWeight: 600,
                        }}
                    >
                        ⏳ Connecting to company database…
                    </div>
                )}

                {(!companiesList || companiesList.length === 0) && !companyLoading && (
                    <div
                        style={{
                            textAlign: "center",
                            padding: "16px 0",
                            color: "#dc2626",
                            fontWeight: 500,
                        }}
                    >
                        No companies available
                    </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {/* ✅ SAFE: Now guaranteed to be an array */}
                    {companiesList.length > 0 && companiesList.map((company, index) => {
                        if (!company) return null; // Skip if company is undefined/null
                        const isSelected = selectedCompany === company.companyId;
                        return (
                            <button
                                key={company.companyId || index}
                                onClick={() => !isDisabled && onSelect(company.companyId)}
                                disabled={isDisabled}
                                style={{
                                    padding: "16px",
                                    border: isSelected
                                        ? "2px solid #4f46e5"
                                        : "1px solid #ddd",
                                    borderRadius: 8,
                                    backgroundColor: isSelected ? "#4f46e5" : "white",
                                    color: isSelected ? "white" : "#333",
                                    cursor: isDisabled ? "not-allowed" : "pointer",
                                    textAlign: "left",
                                    transition: "all 0.3s",
                                    opacity: isDisabled && !isSelected ? 0.5 : 1,
                                    position: "relative",
                                }}
                            >
                                {isSelected && companyLoading && (
                                    <span
                                        style={{
                                            position: "absolute",
                                            right: 16,
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            width: 16,
                                            height: 16,
                                            border: "2px solid rgba(255,255,255,0.4)",
                                            borderTopColor: "white",
                                            borderRadius: "50%",
                                            display: "inline-block",
                                            animation: "spin 0.7s linear infinite",
                                        }}
                                    />
                                )}
                                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                                    {company.companyName || `Company ${company.companyId}`}
                                </div>
                                {company.dbName && (
                                    <div
                                        style={{
                                            fontSize: 12,
                                            opacity: 0.7,
                                            color: isSelected
                                                ? "rgba(255,255,255,0.8)"
                                                : "#666",
                                        }}
                                    >
                                        Database: {company.dbName}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                <button
                    onClick={() => !isDisabled && onCancel()}
                    disabled={isDisabled}
                    style={{
                        marginTop: 20,
                        padding: "12px",
                        width: "100%",
                        backgroundColor: isDisabled ? "#9ca3af" : "#dc2626",
                        color: "white",
                        border: "none",
                        borderRadius: 8,
                        cursor: isDisabled ? "not-allowed" : "pointer",
                        opacity: isDisabled ? 0.6 : 1,
                    }}
                >
                    Cancel
                </button>
            </div>

            <style>{`
                @keyframes spin {
                    to { transform: translateY(-50%) rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

// ─────────────────────────────────────────────
// Login component
// ─────────────────────────────────────────────
const Login: React.FC<LoginProps> = ({
    loadingOn = () => {},
    loadingOff = () => {},
    loading = false,
}) => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const mountedRef = useRef(true);
    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    const [form, setForm] = useState({ username: "", password: "" });
    const [error, setError] = useState<string | null>(null);
    const [showCompanySelect, setShowCompanySelect] = useState(false);

    const pendingLoginRef = useRef<{
        responseData: LoginResponseData;
        companies: CompanyWithToken[];
    } | null>(null);

    const [companiesForModal, setCompaniesForModal] = useState<CompanyWithToken[]>([]);
    const [userNameForModal, setUserNameForModal] = useState<string>("");
    const [selectedCompany, setSelectedCompany] = useState<number | null>(null);
    const [companyLoading, setCompanyLoading] = useState(false);

    // ─── handleCompanySelect ──────────────────
    const handleCompanySelect = useCallback(
        async (
            companyId: number,
            responseData: LoginResponseData,
            companies: CompanyWithToken[]
        ) => {
            if (!mountedRef.current) return;

            const selectedCompanyData = companies.find(c => c.companyId === companyId);
            if (!selectedCompanyData) {
                toast.error("Selected company not found");
                return;
            }

            setSelectedCompany(companyId);
            setCompanyLoading(true);

            try {
                const finalToken = selectedCompanyData.token;

                const userWithCompany: User = {
                    Global_User_ID: responseData.user.Global_User_ID,
                    Local_User_ID: selectedCompanyData.Local_User_ID ?? responseData.user.Local_User_ID ?? null,
                    UserTypeId: selectedCompanyData.UserTypeId,
                    Name: responseData.user.Name,
                    UserName: responseData.user.UserName,
                    Company_Id: companyId,
                    Company_Name: selectedCompanyData.companyName,
                    DB_Name: selectedCompanyData.dbName,
                    id: responseData.user.Global_User_ID,
                    name: responseData.user.Name,
                    uniqueName: responseData.user.UserName,
                    userType: selectedCompanyData.UserTypeId,
                };

                const companiesData = companies.map(c => ({
                    companyId: c.companyId,
                    companyName: c.companyName,
                    token: c.token,
                    dbName: c.dbName,
                    UserTypeId: c.UserTypeId,
                    Local_User_ID: c.Local_User_ID ?? null,
                }));

                localStorage.setItem("companyId", String(companyId));
                login(finalToken, userWithCompany, companiesData);

                toast.success(
                    `Welcome ${responseData.user.Name}! Logged in to ${selectedCompanyData.companyName}`
                );

                if (mountedRef.current) {
                    setShowCompanySelect(false);
                    setSelectedCompany(null);
                    setCompaniesForModal([]); // Reset companies array
                    setUserNameForModal("");
                    pendingLoginRef.current = null;
                    navigate("/", { replace: true });
                }
            } catch (err: any) {
                const msg = err.message || "Failed to select company";
                toast.error(msg);
                if (mountedRef.current) {
                    setError(msg);
                    setSelectedCompany(null);
                }
            } finally {
                loadingOff();
                if (mountedRef.current) {
                    setCompanyLoading(false);
                }
            }
        },
        [login, navigate, loadingOff]
    );

    // ─── handleSubmit ─────────────────────────
    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            setError(null);
            loadingOn();

            const parsed = schema.safeParse(form);
            if (!parsed.success) {
                setError(parsed.error.issues[0].message);
                loadingOff();
                return;
            }

            try {
                const response = await fetch(`${baseURL}configuration/login`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify(parsed.data),
                });

                const data: LoginResponse = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || `Login failed with status ${response.status}`);
                }

                if (data.status === "success" && data.data) {
                    const { currentCompany, user } = data.data;

                    if (!currentCompany || currentCompany.length === 0) {
                        throw new Error("No companies found for this user");
                    }

                    const companiesWithToken: CompanyWithToken[] = currentCompany.map(comp => ({
                        companyId: comp.companyId,
                        companyName: comp.companyName,
                        dbName: comp.dbName,
                        token: comp.token,
                        UserTypeId: comp.UserTypeId,
                        Local_User_ID: comp.Local_User_ID ?? null,
                    }));

                    pendingLoginRef.current = {
                        responseData: data.data,
                        companies: companiesWithToken,
                    };

                    if (companiesWithToken.length === 1) {
                        await handleCompanySelect(
                            companiesWithToken[0].companyId,
                            data.data,
                            companiesWithToken
                        );
                    } else {
                        setCompaniesForModal(companiesWithToken);
                        setUserNameForModal(user.Name);
                        loadingOff();
                        setShowCompanySelect(true);
                        toast.info("Please select a company to continue");
                    }
                } else {
                    throw new Error(data.message || "Invalid response format from server");
                }
            } catch (err: any) {
                const msg =
                    err.message ||
                    "Cannot connect to server. Please check if backend is running.";
                setError(msg);
                toast.error(msg);
                loadingOff();
            }
        },
        [form, handleCompanySelect, loadingOn, loadingOff]
    );

    // ─── Modal handlers ───────────────────────
    const handleModalSelect = useCallback(
        (companyId: number) => {
            if (!pendingLoginRef.current) return;
            const { responseData, companies } = pendingLoginRef.current;
            handleCompanySelect(companyId, responseData, companies);
        },
        [handleCompanySelect]
    );

    const handleModalCancel = useCallback(() => {
        setShowCompanySelect(false);
        setSelectedCompany(null);
        setError(null);
        setCompaniesForModal([]);
        setUserNameForModal("");
        pendingLoginRef.current = null;
        loadingOff();
        setForm({ username: "", password: "" });
    }, [loadingOff]);

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <>
            <div
                style={{
                    minHeight: "100vh",
                    display: "grid",
                    placeItems: "center",
                    backgroundColor: "#fefeff",
                    padding: "20px",
                }}
            >
                <form
                    onSubmit={handleSubmit}
                    style={{
                        width: "100%",
                        maxWidth: 400,
                        background: "white",
                        padding: 32,
                        borderRadius: 16,
                        boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                    }}
                >
                    <h2
                        style={{
                            marginBottom: 24,
                            textAlign: "center",
                            color: "#333",
                            fontSize: "28px",
                            fontWeight: 600,
                        }}
                    >
                        Welcome Back
                    </h2>

                    <label style={{ display: "block", marginBottom: 16 }}>
                        <span
                            style={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: "#555",
                                marginBottom: 4,
                                display: "block",
                            }}
                        >
                            Username
                        </span>
                        <input
                            style={inputStyle}
                            value={form.username}
                            onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                            placeholder="Enter your username"
                            autoComplete="username"
                            disabled={loading}
                        />
                    </label>

                    <label style={{ display: "block", marginBottom: 20 }}>
                        <span
                            style={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: "#555",
                                marginBottom: 4,
                                display: "block",
                            }}
                        >
                            Password
                        </span>
                        <input
                            style={inputStyle}
                            type="password"
                            value={form.password}
                            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            disabled={loading}
                        />
                    </label>

                    {error && (
                        <div
                            style={{
                                color: "#dc2626",
                                marginBottom: 16,
                                padding: "12px",
                                backgroundColor: "#fee2e2",
                                borderRadius: 8,
                                fontSize: "14px",
                                border: "1px solid #fecaca",
                            }}
                        >
                            ⚠️ {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        style={{
                            ...buttonStyle,
                            backgroundColor: loading ? "#9ca3af" : "#4f46e5",
                            opacity: loading ? 0.7 : 1,
                            cursor: loading ? "not-allowed" : "pointer",
                        }}
                        disabled={loading}
                    >
                        {loading ? "Signing in…" : "Sign in"}
                    </button>
                </form>
            </div>

            <CompanySelectionModal
                visible={showCompanySelect}
                userName={userNameForModal}
                companies={companiesForModal}
                selectedCompany={selectedCompany}
                companyLoading={companyLoading}
                globalLoading={loading}
                onSelect={handleModalSelect}
                onCancel={handleModalCancel}
            />
        </>
    );
};

export default Login;