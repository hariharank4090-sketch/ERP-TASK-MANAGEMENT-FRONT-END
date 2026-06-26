import { toast } from "react-toastify";
import { fetchLink } from "../../../Components/customFetch";
import type {
  parameterData,
  parameterCreateInput,
  parameterUpdateInput,
  BasicApiResponse,
  datatypeDropdown
} from "./Parameters.variables";

const parameterAPI = "masters/paramMaster/";
const datatypeAPI = "masters/parametDataTypes/";

// Define interface for API response items
interface ParameterApiResponseItem {
  Paramet_Id?: number;
  id?: number;
  Paramet_Name?: string;
  name?: string;
  parameterName?: string;
  Paramet_Data_Type?: number | null;
  dataTypeId?: number;
  dataType?: number | null;
  Paramet_Data_Type_Name?: string;
  dataTypeName?: string;
  dataTypeDisplayName?: string;
}

interface DatatypeApiResponseItem {
  Para_Data_Type_Id?: number;
  id?: number;
  value?: number;
  Para_Display_Name?: string;
  name?: string;
  label?: string;
  displayName?: string;
}

// Type guard for DatatypeApiResponseItem array
function isDatatypeArray(data: unknown): data is DatatypeApiResponseItem[] {
  return Array.isArray(data) && data.every(item => 
    typeof item === 'object' && 
    item !== null &&
    (
      'Para_Data_Type_Id' in item ||
      'id' in item ||
      'value' in item ||
      'Para_Display_Name' in item ||
      'name' in item ||
      'label' in item ||
      'displayName' in item
    )
  );
}

// Get all parameters
export const getparameter = async (
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<parameterData[]> => {
  try {
    const res = await fetchLink<BasicApiResponse>({
      address: parameterAPI,
      method: "GET",
      loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
      loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
    });

    if (res && res.success) {
      // Log the actual response structure
      console.log("Parameters API response:", res);
      
      // Extract data based on actual API response structure
      let rawData: unknown = res.data;
      
      // If data has a 'data' property
      if (res.data && typeof res.data === 'object' && 'data' in (res.data as unknown as Record<string, unknown>)) {
        rawData = (res.data as unknown as Record<string, unknown>).data;
      }
      
      // Handle array response
      if (Array.isArray(rawData)) {
        const parameters = rawData.map((item: ParameterApiResponseItem) => ({
          Paramet_Id: item.Paramet_Id || item.id || 0,
          Paramet_Name: item.Paramet_Name || item.name || item.parameterName || '',
          Paramet_Data_Type: item.Paramet_Data_Type || item.dataTypeId || item.dataType || null,
          // Try to get display name if available
          Paramet_Data_Type_Name: item.Paramet_Data_Type_Name || item.dataTypeName || item.dataTypeDisplayName || null
        }));
        return parameters;
      }
      
      return [];
    } else {
      toast.error(res?.message || "Failed to load parameters");
      return [];
    }
  } catch (e: unknown) {
    console.error("getparameter Error:", e);
    toast.error("Network error loading parameters");
    return [];
  }
};

//----------------------------------------------------------------------------------------------------------//

// Get data type dropdown - SIMPLIFIED VERSION
export const getdatatypeDropdown = async (
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<datatypeDropdown[]> => {
  try {
    const res = await fetchLink<BasicApiResponse>({
      address: datatypeAPI,
      method: "GET",
      loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
      loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
    });

    console.log("Datatype API response:", res);

    if (res && res.success) {
      let datatypes: datatypeDropdown[] = [];
      
      // Direct array response
      if (Array.isArray(res.data) && isDatatypeArray(res.data)) {
        datatypes = res.data.map((item: DatatypeApiResponseItem) => ({
          Para_Data_Type_Id: item.Para_Data_Type_Id || item.id || item.value || 0,
          Para_Display_Name: item.Para_Display_Name || item.name || item.label || item.displayName || `Data Type ${item.id || 0}`
        }));
      }
      // If data is nested in a property
      else if (res.data && typeof res.data === 'object') {
        const dataObj = res.data as unknown as Record<string, unknown>;
        
        // Check for common nested structures
        for (const value of Object.values(dataObj)) {
          if (Array.isArray(value) && isDatatypeArray(value)) {
            datatypes = value.map((item: DatatypeApiResponseItem) => ({
              Para_Data_Type_Id: item.Para_Data_Type_Id || item.id || item.value || 0,
              Para_Display_Name: item.Para_Display_Name || item.name || item.label || item.displayName || `Data Type ${item.id || 0}`
            }));
            break; // Use first valid array
          }
        }
      }
      
      console.log("Parsed datatypes:", datatypes);
      return datatypes;
    } else {
      toast.error(res?.message || "Failed to load datatype");
      return [];
    }
  } catch (e: unknown) {
    console.error("getdatatypeDropdown Error:", e);
    toast.error("Network error loading datatype");
    return [];
  }
};

// Helper to get parameters with datatype names - FIXED
export const getParametersWithDatatypeNames = async (
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<parameterData[]> => {
  try {
    // Fetch both in parallel
    const [parameters, datatypes] = await Promise.all([
      getparameter(loadingOn, loadingOff),
      getdatatypeDropdown(loadingOn, loadingOff)
    ]);

    console.log("Parameters:", parameters);
    console.log("Datatypes:", datatypes);

    // Map parameters with datatype names
    const enhancedParameters = parameters.map(param => {
      // Find matching datatype
      const matchingDatatype = datatypes.find(
        dt => dt.Para_Data_Type_Id === param.Paramet_Data_Type
      );
      
      // Also try to match by string if IDs are strings
      const matchingDatatypeString = datatypes.find(
        dt => String(dt.Para_Data_Type_Id) === String(param.Paramet_Data_Type)
      );

      const datatypeToUse = matchingDatatype || matchingDatatypeString;
      
      return {
        ...param,
        Paramet_Data_Type_Name: datatypeToUse?.Para_Display_Name || `ID: ${param.Paramet_Data_Type}` || "Not Assigned"
      };
    });

    console.log("Enhanced parameters:", enhancedParameters);
    return enhancedParameters;
  } catch (e: unknown) {
    console.error("Error getting parameters with datatype names:", e);
    return [];
  }
};

// Rest of the API functions remain the same...
//------------------------------------------------------------------------------------------//

// Create parameter
export const createparameter = async (
  body: parameterCreateInput,
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<boolean> => {
  try {
    // Validate
    if (!body.Paramet_Name?.trim()) {
      toast.error("Parameter Name is required");
      return false;
    }

    if (body.Paramet_Data_Type === null || body.Paramet_Data_Type === undefined) {
      toast.error("Data Type is required");
      return false;
    }

    const cleanBody = {
      Paramet_Name: body.Paramet_Name.trim(),
      Paramet_Data_Type: Number(body.Paramet_Data_Type),
      Created_By: 1
    };

    const res = await fetchLink<BasicApiResponse>({
      address: parameterAPI,
      method: "POST",
      bodyData: cleanBody,
      loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
      loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
    });

    if (res && res.success) {
      toast.success(res.message || "Parameter created successfully");
      return true;
    } else {
      toast.error(res?.message || "Failed to create parameter");
      return false;
    }
  } catch (e: unknown) {
    console.error("createparameter Error:", e);
    toast.error("Network error creating parameter");
    return false;
  }
};

//------------------------------------------------------------------------------------------------------//

// Update parameter
export const updateparameter = async (
  body: parameterUpdateInput,
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<boolean> => {
  try {
    if (!body.Paramet_Id) {
      toast.error("Parameter ID is required for update");
      return false;
    }

    if (!body.Paramet_Name?.trim()) {
      toast.error("Parameter Name is required");
      return false;
    }

    if (body.Paramet_Data_Type === null || body.Paramet_Data_Type === undefined) {
      toast.error("Data Type is required");
      return false;
    }

    const cleanBody = {
      Paramet_Name: body.Paramet_Name.trim(),
      Paramet_Data_Type: Number(body.Paramet_Data_Type),
      Updated_By: 1
    };

    console.log("Updating parameter:", cleanBody);

    const res = await fetchLink<BasicApiResponse>({
      address: `${parameterAPI}${body.Paramet_Id}`,
      method: "PUT",
      bodyData: cleanBody,
      loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
      loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
    });

    if (res?.success) {
      toast.success(res.message || "Parameter updated successfully");
      return true;
    } else {
      toast.error(res?.message || "Failed to update parameter");
      return false;
    }
  } catch (e: unknown) {
    console.error("updateparameter Error:", e);
    
    // Handle JSON parse error
    if (e instanceof SyntaxError && e.message.includes("JSON")) {
      // Server returned empty response but operation likely succeeded
      toast.success("Parameter updated successfully");
      return true;
    }
    
    toast.error("Network error updating parameter");
    return false;
  }
};

//-----------------------------------------------------------------------------------------//

// Delete parameter
export const deleteparameter = async (
  id: number,
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<boolean> => {
  try {
    const res = await fetchLink<BasicApiResponse>({
      address: `${parameterAPI}${id}`,
      method: "DELETE",
      loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
      loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
    });

    if (res && res.success) {
      toast.success(res.message || "Parameter deleted successfully");
      return true;
    } else {
      toast.error(res?.message || "Failed to delete parameter");
      return false;
    }
  } catch (e: unknown) {
    console.error("DELETE parameter Error:", e);
    
    // Handle JSON parse error
    if (e instanceof SyntaxError && e.message.includes("JSON")) {
      toast.success("Parameter deleted successfully");
      return true;
    }
    
    toast.error("Network error deleting parameter");
    return false;
  }
};