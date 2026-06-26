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
import { clearAllCaches } from "../modules/TodayPlan/todayplan.api";
import { clearDashboardCaches } from "../modules/Dashboard/All.api";

// ─────────────────────────────────────────────
// Storage helpers (module-level, not inside component)
// ─────────────────────────────────────────────
function readStorage<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

function writeStorage(key: string, value: unknown): void {
    try {
        localStorage.setItem(key, JSON.stringify(value));
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
}

export type AuthContextType = {
    user: User | null;
    token: string | null;
    localUserId: number | null;
    login: (token: string, user: User, companies?: CompanyInfo[]) => void;
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
    const [token, setToken] = useState<string | null>(
        () => localStorage.getItem("token")
    );
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
        (newToken: string, newUser: User, companies?: CompanyInfo[]) => {
            clearAllCaches();
            clearDashboardCaches();

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

                // ✅ IMPORTANT: Use the TARGET company's UserTypeId and Local_User_ID
                const companyUserTypeId = targetCompany.UserTypeId ?? user?.UserTypeId ?? 0;
                const companyLocalUserId = targetCompany.Local_User_ID ?? user?.Local_User_ID ?? null;

                const updatedUser: User = user
                    ? {
                        ...user,
                        Company_Id: companyId,
                        Company_Name: targetCompany.companyName,
                        DB_Name: targetCompany.dbName,
                        UserTypeId: companyUserTypeId,
                        Local_User_ID: companyLocalUserId,
                        id: user.Global_User_ID,
                        name: user.Name,
                        uniqueName: user.UserName,
                        userType: companyUserTypeId,
                    }
                    : {
                        Global_User_ID: 0,
                        Local_User_ID: null,
                        UserTypeId: companyUserTypeId,
                        Name: "",
                        UserName: "",
                        Company_Id: companyId,
                        Company_Name: targetCompany.companyName,
                        DB_Name: targetCompany.dbName,
                    };

                const updatedCompany: CompanyInfo = { ...targetCompany, token: finalToken };

                const updatedCompanies = availableCompanies.map(c =>
                    c.companyId === companyId ? { ...c, token: finalToken, UserTypeId: companyUserTypeId, Local_User_ID: companyLocalUserId } : c
                );

                // Persist first, then update state
                localStorage.setItem("token", finalToken);
                writeStorage("user", updatedUser);
                writeStorage("currentCompany", updatedCompany);
                writeStorage("availableCompanies", updatedCompanies);

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

                console.log("✅ Switched to company:", targetCompany.companyName);
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
        
        setToken(null);
        setUser(null);
        setNavDetails([]);
        setCurrentPage(null);
        setAvailableCompanies([]);
        setCurrentCompany(null);
        removeStorage("token", "user", "availableCompanies", "currentCompany");
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

    // ─── Cross-tab sync ───────────────────────
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            try {
                if (e.key === "token") {
                    setToken(e.newValue);
                }
                if (e.key === "user") {
                    setUser(e.newValue ? (JSON.parse(e.newValue) as User) : null);
                }
                if (e.key === "availableCompanies") {
                    setAvailableCompanies(
                        e.newValue ? (JSON.parse(e.newValue) as CompanyInfo[]) : []
                    );
                }
                if (e.key === "currentCompany") {
                    setCurrentCompany(
                        e.newValue ? (JSON.parse(e.newValue) as CompanyInfo) : null
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