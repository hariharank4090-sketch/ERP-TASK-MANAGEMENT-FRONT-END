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
import { LeaveTypeDialog } from "./LeaveTypeForm";
import { 
  getleavetype, 
  createleavetype, 
  updateleavetype, 
  deleteleavetype 
} from "./LeaveType.api";
import type { 
  leavetypeData, 
  leavetypeCreateInput, 
  leavetypeUpdateInput 
} from "./LeaveType.variables";
import { emptyleavetype } from "./LeaveType.variables";
import type { PageProps } from "../../../routes/indexRouter";

const LeaveTypeMainPage: React.FC<PageProps> = ({
  loadingOn,
  loadingOff,
}) => {
  const [leaveTypes, setLeaveTypes] = useState<leavetypeData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [leaveTypeObj, setLeaveTypeObj] = useState<leavetypeCreateInput>(emptyleavetype);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedLeaveType, setSelectedLeaveType] = useState<leavetypeData | null>(null);
  const [dialog, setDialog] = useState({
    createDialog: false,
    deleteDialog: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoadingLeaveTypes, setIsLoadingLeaveTypes] = useState(false);

  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<number | "ALL">("ALL");
  const [appliedLeaveType, setAppliedLeaveType] = useState<number | "ALL">("ALL");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const numEq = (a: any, b: any) => {
    if (a == null || b == null) return false;
    return Number(a) === Number(b);
  };

  /** Fetch Leave Types List */
  const fetchLeaveTypeList = async () => {
    try {
      setIsLoadingLeaveTypes(true);
      const list = await getleavetype(loadingOn, loadingOff);
      
      console.log("✅ Leave Types loaded:", list.length, "items");
      
      setLeaveTypes(list);
      setError(null);
    } catch (error) {
      console.error("Error fetching leave types:", error);
      setError("Failed to load leave types");
      toast.error("Failed to load leave types");
    } finally {
      setIsLoadingLeaveTypes(false);
    }
  };

  useEffect(() => {
    fetchLeaveTypeList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Close all dialogs */
  const closeDialog = () => {
    setDialog({ createDialog: false, deleteDialog: false });
    setSelectedId(null);
    setSelectedLeaveType(null);
    setLeaveTypeObj(emptyleavetype);
  };

  /** Edit */
  const handleEdit = (row: leavetypeData) => {
    setSelectedId(row.Id);
    setSelectedLeaveType(row);
    
    const editData: leavetypeCreateInput = {
      LeaveType: row.LeaveType || "",
    };
    
    setLeaveTypeObj(editData);
    setDialog({ ...dialog, createDialog: true });
  };

  /** Delete click */
  const handleDelete = (row: leavetypeData) => {
    setSelectedId(row.Id);
    setSelectedLeaveType(row);
    setDialog({ ...dialog, deleteDialog: true });
  };

  /** Save / Update */
  const saveLeaveType = async () => {
    if (!leaveTypeObj.LeaveType.trim()) {
      toast.warn("Leave Type Name is required");
      return;
    }

    let success = false;

    if (selectedId) {
      const updatePayload: leavetypeUpdateInput = {
        Id: selectedId,
        LeaveType: leaveTypeObj.LeaveType.trim(),
      };
      
      success = await updateleavetype(updatePayload, loadingOn, loadingOff);
    } else {
      const createPayload: leavetypeCreateInput = {
        LeaveType: leaveTypeObj.LeaveType.trim(),
      };
      
      success = await createleavetype(createPayload, loadingOn, loadingOff);
    }

    if (success) {
      closeDialog();
      fetchLeaveTypeList();
    }
  };

  /** Delete Confirm */
  const deleteLeaveTypeConfirm = async () => {
    if (!selectedId) return;

    const success = await deleteleavetype(selectedId, loadingOn, loadingOff);

    if (success) {
      closeDialog();
      fetchLeaveTypeList();
    }
  };

  const uniqueLeaveTypes = useMemo(() => {
    const map = new Map();
    leaveTypes.forEach(p => {
      if (p.Id && p.LeaveType) {
        map.set(Number(p.Id), p.LeaveType);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ Id: id, LeaveType: name }));
  }, [leaveTypes]);

  // Filter data based on search term
  const filteredLeaveTypes = useMemo(() => {
    let filtered = leaveTypes;

    // Leave Type filter
    if (appliedLeaveType !== "ALL") {
      filtered = filtered.filter(item => numEq(item.Id, appliedLeaveType));
    }

    if (!searchTerm.trim()) return filtered;

    const term = searchTerm.toLowerCase();
    return filtered.filter((item) => {
      const leaveTypeName = item.LeaveType?.toLowerCase() || '';
      return leaveTypeName.includes(term);
    });
  }, [searchTerm, leaveTypes, appliedLeaveType]);

  return (
    <>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <DataTable
        headerTitle="Leave Type Master"
        EnableSerialNumber
        dataArray={filteredLeaveTypes}
        showSearch={true}
        searchPlaceholder="Search Leave Type..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        showCreateButton={true}
        createButtonLabel="Add Leave Type"
        onCreateClick={() => {
          setLeaveTypeObj(emptyleavetype);
          setSelectedId(null);
          setSelectedLeaveType(null);
          setDialog({ ...dialog, createDialog: true });
        }}
        createButtonColor="#c99f65"
        headerActions={
          <Box display="flex" alignItems="center" gap={1}>
            <TopFilterBar
              onSearch={() => {
                setAppliedLeaveType(leaveTypeFilter);
              }}
              dialogOpen={filterDialogOpen}
              onOpenDialog={() => {
                setLeaveTypeFilter(appliedLeaveType);
                setFilterDialogOpen(true);
              }}
              onCloseDialog={() => {
                setLeaveTypeFilter(appliedLeaveType);
                setFilterDialogOpen(false);
              }}
            >
              <Box display="flex" flexDirection="column" gap={2}>
                <FormControl size="small" fullWidth>
                  <InputLabel id="leavetype-filter-label">Leave Type</InputLabel>
                  <SearchableSelect
                    labelId="leavetype-filter-label"
                    label="Leave Type"
                    value={leaveTypeFilter}
                    onChange={(e) => {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const val = e.target.value as any;
                      setLeaveTypeFilter(val);
                    }}
                    options={uniqueLeaveTypes.map(p => ({
                      value: p.Id,
                      label: p.LeaveType
                    }))}
                    allOptionLabel="All Leave Types"
                    allOptionValue="ALL"
                    searchPlaceholder="Search leave type..."
                  />
                </FormControl>
              </Box>
            </TopFilterBar>
            <Tooltip title="Reset Filters & Refresh">
              <IconButton
                onClick={() => {
                  setSearchTerm("");
                  setLeaveTypeFilter("ALL");
                  setAppliedLeaveType("ALL");
                  
                  fetchLeaveTypeList();
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
          createCol("LeaveType", "string", "Leave Type"),
          {
            isVisible: 1,
            ColumnHeader: "Actions",
            align: "center" as const,
            isCustomCell: true,
            Cell: ({ row }: { row: Record<string, unknown> }) => {
              const leaveTypeRow = row as unknown as leavetypeData;
              
              return (
                <Box display="flex" justifyContent="center">
                  <Tooltip title="Edit">
                    <IconButton
                      onClick={() => handleEdit(leaveTypeRow)}
                      color="primary"
                      size="small"
                      sx={{ mr: 1 }}
                    >
                      <Edit />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Delete">
                    <IconButton
                      onClick={() => handleDelete(leaveTypeRow)}
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

      {isLoadingLeaveTypes && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <Typography>Loading leave types...</Typography>
        </Box>
      )}

      {/* Create/Edit Dialog */}
      <LeaveTypeDialog
        open={dialog.createDialog}
        onClose={closeDialog}
        onSubmit={saveLeaveType}
        type={selectedId ? "edit" : "create"}
        leaveTypeObj={leaveTypeObj}
        setLeaveTypeObj={setLeaveTypeObj}
        selectedId={selectedId}
      />

      {/* Delete Dialog */}
      <LeaveTypeDialog
        open={dialog.deleteDialog}
        onClose={closeDialog}
        onSubmit={deleteLeaveTypeConfirm}
        type="delete"
        leaveType={selectedLeaveType}
      />
    </>
  );
};

export default LeaveTypeMainPage;