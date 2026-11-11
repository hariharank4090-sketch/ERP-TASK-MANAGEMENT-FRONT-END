import React, {
    createContext,
    useContext,
    useMemo,
    useState,
    useEffect,
    useCallback,
} from "react";
import type { MenuTreeNode } from "../utils/menuManagement";
import baseURL from "../config/baseURL";
import JWT_SECRET from "../config/jwtSecret";
import { clearAllCaches } from "../modules/TodayPlan/todayplan.api";
import { clearDashboardCaches } from "../modules/Dashboard/All.api";
import { clearTodayActivityCaches } from "../modules/todayActivity/todayactivity.api";

import CryptoJS from "crypto-js";

// ─────────────────────────────────────────────
// Storage helpers (module-level, modern TextEncoder/TextDecoder UTF-8 base64)
// ─────────────────────────────────────────────

function toBase64(str: string): string {
    try {
        const bytes = new TextEncoder().encode(str);
        let binString = "";
        for (let i = 0; i < bytes.length; i++) {
            binString += String.fromCharCode(bytes[i]);
        }
        return btoa(binString);
    } catch {
        return btoa(str);
    }
}

function fromBase64(base64: string): string {
    try {
        const binString = atob(base64);
        const bytes = new Uint8Array(binString.length);
        for (let i = 0; i < binString.length; i++) {
            bytes[i] = binString.charCodeAt(i);
        }
        return new TextDecoder().decode(bytes);
    } catch {
        return atob(base64);
    }
}

function encodeStorage(value: unknown): string {
    try {
        const jsonStr = typeof value === "string" ? value : JSON.stringify(value);
        return toBase64(jsonStr);
    } catch {
        return typeof value === "string" ? value : JSON.stringify(value);
    }
}

function decodeStorage<T>(raw: string | null, fallback: T): T {
    if (!raw) return fallback;
    try {
        let jsonStr = raw;
        try {
            jsonStr = fromBase64(raw);
        } catch {
            try {
                const bytes = CryptoJS.AES.decrypt(raw, JWT_SECRET);
                const decrypted = bytes.toString(CryptoJS.enc.Utf8);
                if (decrypted) jsonStr = decrypted;
            } catch {
                // raw is plain JSON
            }
        }
        return JSON.parse(jsonStr) as T;
    } catch {
        try {
            const bytes = CryptoJS.AES.decrypt(raw, JWT_SECRET);
            const decrypted = bytes.toString(CryptoJS.enc.Utf8);
            if (decrypted) {
                return JSON.parse(decrypted) as T;
            }
        } catch {
            // ignore
        }
        return fallback;
    }
}

if (typeof window !== "undefined" && window.Storage) {
    const originalGetItem = Storage.prototype.getItem;
    Storage.prototype.getItem = function (key: string): string | null {
        const raw = originalGetItem.call(this, key);
        if (!raw) return raw;
        if (
            key === "user" ||
            key === "availableCompanies" ||
            key === "currentCompany" ||
            key === "fullLoginData" ||
            key === "loginResponse"
        ) {
            try {
                const decoded = fromBase64(raw);
                if (decoded && (decoded.startsWith("{") || decoded.startsWith("["))) {
                    return decoded;
                }
            } catch {
                // ignore
            }
            try {
                const bytes = CryptoJS.AES.decrypt(raw, JWT_SECRET);
                const decrypted = bytes.toString(CryptoJS.enc.Utf8);
                if (decrypted) {
                    return decrypted;
                }
            } catch {
                // ignore
            }
            return raw;
        }
        return raw;
    };
}

function readStorage<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        return decodeStorage<T>(raw, fallback);
    } catch {
        return fallback;
    }
}

function writeStorage(key: string, value: unknown): void {
    try {
        const encoded = encodeStorage(value);
        localStorage.setItem(key, encoded);
    } catch (e) {
        console.error(`localStorage write failed for key "${key}":`, e);
    }
}

function removeStorage(...keys: string[]): void {
    keys.forEach(k => {
        try { localStorage.removeItem(k); } catch { /* ignore */ }
    });
}

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export type User = {
    Global_User_ID: number;
    Local_User_ID?: number | null;
    UserTypeId: number;
    Name: string;
    UserName: string;
    Company_Id?: number | null;
    Company_Name?: string | null;
    DB_Name?: string | null;
    id?: number;
    name?: string;
    uniqueName?: string;
    userType?: number;
};

export interface CompanyInfo {
    companyId: number;
    companyName: string | null;
    token: string;
    dbName: string | null;
    UserTypeId?: number;
    Local_User_ID?: number | null;
    Global_User_ID?: number | null;
}

export type AuthContextType = {
    user: User | null;
    token: string | null;
    localUserId: number | null;
    login: (token: string, user: User, companies?: CompanyInfo[], fullLoginData?: unknown) => void;
    logout: () => void;
    navDetails: MenuTreeNode[];
    setNavDetails: React.Dispatch<React.SetStateAction<MenuTreeNode[]>>;
    currentPage: MenuTreeNode | null;
    setCurrentPage: React.Dispatch<React.SetStateAction<MenuTreeNode | null>>;
    isAuthenticated: boolean;
    updateUser: (userData: Partial<User>) => void;
    switchCompany: (companyId: number) => Promise<boolean>;
    availableCompanies: CompanyInfo[];
    currentCompany: CompanyInfo | null;
    isSwitchingCompany: boolean;
};

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(() => {
        const stored = localStorage.getItem("token");
        if (!stored || stored === "null" || stored === "undefined" || stored === "") {
            return null;
        }
        return stored;
    });
    const [user, setUser] = useState<User | null>(
        () => readStorage<User | null>("user", null)
    );
    const [availableCompanies, setAvailableCompanies] = useState<CompanyInfo[]>(
        () => readStorage<CompanyInfo[]>("availableCompanies", [])
    );
    const [currentCompany, setCurrentCompany] = useState<CompanyInfo | null>(
        () => readStorage<CompanyInfo | null>("currentCompany", null)
    );
    const [navDetails, setNavDetails] = useState<MenuTreeNode[]>([]);
    const [currentPage, setCurrentPage] = useState<MenuTreeNode | null>(null);
    const [isSwitchingCompany, setIsSwitchingCompany] = useState(false);

    const localUserId = useMemo<number | null>(
        () => user?.Local_User_ID ?? null,
        [user?.Local_User_ID]
    );

    const isAuthenticated = useMemo(() => !!token && !!user, [token, user]);

    // ─── login ───────────────────────────────
    const login = useCallback(
        (newToken: string, newUser: User, companies?: CompanyInfo[], fullLoginData?: unknown) => {
            clearAllCaches();
            clearDashboardCaches();
            clearTodayActivityCaches();

            const enhancedUser: User = {
                ...newUser,
                id: newUser.Global_User_ID,
                name: newUser.Name,
                uniqueName: newUser.UserName,
                userType: newUser.UserTypeId,
            };

            setToken(newToken);
            setUser(enhancedUser);
            localStorage.setItem("token", newToken);
            writeStorage("user", enhancedUser);
            if (fullLoginData !== undefined) {
                writeStorage("fullLoginData", fullLoginData);
                writeStorage("loginResponse", fullLoginData);
            }
            if (newUser.Company_Id) {
                localStorage.setItem("companyId", String(newUser.Company_Id));
            }

            if (companies && companies.length > 0) {
                setAvailableCompanies(companies);
                writeStorage("availableCompanies", companies);

                const current =
                    companies.find(c => c.token === newToken) ??
                    companies.find(c => c.companyId === newUser.Company_Id) ??
                    companies[0];

                if (current) {
                    setCurrentCompany(current);
                    writeStorage("currentCompany", current);
                    localStorage.setItem("companyId", String(current.companyId));

                    if (current.UserTypeId !== undefined) {
                        const userWithCompanyRole: User = {
                            ...enhancedUser,
                            UserTypeId: current.UserTypeId,
                            userType: current.UserTypeId,
                            Local_User_ID: current.Local_User_ID ?? enhancedUser.Local_User_ID ?? null,
                        };
                        setUser(userWithCompanyRole);
                        writeStorage("user", userWithCompanyRole);
                    }
                }
            }
        },
        []
    );

    // ─── switchCompany ────────────────────────
    const switchCompany = useCallback(
        async (companyId: number): Promise<boolean> => {
            const targetCompany = availableCompanies.find(c => c.companyId === companyId);
            if (!targetCompany) {
                console.error("Company not found:", companyId);
                return false;
            }

            setIsSwitchingCompany(true);
            try {
                let finalToken = targetCompany.token;

                if (!finalToken) {
                    const response = await fetch(
                        `${baseURL}configuration/login/switch-company`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({ targetCompanyId: companyId }),
                        }
                    );

                    const data = await response.json();

                    if (data.status === "success" && data.data?.token) {
                        finalToken = data.data.token;
                    } else {
                        console.error("Failed to switch company:", data.message);
                        return false;
                    }
                }

                // ✅ IMPORTANT: Use the TARGET company's UserTypeId, Local_User_ID and Global_User_ID
                const companyUserTypeId = targetCompany.UserTypeId ?? user?.UserTypeId ?? 0;
                const companyLocalUserId = targetCompany.Local_User_ID ?? user?.Local_User_ID ?? null;
                const companyGlobalUserId = targetCompany.Global_User_ID ?? user?.Global_User_ID ?? 0;

                const updatedUser: User = user
                    ? {
                        ...user,
                        Company_Id: companyId,
                        Company_Name: targetCompany.companyName,
                        DB_Name: targetCompany.dbName,
                        UserTypeId: companyUserTypeId,
                        Local_User_ID: companyLocalUserId,
                        Global_User_ID: companyGlobalUserId,
                        id: companyGlobalUserId,
                        name: user.Name,
                        uniqueName: user.UserName,
                        userType: companyUserTypeId,
                    }
                    : {
                        Global_User_ID: companyGlobalUserId,
                        Local_User_ID: companyLocalUserId,
                        UserTypeId: companyUserTypeId,
                        Name: "",
                        UserName: "",
                        Company_Id: companyId,
                        Company_Name: targetCompany.companyName,
                        DB_Name: targetCompany.dbName,
                        id: companyGlobalUserId,
                    };

                const updatedCompany: CompanyInfo = { ...targetCompany, token: finalToken };

                const updatedCompanies = availableCompanies.map(c =>
                    c.companyId === companyId ? { ...c, token: finalToken, UserTypeId: companyUserTypeId, Local_User_ID: companyLocalUserId, Global_User_ID: companyGlobalUserId } : c
                );

                // Persist first, then update state
                localStorage.setItem("token", finalToken);
                writeStorage("user", updatedUser);
                writeStorage("currentCompany", updatedCompany);
                writeStorage("availableCompanies", updatedCompanies);
                localStorage.setItem("companyId", String(companyId));

                // Reset nav and caches
                setNavDetails([]);
                setCurrentPage(null);
                setToken(finalToken);
                setUser(updatedUser);
                setAvailableCompanies(updatedCompanies);
                setCurrentCompany(updatedCompany);

                // ✅ Clear all caches on company switch to ensure fresh data
                clearAllCaches();
                clearDashboardCaches();
                clearTodayActivityCaches();

                if (import.meta.env.DEV) {
                    console.log("✅ Switched to company:", targetCompany.companyName);
                }
                return true;

            } catch (error) {
                console.error("Error switching company:", error);
                return false;
            } finally {
                setIsSwitchingCompany(false);
            }
        },
        [availableCompanies, token, user]
    );

    // ─── logout ───────────────────────────────
    const logout = useCallback(() => {
        clearAllCaches();
        clearDashboardCaches();
        clearTodayActivityCaches();
        
        setToken(null);
        setUser(null);
        setNavDetails([]);
        setCurrentPage(null);
        setAvailableCompanies([]);
        setCurrentCompany(null);
        removeStorage("token", "user", "availableCompanies", "currentCompany", "companyId", "fullLoginData", "loginResponse");
    }, []);

    // ─── updateUser ───────────────────────────
    const updateUser = useCallback((userData: Partial<User>) => {
        setUser(prev => {
            if (!prev) return prev;
            const updated = { ...prev, ...userData };
            writeStorage("user", updated);
            return updated;
        });
    }, []);

    // ─── Auto-login via URL params (?Auth=...&company_id=...&username=...) ───
    useEffect(() => {
        if (typeof window === "undefined") return;
        const params = new URLSearchParams(window.location.search);
        const authFromUrl = params.get("Auth");
        if (!authFromUrl) return;

        const companyIdFromUrl = params.get("company_id");

        const verifyAndLogin = async () => {
            try {
                const headers: Record<string, string> = {
                    Authorization: `Bearer ${authFromUrl}`,
                };
                if (companyIdFromUrl) {
                    headers["X-Company-Id"] = companyIdFromUrl;
                    headers["Db"] = companyIdFromUrl;
                }

                const res = await fetch(`${baseURL}configuration/login/verify`, {
                    method: "GET",
                    headers,
                });

                if (!res.ok) return;
                const data = await res.json();
                if (data?.status === "success" && data?.data?.user) {
                    const verifiedUser = data.data.user;
                    const companiesList: CompanyInfo[] = Array.isArray(data.data.currentCompany)
                        ? data.data.currentCompany.map((c: Record<string, unknown>) => ({
                              companyId: Number(c.companyId),
                              companyName: (c.companyName as string) ?? null,
                              dbName: (c.dbName as string) ?? null,
                              token: (c.token as string) || authFromUrl,
                              UserTypeId: c.UserTypeId !== undefined ? Number(c.UserTypeId) : verifiedUser.UserTypeId,
                              Local_User_ID: c.Local_User_ID !== undefined ? Number(c.Local_User_ID) : verifiedUser.Local_User_ID,
                              Global_User_ID: c.Global_User_ID !== undefined ? Number(c.Global_User_ID) : verifiedUser.Global_User_ID,
                          }))
                        : [];

                    const targetCompId = companyIdFromUrl ? Number(companyIdFromUrl) : undefined;
                    const selectedComp =
                        (targetCompId ? companiesList.find(c => c.companyId === targetCompId) : undefined) ||
                        companiesList.find(c => c.token === authFromUrl) ||
                        companiesList[0];

                    const finalToken = selectedComp?.token || authFromUrl;
                    const userObj: User = {
                        Global_User_ID: selectedComp?.Global_User_ID ?? verifiedUser.Global_User_ID,
                        Local_User_ID: selectedComp?.Local_User_ID ?? verifiedUser.Local_User_ID ?? null,
                        UserTypeId: selectedComp?.UserTypeId ?? verifiedUser.UserTypeId ?? 0,
                        Name: verifiedUser.Name,
                        UserName: verifiedUser.UserName,
                        Company_Id: selectedComp?.companyId ?? targetCompId ?? null,
                        Company_Name: selectedComp?.companyName ?? null,
                        DB_Name: selectedComp?.dbName ?? null,
                        id: selectedComp?.Global_User_ID ?? verifiedUser.Global_User_ID,
                        name: verifiedUser.Name,
                        uniqueName: verifiedUser.UserName,
                        userType: selectedComp?.UserTypeId ?? verifiedUser.UserTypeId ?? 0,
                    };

                    login(finalToken, userObj, companiesList, data.data);
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
            } catch (err) {
                console.error("URL Auth auto-login failed:", err);
            }
        };

        void verifyAndLogin();
    }, [login]);

    // ─── Listen for auth expiration events ───
    useEffect(() => {
        const handleAuthExpired = () => {
            logout();
        };
        window.addEventListener("auth:expired", handleAuthExpired);
        return () => window.removeEventListener("auth:expired", handleAuthExpired);
    }, [logout]);

    // ─── Cross-tab sync ───────────────────────
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            try {
                if (e.key === "token") {
                    setToken(e.newValue);
                }
                if (e.key === "user") {
                    setUser(decodeStorage<User | null>(e.newValue, null));
                }
                if (e.key === "availableCompanies") {
                    setAvailableCompanies(
                        decodeStorage<CompanyInfo[]>(e.newValue, [])
                    );
                }
                if (e.key === "currentCompany") {
                    setCurrentCompany(
                        decodeStorage<CompanyInfo | null>(e.newValue, null)
                    );
                }
            } catch (err) {
                console.error("Cross-tab storage sync failed:", err);
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    // ─── Context value ───────────────────────
    const value = useMemo<AuthContextType>(
        () => ({
            user,
            token,
            localUserId,
            login,
            logout,
            navDetails,
            setNavDetails,
            currentPage,
            setCurrentPage,
            isAuthenticated,
            updateUser,
            switchCompany,
            availableCompanies,
            currentCompany,
            isSwitchingCompany,
        }),
        [
            user,
            token,
            localUserId,
            login,
            logout,
            navDetails,
            currentPage,
            isAuthenticated,
            updateUser,
            switchCompany,
            availableCompanies,
            currentCompany,
            isSwitchingCompany,
        ]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}