/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from "react";
import { 
  IconButton, 
  Tooltip, 
  Alert,
  Box,
  Typography,
  FormControl,
  InputLabel
} from "@mui/material";
import { Edit, Delete, Refresh } from "@mui/icons-material";
import { toast } from "react-toastify";

import DataTable, { createCol } from "../../../Components/dataTable";
import TopFilterBar from "../../../Components/TopFilterBar";
import SearchableSelect from "../../../Components/SearchableSelect";
import { ProcessMasterDialog } from "./Process Masterform";
import { 
  getProcessMasters, 
  createProcessMaster, 
  updateProcessMaster, 
  deleteProcessMaster 
} from "./Process Master.api";
import type { 
  ProcessMasterData, 
  ProcessMasterCreateInput, 
  ProcessMasterUpdateInput 
} from "./Process Master.variables";
import { emptyProcessMaster } from "./Process Master.variables";
import type { PageProps } from "../../../routes/indexRouter";

const ProcessMasterMain: React.FC<PageProps> = ({
  loadingOn,
  loadingOff,
}) => {
  const [processes, setProcesses] = useState<ProcessMasterData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [processObj, setProcessObj] = useState<ProcessMasterCreateInput>(emptyProcessMaster);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedProcess, setSelectedProcess] = useState<ProcessMasterData | null>(null);
  const [dialog, setDialog] = useState({
    createDialog: false,
    deleteDialog: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoadingProcesses, setIsLoadingProcesses] = useState(false);

  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [processFilter, setProcessFilter] = useState<number | "ALL">("ALL");
  const [appliedProcess, setAppliedProcess] = useState<number | "ALL">("ALL");

  const numEq = (a: any, b: any) => {
    if (a == null || b == null) return false;
    return Number(a) === Number(b);
  };

  /** Fetch Process List */
  const fetchProcessList = async () => {
    try {
      setIsLoadingProcesses(true);
      const list = await getProcessMasters(loadingOn, loadingOff);
      
      console.log("✅ Processes loaded:", list.length, "items");
      
      setProcesses(list);
      setError(null);
    } catch (error) {
      console.error("Error fetching processes:", error);
      setError("Failed to load processes");
      toast.error("Failed to load processes");
    } finally {
      setIsLoadingProcesses(false);
    }
  };

  useEffect(() => {
    fetchProcessList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Close all dialogs */
  const closeDialog = () => {
    setDialog({ createDialog: false, deleteDialog: false });
    setSelectedId(null);
    setSelectedProcess(null);
    setProcessObj(emptyProcessMaster);
  };

  /** Edit */
  const handleEdit = (row: ProcessMasterData) => {
    setSelectedId(row.Id);
    setSelectedProcess(row);
    
    const editData: ProcessMasterCreateInput = {
      Process_Name: row.Process_Name || "",
    };
    
    setProcessObj(editData);
    setDialog({ ...dialog, createDialog: true });
  };

  /** Delete click */
  const handleDelete = (row: ProcessMasterData) => {
    setSelectedId(row.Id);
    setSelectedProcess(row);
    setDialog({ ...dialog, deleteDialog: true });
  };

  /** Save / Update */
  const saveProcess = async () => {
    if (!processObj.Process_Name.trim()) {
      toast.warn("Process Name is required");
      return;
    }

    let success = false;

    if (selectedId) {
      const updatePayload: ProcessMasterUpdateInput = {
        Id: selectedId,
        Process_Name: processObj.Process_Name.trim(),
      };
      
      success = await updateProcessMaster(updatePayload, loadingOn, loadingOff);
    } else {
      const createPayload: ProcessMasterCreateInput = {
        Process_Name: processObj.Process_Name.trim(),
      };
      
      success = await createProcessMaster(createPayload, loadingOn, loadingOff);
    }

    if (success) {
      closeDialog();
      fetchProcessList();
    }
  };

  /** Delete Confirm */
  const deleteProcessConfirm = async () => {
    if (!selectedId) return;

    const success = await deleteProcessMaster(selectedId, loadingOn, loadingOff);

    if (success) {
      closeDialog();
      fetchProcessList();
    }
  };

  const uniqueProcesses = useMemo(() => {
    const map = new Map();
    processes.forEach(p => {
      if (p.Id && p.Process_Name) {
        map.set(Number(p.Id), p.Process_Name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ Id: id, Process_Name: name }));
  }, [processes]);

  // Filter data based on search term
  const filteredProcesses = useMemo(() => {
    let filtered = processes;

    // Process filter
    if (appliedProcess !== "ALL") {
      filtered = filtered.filter(item => numEq(item.Id, appliedProcess));
    }

    if (!searchTerm.trim()) return filtered;

    const term = searchTerm.toLowerCase();
    return filtered.filter((item) => {
      const processName = item.Process_Name?.toLowerCase() || '';
      return processName.includes(term);
    });
  }, [searchTerm, processes, appliedProcess]);

  return (
    <>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <DataTable
        headerTitle="Process Master"
        EnableSerialNumber
        dataArray={filteredProcesses}
        showSearch={true}
        searchPlaceholder="Search Process..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        showCreateButton={true}
        createButtonLabel="Add Process"
        onCreateClick={() => {
          setProcessObj(emptyProcessMaster);
          setSelectedId(null);
          setSelectedProcess(null);
          setDialog({ ...dialog, createDialog: true });
        }}
        createButtonColor="#c99f65"
        headerActions={
          <Box display="flex" alignItems="center" gap={1}>
            <TopFilterBar
              onSearch={() => {
                setAppliedProcess(processFilter);
              }}
              dialogOpen={filterDialogOpen}
              onOpenDialog={() => {
                setProcessFilter(appliedProcess);
                setFilterDialogOpen(true);
              }}
              onCloseDialog={() => {
                setProcessFilter(appliedProcess);
                setFilterDialogOpen(false);
              }}
            >
              <Box display="flex" flexDirection="column" gap={2}>
                <FormControl size="small" fullWidth>
                  <InputLabel id="process-filter-label">Process Name</InputLabel>
                  <SearchableSelect
                    labelId="process-filter-label"
                    label="Process Name"
                    value={processFilter}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setProcessFilter(val);
                    }}
                    options={uniqueProcesses.map(p => ({
                      value: p.Id,
                      label: p.Process_Name
                    }))}
                    allOptionLabel="All Processes"
                    allOptionValue="ALL"
                    searchPlaceholder="Search process..."
                  />
                </FormControl>
              </Box>
            </TopFilterBar>
            <Tooltip title="Reset Filters & Refresh">
              <IconButton
                onClick={() => {
                  setSearchTerm("");
                  setProcessFilter("ALL");
                  setAppliedProcess("ALL");
                  
                  fetchProcessList();
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
        columns={[
          createCol("Process_Name", "string", "Process Name"),
          {
            isVisible: 1,
            ColumnHeader: "Actions",
            align: "center" as const,
            isCustomCell: true,
            Cell: ({ row }: { row: Record<string, unknown> }) => {
              const processRow = row as unknown as ProcessMasterData;
              
              return (
                <Box display="flex" justifyContent="center">
                  <Tooltip title="Edit">
                    <IconButton
                      onClick={() => handleEdit(processRow)}
                      color="primary"
                      size="small"
                      sx={{ mr: 1 }}
                    >
                      <Edit />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Delete">
                    <IconButton
                      onClick={() => handleDelete(processRow)}
                      color="error"
                      size="small"
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

      {isLoadingProcesses && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <Typography>Loading processes...</Typography>
        </Box>
      )}

      {/* Create/Edit Dialog */}
      <ProcessMasterDialog
        open={dialog.createDialog}
        onClose={closeDialog}
        onSubmit={saveProcess}
        type={selectedId ? "edit" : "create"}
        processObj={processObj}
        setProcessObj={setProcessObj}
        selectedId={selectedId}
      />

      {/* Delete Dialog */}
      <ProcessMasterDialog
        open={dialog.deleteDialog}
        onClose={closeDialog}
        onSubmit={deleteProcessConfirm}
        type="delete"
        process={selectedProcess}
      />
    </>
  );
};

export default ProcessMasterMain;