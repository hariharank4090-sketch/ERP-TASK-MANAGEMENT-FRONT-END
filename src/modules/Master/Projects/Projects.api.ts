import { toast } from "react-toastify";
import { fetchLink } from "../../../Components/customFetch";
import type {
  projectData,
  projectCreateInput,
  projectUpdateInput,
  BasicApiResponse,
  companyDropdown,
  projectheadDropdown
} from "./Projects.variables";

const projectAPI = "masters/project/";
const companyAPI = "masters/dropdowns/company";
const projectheadAPI = "masters/employees";

// Get all projects
export const getProjectMaster = async (
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<projectData[]> => {
  try {
    const res = await fetchLink<BasicApiResponse>({ 
      address: projectAPI,
      method: "GET",
      loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
      loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
    });

    if (res && res.success) {
      const projects = (res.data as unknown as projectData[]) || [];
      return projects;
    } else {
      toast.error(res?.message || "Failed to load projects");
      return [];
    }
  } catch (e: unknown) {
    console.error("getProjectMaster Error:", e);
    toast.error("Network error loading projects");
    return [];
  }
};

// Get active projects only
export const getActiveProjectMaster = async (
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<projectData[]> => {
  try {
    const res = await fetchLink<BasicApiResponse>({ 
      address: `${projectAPI}active`,
      method: "GET",
      loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
      loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
    });

    if (res && res.success) {
      const projects = (res.data as unknown as projectData[]) || [];
      return projects;
    } else {
      toast.error(res?.message || "Failed to load active projects");
      return [];
    }
  } catch (e: unknown) {
    console.error("getActiveProjectMaster Error:", e);
    toast.error("Network error loading active projects");
    return [];
  }
};

// Get company dropdown 
export const getCompanyDropdown = async (
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<companyDropdown[]> => {
  try {
    const res = await fetchLink<BasicApiResponse>({ 
      address: companyAPI,
      method: "GET",
      loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
      loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
    });

    if (res && res.success) {
      const companyData = res.data as unknown as companyDropdown[];
      
      if (companyData && Array.isArray(companyData)) {
        return companyData;
      }
      
      return [];
    } else {
      toast.error(res?.message || "Failed to load company");
      return [];
    }
  } catch (e: unknown) {
    console.error("getCompanyDropdown Error:", e);
    toast.error("Network error loading company");
    return [];
  }
};

// Get project head dropdown 
export const getProjectHeadDropdown = async (
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<projectheadDropdown[]> => {
  try {
    const res = await fetchLink<BasicApiResponse>({ 
      address: projectheadAPI,
      method: "GET",
      loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
      loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
    });

    if (res && res.success) {
      const projectheadData = res.data as unknown as Array<{ Emp_Id: number; Emp_Name: string }>;
      
      if (projectheadData && Array.isArray(projectheadData)) {
        // Transform Emp_Id to value for consistent dropdown handling
        const transformedData = projectheadData.map(item => ({
          value: item.Emp_Id,
          label: item.Emp_Name
        }));
        console.log("Project Head Dropdown Data:", transformedData); // Debug log
        return transformedData;
      }
      
      return [];
    } else {
      toast.error(res?.message || "Failed to load project head");
      return [];
    }
  } catch (e: unknown) {
    console.error("getProjectHeadDropdown Error:", e);
    toast.error("Network error loading project head");
    return [];
  }
};

// Create project
export const createProjectMaster = async ( 
  body: projectCreateInput,
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<boolean> => {
  try {
    const statusValue = body.Project_Status === 0 ? 0 : 1;
    
    const cleanBody = {
      Project_Name: body.Project_Name.trim(),
      Project_Desc: body.Project_Desc?.trim() || null,
      Company_Id: body.Company_Id || null,
      Project_Head: body.Project_Head || null,
      Est_Start_Dt: body.Est_Start_Dt || null,
      Est_End_Dt: body.Est_End_Dt || null,
      Project_Status: statusValue,
      IsActive: statusValue
    };

    console.log("Creating Project with payload:", cleanBody); // Debug log

    const res = await fetchLink<BasicApiResponse>({
      address: projectAPI,
      method: "POST",
      bodyData: cleanBody,
      loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
      loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
    });

    if (res && res.success) {
      toast.success(res.message || "Project created successfully");
      return true;
    } else {
      toast.error(res?.message || "Failed to create project");
      return false;
    }
  } catch (e: unknown) {
    console.error("createProjectMaster Error:", e);
    toast.error("Network error creating project");
    return false;
  }
};

// Update project
export const updateProjectMaster = async (
  body: projectUpdateInput,
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<boolean> => {
  try {
    if (!body.Project_Id) {
      toast.error("Project ID is required for update");
      return false;
    }

    const statusValue = body.Project_Status === 0 ? 0 : 1;
    
    const cleanBody = {
      Project_Name: body.Project_Name.trim(),
      Project_Desc: body.Project_Desc?.trim() || null,
      Company_Id: body.Company_Id || null,
      Project_Head: body.Project_Head || null,
      Est_Start_Dt: body.Est_Start_Dt || null,
      Est_End_Dt: body.Est_End_Dt || null,
      Project_Status: statusValue,
      IsActive: statusValue
    };

    console.log("Updating Project with payload:", cleanBody); // Debug log

    const res = await fetchLink<BasicApiResponse>({
      address: `${projectAPI}${body.Project_Id}`,
      method: "PUT",
      bodyData: cleanBody,
      loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
      loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
    });

    if (res?.success) {
      toast.success(res.message || "Project updated successfully");
      return true;
    } else {
      toast.error(res?.message || "Failed to update project");
      return false;
    }
  } catch (e: unknown) {
    console.error("updateProjectMaster Error:", e);
    toast.error("Network error updating project");
    return false;
  }
};

// Delete project
export const deleteProjectMaster = async ( 
  id: number,
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<boolean> => {
  try {
    const res = await fetchLink<BasicApiResponse>({
      address: `${projectAPI}${id}`, 
      method: "DELETE",
      loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
      loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
    });

    if (res && res.success) {
      toast.success(res.message || "Project deleted successfully");
      return true;
    } else {
      toast.error(res?.message || "Failed to delete project");
      return false;
    }
  } catch (e: unknown) {
    console.error("DELETE Project Error:", e);
    toast.error("Network error deleting project");
    return false;
  }
};