// src/context/DashboardContext.tsx
import { createContext, useState } from "react";
import type { ReactNode, Dispatch, SetStateAction } from "react"; // ✅ type-only import

// --------------------
// Types
// --------------------
interface CountsType {
  salesInvoice: number;
  purchaseInvoice: number;
  journal: number;
}

interface DashboardContextType {
  counts: CountsType;
  setCounts: Dispatch<SetStateAction<CountsType>>; // ✅ type-safe
}

interface DashboardProviderProps {
  children: ReactNode; // ✅ type-only import
}

// --------------------
// Create context
// --------------------
const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

// --------------------
// Provider component
// --------------------
const DashboardProvider: React.FC<DashboardProviderProps> = ({ children }) => {
  const [counts, setCounts] = useState<CountsType>({
    salesInvoice: 0,
    purchaseInvoice: 0,
    journal: 0,
  });

  return (
    <DashboardContext.Provider value={{ counts, setCounts }}>
      {children}
    </DashboardContext.Provider>
  );
};

// --------------------
// Exports
// --------------------
export { DashboardContext, DashboardProvider };
