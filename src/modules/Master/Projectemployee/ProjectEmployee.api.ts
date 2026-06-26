import { toast } from "react-toastify";
import { fetchLink } from "../../../Components/customFetch";
import type {
  ProjectEmployeeData,
  ProjectEmployeeCreateInput,
  ProjectEmployeeUpdateInput,
  BasicApiResponse,
  ProjectDropdown,
  EmployeeDropdown,
  ProjectEmployeeGroupData
} from "./ProjectEmployee.variables";

const projectemployeeAPI = "masters/projectEmployee/";
const projectAPI = "masters/project/";
const employeeAPI = "masters/employees";

// Get all project employees and flatten the data for table display
export const getProjectEmployee = async (
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<ProjectEmployeeData[]> => {
  try {
    const res = await fetchLink<BasicApiResponse>({ 
      address: projectemployeeAPI,
      method: "GET",
      loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
      loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
    });

    if (res && res.success) {
      const data = (res.data as unknown as ProjectEmployeeData[]) || [];
      
      // Check if the data is already flattened (has Employee_Id at top level)
      if (data.length > 0 && data[0].Employee_Id !== undefined) {
        return data;
      }
      
      // If we received grouped data, flatten it for the table
      const groupedData = (res.data as unknown as ProjectEmployeeGroupData[]) || [];
      const flattenedData: ProjectEmployeeData[] = [];
      
      groupedData.forEach(projectGroup => {
        projectGroup.Employees.forEach(employee => {
          flattenedData.push({
            Employee_Id: employee.Employee_Id,
            Project_Id: projectGroup.Project_Id,
            Project_Name: projectGroup.Project_Name,
            Emp_Id: employee.Emp_Id,
            Emp_Name: employee.Emp_Name
          });
        });
      });
      
      return flattenedData;
    } else {
      toast.error(res?.message || "Failed to load Project Employees");
      return [];
    }
  } catch (e: unknown) {
    console.error("getProjectEmployee Error:", e);
    toast.error("Network error loading Project Employees");
    return [];
  }
};

// Get employees by project ID
export const getEmployeesByProjectId = async (
  projectId: number,
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<ProjectEmployeeData[]> => {
  try {
    const res = await fetchLink<BasicApiResponse>({ 
      address: `${projectemployeeAPI}byProject/${projectId}`,
      method: "GET",
      loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
      loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
    });

    if (res && res.success) {
      return (res.data as unknown as ProjectEmployeeData[]) || [];
    } else {
      toast.error(res?.message || "Failed to load Project Employees");
      return [];
    }
  } catch (e: unknown) {
    console.error("getEmployeesByProjectId Error:", e);
    toast.error("Network error loading Project Employees");
    return [];
  }
};

// Get project dropdown
export const getProjectDropdown = async (
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<ProjectDropdown[]> => {
  try {
    const res = await fetchLink<BasicApiResponse>({ 
      address: projectAPI,
      method: "GET",
      loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
      loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
    });

    if (res && res.success) {
      const projectData = (res.data as unknown as ProjectDropdown[]) || [];
      
      if (projectData.length > 0 && Array.isArray(projectData[0])) {
        return (projectData as unknown as ProjectDropdown[][]).flat();
      }
      
      return projectData;
    } else {
      toast.error(res?.message || "Failed to load Projects");
      return [];
    }
  } catch (e: unknown) {
    console.error("getProjectDropdown Error:", e);
    toast.error("Network error loading Projects");
    return [];
  }
};

// Get Employee dropdown 
export const getEmployeeDropdown = async (
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<EmployeeDropdown[]> => {
  try {
    const res = await fetchLink<BasicApiResponse>({
      address: employeeAPI,
      method: "GET",
      loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
      loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
    });

    if (res && res.success) {
      return (res.data as unknown as EmployeeDropdown[]) || [];
    } else {
      toast.error(res?.message || "Failed to load Employees");
      return [];
    }
  } catch (e: unknown) {
    console.error("getEmployeeDropdown Error:", e);
    toast.error("Network error loading Employees");
    return [];
  }
};

// Create multiple project employees
export const createProjectEmployee = async ( 
  body: ProjectEmployeeCreateInput,
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<boolean> => {
  try {
    if (!body.Project_Id || !body.Emp_Id.length) {
      toast.error("Project and at least one employee are required");
      return false;
    }

    // Create multiple employees in parallel
    const promises = body.Emp_Id.map(empId => {
      const cleanBody = {
        Project_Id: body.Project_Id,
        Emp_Id: empId,
        Created_By: 1 // This should come from auth context
      };

      return fetchLink<BasicApiResponse>({
        address: projectemployeeAPI,
        method: "POST",
        bodyData: cleanBody,
        loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
        loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
      });
    });

    const results = await Promise.all(promises);
    const allSuccess = results.every(res => res?.success);
    
    if (allSuccess) {
      toast.success(`Successfully assigned ${body.Emp_Id.length} employee(s) to project`);
      return true;
    } else {
      const successCount = results.filter(res => res?.success).length;
      if (successCount > 0) {
        toast.warning(`Assigned ${successCount} out of ${body.Emp_Id.length} employees`);
        return true;
      } else {
        toast.error("Failed to assign any employees");
        return false;
      }
    }
  } catch (e: unknown) {
    console.error("createProjectEmployee Error:", e);
    toast.error("Network error creating Project Employees");
    return false;
  }
};

// Update project employees - bulk update for a project
export const updateProjectEmployee = async (
  body: ProjectEmployeeUpdateInput,
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<boolean> => {
  try {
    if (!body.Project_Id) {
      toast.error("Project is required for update");
      return false;
    }

    // First, get current employees for this project
    const currentEmployees = await getEmployeesByProjectId(body.Project_Id);
    const currentEmpIds = currentEmployees.map(emp => emp.Emp_Id).filter((id): id is number => id !== null);
    
    // Find employees to add and remove
    const employeesToAdd = body.Emp_Id.filter(id => !currentEmpIds.includes(id));
    const employeesToRemove = currentEmpIds.filter(id => !body.Emp_Id.includes(id));
    
    let addSuccess = true;
    let removeSuccess = true;
    
    // Add new employees
    if (employeesToAdd.length > 0) {
      const addPromises = employeesToAdd.map(empId => {
        const cleanBody = {
          Project_Id: body.Project_Id,
          Emp_Id: empId,
          Created_By: 1 // This should come from auth context
        };

        return fetchLink<BasicApiResponse>({
          address: projectemployeeAPI,
          method: "POST",
          bodyData: cleanBody,
          loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
          loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
        });
      });
      
      const addResults = await Promise.all(addPromises);
      addSuccess = addResults.every(res => res?.success);
    }
    
    // Remove employees
    if (employeesToRemove.length > 0) {
      // Get Employee_Ids for employees to remove
      const employeeIdsToDelete = currentEmployees
        .filter(item => employeesToRemove.includes(item.Emp_Id!))
        .map(item => item.Employee_Id);
      
      const removePromises = employeeIdsToDelete.map(id => 
        fetchLink<BasicApiResponse>({
          address: `${projectemployeeAPI}${id}`,
          method: "DELETE",
          loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
          loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
        })
      );
      
      const removeResults = await Promise.all(removePromises);
      removeSuccess = removeResults.every(res => res?.success);
    }
    
    if (addSuccess && removeSuccess) {
      toast.success(`Successfully updated employees for project`);
      return true;
    } else {
      toast.warning("Partially updated project employees");
      return false;
    }
  } catch (e: unknown) {
    console.error("updateProjectEmployee Error:", e);
    toast.error("Network error updating Project Employees");
    return false;
  }
};

// Delete single project employee by Employee_Id
export const deleteProjectEmployee = async ( 
  id: number,
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<boolean> => {
  try {
    const res = await fetchLink<BasicApiResponse>({
      address: `${projectemployeeAPI}${id}`,
      method: "DELETE",
      loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
      loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
    });

    if (res && res.success) {
      toast.success(res.message || "Project Employee deleted successfully");
      return true;
    } else {
      toast.error(res?.message || "Failed to delete Project Employee");
      return false;
    }
  } catch (e: unknown) {
    console.error("DELETE ProjectEmployee Error:", e);
    toast.error("Network error deleting Project Employee");
    return false;
  }
};

// Delete multiple project employees by project ID and employee IDs
export const deleteMultipleProjectEmployees = async (
  projectId: number,
  empIds: number[],
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<boolean> => {
  try {
    if (!projectId || empIds.length === 0) {
      toast.error("Project ID and employees are required");
      return false;
    }

    // First get all project employees to find the Employee_Id for each Emp_Id
    const res = await fetchLink<BasicApiResponse>({
      address: projectemployeeAPI,
      method: "GET",
      loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
      loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
    });

    if (res && res.success) {
      const data = (res.data as unknown as ProjectEmployeeData[]) || [];
      
      // Find Employee_Id for each Emp_Id under this project
      const employeeIdsToDelete = data
        .filter(item => item.Project_Id === projectId && empIds.includes(item.Emp_Id!))
        .map(item => item.Employee_Id);
      
      if (employeeIdsToDelete.length === 0) {
        toast.error("No matching employees found to delete");
        return false;
      }
      
      // Delete all matching records in parallel
      const deletePromises = employeeIdsToDelete.map(id => 
        fetchLink<BasicApiResponse>({
          address: `${projectemployeeAPI}${id}`,
          method: "DELETE",
          loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
          loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
        })
      );
      
      const results = await Promise.all(deletePromises);
      const allSuccess = results.every(res => res?.success);
      
      if (allSuccess) {
        toast.success(`Successfully removed ${empIds.length} employee(s) from project`);
        return true;
      } else {
        const successCount = results.filter(res => res?.success).length;
        toast.warning(`Removed ${successCount} out of ${empIds.length} employees`);
        return successCount > 0;
      }
    }
    return false;
  } catch (e: unknown) {
    console.error("deleteMultipleProjectEmployees Error:", e);
    toast.error("Network error deleting Project Employees");
    return false;
  }
};

// Delete ALL employees from a project
export const deleteAllProjectEmployees = async (
  projectId: number,
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<boolean> => {
  try {
    // Get all employees for this project
    const projectEmployeesList = await getEmployeesByProjectId(projectId, loadingOn, loadingOff);
    
    if (projectEmployeesList.length === 0) {
      toast.info("No employees to remove from this project");
      return true;
    }
    
    const empIds = projectEmployeesList
      .map(emp => emp.Emp_Id)
      .filter((id): id is number => id !== null);
    
    // Use deleteMultipleProjectEmployees to remove all
    return await deleteMultipleProjectEmployees(projectId, empIds, loadingOn, loadingOff);
  } catch (e: unknown) {
    console.error("deleteAllProjectEmployees Error:", e);
    toast.error("Network error deleting all Project Employees");
    return false;
  }
};