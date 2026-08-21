/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from "react";
import { 
  IconButton, 
  Tooltip, 
  Alert,
  Box,
  Typography,
  CircularProgress,
  FormControl,
  InputLabel
} from "@mui/material";
import { Edit, Delete, Refresh } from "@mui/icons-material";
import { toast } from "react-toastify";

import DataTable, { createCol } from "../../../Components/dataTable";
import TopFilterBar from "../../../Components/TopFilterBar";
import SearchableSelect from "../../../Components/SearchableSelect";
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

  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [dataTypeFilter, setDataTypeFilter] = useState<number | "ALL">("ALL");
  const [parameterFilter, setParameterFilter] = useState<number | "ALL">("ALL");
  const [appliedDataType, setAppliedDataType] = useState<number | "ALL">("ALL");
  const [appliedParameter, setAppliedParameter] = useState<number | "ALL">("ALL");

  const numEq = (a: any, b: any) => {
    if (a == null || b == null) return false;
    return Number(a) === Number(b);
  };

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

  const uniqueParameters = useMemo(() => {
    const map = new Map();
    parameters.forEach(p => {
      if (p.Paramet_Id && p.Paramet_Name) {
        map.set(Number(p.Paramet_Id), p.Paramet_Name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ Paramet_Id: id, Paramet_Name: name }));
  }, [parameters]);

  const getFilteredDataTypesForDropdown = useMemo(() => {
    if (parameterFilter === "ALL") return datatypeOptions;
    const validDataTypes = new Set(
      parameters
        .filter(item => numEq(item.Paramet_Id, parameterFilter))
        .map(item => Number(item.Paramet_Data_Type))
        .filter(id => !isNaN(id) && id !== 0)
    );
    return datatypeOptions.filter(dt => validDataTypes.has(dt.Para_Data_Type_Id));
  }, [datatypeOptions, parameters, parameterFilter]);

  const getFilteredParametersForDropdown = useMemo(() => {
    if (dataTypeFilter === "ALL") return uniqueParameters;
    const validParameters = new Set(
      parameters
        .filter(item => numEq(item.Paramet_Data_Type, dataTypeFilter))
        .map(item => Number(item.Paramet_Id))
    );
    return uniqueParameters.filter(p => validParameters.has(p.Paramet_Id));
  }, [uniqueParameters, parameters, dataTypeFilter]);

  useEffect(() => {
    if (dataTypeFilter !== "ALL") {
      const isValid = getFilteredDataTypesForDropdown.some(dt => numEq(dt.Para_Data_Type_Id, dataTypeFilter));
      if (!isValid) setDataTypeFilter("ALL");
    }

    if (parameterFilter !== "ALL") {
      const isValid = getFilteredParametersForDropdown.some(p => numEq(p.Paramet_Id, parameterFilter));
      if (!isValid) setParameterFilter("ALL");
    }
  }, [dataTypeFilter, parameterFilter, parameters, getFilteredDataTypesForDropdown, getFilteredParametersForDropdown]);

  // Filter data based on search term
  const filteredParameters = useMemo(() => {
    let filtered = parameters;
    
    // Data Type filter
    if (appliedDataType !== "ALL") {
      filtered = filtered.filter(item => numEq(item.Paramet_Data_Type, appliedDataType));
    }

    // Parameter filter
    if (appliedParameter !== "ALL") {
      filtered = filtered.filter(item => numEq(item.Paramet_Id, appliedParameter));
    }

    if (!searchTerm.trim()) return filtered;

    const term = searchTerm.toLowerCase();
    return filtered.filter((item) => {
      const parameterName = item.Paramet_Name?.toLowerCase() || '';
      const datatypeName = getDatatypeDisplayName(item).toLowerCase();
      
      return parameterName.includes(term) || datatypeName.includes(term);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, parameters, datatypeOptions, appliedDataType, appliedParameter]);

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
        headerActions={
          <Box display="flex" alignItems="center" gap={1}>
            <TopFilterBar
              onSearch={() => {
                setAppliedDataType(dataTypeFilter);
                setAppliedParameter(parameterFilter);
              }}
              dialogOpen={filterDialogOpen}
              onOpenDialog={() => {
                setDataTypeFilter(appliedDataType);
                setParameterFilter(appliedParameter);
                setFilterDialogOpen(true);
              }}
              onCloseDialog={() => {
                setDataTypeFilter(appliedDataType);
                setParameterFilter(appliedParameter);
                setFilterDialogOpen(false);
              }}
            >
              <Box display="flex" flexDirection="column" gap={2}>
                <FormControl size="small" fullWidth>
                  <InputLabel id="parameter-filter-label">Parameter Name</InputLabel>
                  <SearchableSelect
                    labelId="parameter-filter-label"
                    label="Parameter Name"
                    value={parameterFilter}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setParameterFilter(val);
                    }}
                    options={getFilteredParametersForDropdown.map(p => ({
                      value: p.Paramet_Id,
                      label: p.Paramet_Name
                    }))}
                    allOptionLabel="All Parameters"
                    allOptionValue="ALL"
                    searchPlaceholder="Search parameter..."
                  />
                </FormControl>
                <FormControl size="small" fullWidth>
                  <InputLabel id="data-type-filter-label">Data Type</InputLabel>
                  <SearchableSelect
                    labelId="data-type-filter-label"
                    label="Data Type"
                    value={dataTypeFilter}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setDataTypeFilter(val);
                    }}
                    options={getFilteredDataTypesForDropdown.map(d => ({
                      value: d.Para_Data_Type_Id,
                      label: d.Para_Display_Name
                    }))}
                    allOptionLabel="All Data Types"
                    allOptionValue="ALL"
                    searchPlaceholder="Search data type..."
                  />
                </FormControl>
              </Box>
            </TopFilterBar>
            <Tooltip title="Reset Filters & Refresh">
              <IconButton
                onClick={() => {
                  setSearchTerm("");
                  setDataTypeFilter("ALL");
                  setParameterFilter("ALL");
                  setAppliedDataType("ALL");
                  setAppliedParameter("ALL");
                  
                  fetchAllData();
                  toast.info("Page filters reset and refreshed");
                }}
                sx={{
                  backgroundColor: "#ffffff",
                  border: "1.5px solid #000000",
                  borderRadius: "50%",
                  width: 36,
                  height: 36,
                  padding: 0,
                  "&:hover": {
                    backgroundColor: "#f5f5f5",
                    border: "1.5px solid #000000",
                  },
                  boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                }}
              >
                <Refresh sx={{ fontSize: 20, color: "#000000" }} />
              </IconButton>
            </Tooltip>
          </Box>
        }
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