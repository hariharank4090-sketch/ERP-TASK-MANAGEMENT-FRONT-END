import React, { useState, useEffect, useMemo } from "react";
import { 
  IconButton, 
  Tooltip, 
  Alert,
  Box,
  Typography
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";
import { toast } from "react-toastify";

import DataTable, { createCol } from "../../../Components/dataTable";
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

  // Filter data based on search term
  const filteredLeaveTypes = useMemo(() => {
    if (!searchTerm.trim()) return leaveTypes;

    const term = searchTerm.toLowerCase();
    return leaveTypes.filter((item) => {
      const leaveTypeName = item.LeaveType?.toLowerCase() || '';
      return leaveTypeName.includes(term);
    });
  }, [searchTerm, leaveTypes]);

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