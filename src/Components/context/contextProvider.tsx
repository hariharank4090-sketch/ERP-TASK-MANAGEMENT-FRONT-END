import React, { useState, createContext, type ReactNode, type Dispatch, type SetStateAction } from "react";


// Define the shape of your context data
interface ContextObjType {
  Add_Rights: number;
  Edit_Rights: number;
  Delete_Rights: number;
}

// Define what the context provides
interface MyContextType {
  contextObj: ContextObjType;
  setContextObj: Dispatch<SetStateAction<ContextObjType>>;
}

// Create the context with an initial undefined value
const MyContext = createContext<MyContextType | undefined>(undefined);

// Define props type for the provider component
interface ContextDataProviderProps {
  children: ReactNode;
}

const ContextDataProvider: React.FC<ContextDataProviderProps> = ({ children }) => {
  const [contextObj, setContextObj] = useState<ContextObjType>({
    Add_Rights: 1,
    Edit_Rights: 1,
    Delete_Rights: 1,
  });

  return (
    <MyContext.Provider value={{ contextObj, setContextObj }}>
      {children}
    </MyContext.Provider>
  );
};

export { MyContext, ContextDataProvider };
