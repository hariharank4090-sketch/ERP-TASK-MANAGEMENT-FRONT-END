import React, { useState, useEffect, useMemo } from "react";
import { 
  IconButton, 
  Tooltip, 
  Alert,
  Box,
  Typography,
  CircularProgress
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";
import { toast } from "react-toastify";

import DataTable, { createCol } from "../../../Components/dataTable";
import { ParameterDialog } from "./ParametersForm";
import { 
  getParametersWithDatatypeNames,
  createparameter,
  updateparameter,
  deleteparameter,
  getdatatypeDropdown
} from "./Parameters.api";
import type { 
  parameterData, 
  parameterCreateInput, 
  parameterUpdateInput
} from "./Parameters.variables";
import { emptyparameter } from "./Parameters.variables";
import type { datatypeDropdown } from "./Parameters.variables";
import type { PageProps } from "../../../routes/indexRouter";

const ParameterMainPage: React.FC<PageProps> = ({
  loadingOn,
  loadingOff,
}) => {
  const [parameters, setParameters] = useState<parameterData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [parameterObj, setParameterObj] = useState<parameterCreateInput>(emptyparameter);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [dialog, setDialog] = useState({
    createDialog: false,
    deleteDialog: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(false);
  const [datatypeOptions, setDatatypeOptions] = useState<datatypeDropdown[]>([]);
  const [error, setError] = useState<string | null>(null);

  /** Fetch All Data */
  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch dropdowns first
      setIsLoadingDropdowns(true);
      const dropdowns = await getdatatypeDropdown(loadingOn, loadingOff);
      setDatatypeOptions(dropdowns);
      setIsLoadingDropdowns(false);
      
      // Fetch parameters with enhanced data
      console.log("Fetching parameters with datatype names...");
      const enhancedParams = await getParametersWithDatatypeNames(loadingOn, loadingOff);
      
      console.log("Enhanced parameters:", enhancedParams);
      
      if (enhancedParams.length === 0) {
        setError("No parameters found");
      }
      
      setParameters(enhancedParams);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load data");
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Close all dialogs */
  const closeDialog = () => {
    setDialog({ createDialog: false, deleteDialog: false });
    setSelectedId(null);
    setParameterObj(emptyparameter);
  };

  /** Edit */
  const handleEdit = (row: parameterData) => {
    console.log("Editing row:", row);
    setSelectedId(row.Paramet_Id);
    
    const editData: parameterCreateInput = {
      Paramet_Name: row.Paramet_Name || "",
      Paramet_Data_Type: row.Paramet_Data_Type || null,
    };
    
    setParameterObj(editData);
    setDialog({ ...dialog, createDialog: true });
  };

  /** Delete click */
  const handleDelete = (id: number) => {
    setSelectedId(id);
    setDialog({ ...dialog, deleteDialog: true });
  };

  /** Save / Update */
  const saveParameter = async () => {
    console.log("Saving parameter:", parameterObj);
    
    if (!parameterObj.Paramet_Name?.trim()) {
      toast.warn("Parameter Name is required");
      return;
    }

    if (parameterObj.Paramet_Data_Type === null || parameterObj.Paramet_Data_Type === undefined) {
      toast.warn("Please select a Data Type");
      return;
    }

    let success = false;

    if (selectedId) {
      const updatePayload: parameterUpdateInput = {
        Paramet_Id: selectedId,
        Paramet_Name: parameterObj.Paramet_Name.trim(),
        Paramet_Data_Type: parameterObj.Paramet_Data_Type,
      };
      
      console.log("Updating with payload:", updatePayload);
      success = await updateparameter(updatePayload, loadingOn, loadingOff);
    } else {
      const createPayload: parameterCreateInput = {
        Paramet_Name: parameterObj.Paramet_Name.trim(),
        Paramet_Data_Type: parameterObj.Paramet_Data_Type,
      };
      
      console.log("Creating with payload:", createPayload);
      success = await createparameter(createPayload, loadingOn, loadingOff);
    }

    if (success) {
      closeDialog();
      await fetchAllData();
      toast.success(selectedId ? "Parameter updated successfully" : "Parameter created successfully");
    }
  };

  /** Delete Confirm */
  const deleteParameterConfirm = async () => {
    if (!selectedId) return;

    console.log("Deleting parameter ID:", selectedId);
    const success = await deleteparameter(selectedId, loadingOn, loadingOff);

    if (success) {
      closeDialog();
      await fetchAllData();
      toast.success("Parameter deleted successfully");
    }
  };

  /** Get datatype display name */
  const getDatatypeDisplayName = (row: parameterData): string => {
    // Use Paramet_Data_Type_Name if available
    if (row.Paramet_Data_Type_Name && row.Paramet_Data_Type_Name.trim() !== '') {
      return row.Paramet_Data_Type_Name;
    }
    
    // Fallback to dropdown options
    if (row.Paramet_Data_Type) {
      const datatype = datatypeOptions.find(dt => 
        dt.Para_Data_Type_Id === row.Paramet_Data_Type
      );
      if (datatype && datatype.Para_Display_Name) {
        return datatype.Para_Display_Name;
      }
    }
    
    return "Not Assigned";
  };

  // Filter data based on search term
  const filteredParameters = useMemo(() => {
    if (!searchTerm.trim()) return parameters;

    const term = searchTerm.toLowerCase();
    return parameters.filter((item) => {
      const parameterName = item.Paramet_Name?.toLowerCase() || '';
      const datatypeName = getDatatypeDisplayName(item).toLowerCase();
      
      return parameterName.includes(term) || datatypeName.includes(term);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, parameters, datatypeOptions]);

  // Check if data is loading
  const isDataLoading = isLoading || isLoadingDropdowns;

  // Debug: Log current state
  useEffect(() => {
    console.log("Current parameters:", parameters);
    console.log("Current datatype options:", datatypeOptions);
  }, [parameters, datatypeOptions]);

  return (
    <>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <DataTable
        headerTitle="Parameter Master"
        EnableSerialNumber
        dataArray={filteredParameters}
        showSearch={true}
        searchPlaceholder="Search Parameter or Data Type..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        showCreateButton={true}
        createButtonLabel="Add Parameter"
        onCreateClick={() => {
          setParameterObj(emptyparameter);
          setSelectedId(null);
          setDialog({ ...dialog, createDialog: true });
        }}
        createButtonColor="#c99f65"
        showMasterTableHeader={false}
        // isLoading={isDataLoading}
        columns={[
          createCol("Paramet_Name", "string", "Parameter Name"),
          {
            isVisible: 1,
            ColumnHeader: "Data Type",
            align: "left" as const,
            isCustomCell: true,
            Cell: ({ row }: { row: Record<string, unknown> }) => {
              const parameterRow = row as unknown as parameterData;
              const displayName = getDatatypeDisplayName(parameterRow);
              
              return (
                <Typography variant="body2">
                  {displayName || "Not Assigned"}
                </Typography>
              );
            },
          },
          {
            isVisible: 1,
            ColumnHeader: "Actions",
            align: "center" as const,
            isCustomCell: true,
            Cell: ({ row }: { row: Record<string, unknown> }) => {
              const id = row.Paramet_Id as number;
              const parameterRow = row as unknown as parameterData;
              
              return (
                <Box display="flex" justifyContent="center">
                  <Tooltip title="Edit">
                    <IconButton
                      onClick={() => handleEdit(parameterRow)}
                      color="primary"
                      size="small"
                      sx={{ mr: 1 }}
                      disabled={isDataLoading}
                    >
                      <Edit />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Delete">
                    <IconButton
                      onClick={() => handleDelete(id)}
                      color="error"
                      size="small"
                      disabled={isDataLoading}
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </Box>
              );
            },
          },
        ]}
      />

      {isDataLoading && parameters.length === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 5 }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="body1">Loading parameters...</Typography>
        </Box>
      )}

      {!isDataLoading && parameters.length === 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <Alert severity="info">
            No parameters found. Click "Add Parameter" to create one.
          </Alert>
        </Box>
      )}

      <ParameterDialog
        open={dialog.createDialog}
        onClose={closeDialog}
        onSubmit={saveParameter}
        type={selectedId ? "edit" : "create"}
        parameterObj={parameterObj}
        setParameterObj={setParameterObj}
        datatypeOptions={datatypeOptions}
        selectedId={selectedId}
        isLoading={isLoadingDropdowns}
      />

      <ParameterDialog
        open={dialog.deleteDialog}
        onClose={closeDialog}
        onSubmit={deleteParameterConfirm}
        type="delete"
        selectedId={selectedId}
        parameterObj={parameterObj}
        setParameterObj={setParameterObj}
      />
    </>
  );
};

export default ParameterMainPage;