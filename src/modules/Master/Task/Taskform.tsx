import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  type SelectChangeEvent,
  Chip,
  Box,
  Typography,
  OutlinedInput,
  Checkbox,
  ListItemText,
} from "@mui/material";

import AppDialog from "../../../Components/appDialog";

import type {
  taskCreateInput,
  ProjectDropdown,
  taskgroupDropdown,
  ParameterDropdown,
} from "./Task.variables";

import { getAllTaskGroups } from "./Task.api";
import { toast } from "react-toastify";

interface TaskDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  type: "create" | "edit" | "delete";
  taskObj?: taskCreateInput;
  setTaskObj?: (obj: taskCreateInput) => void;
  projectOptions?: ProjectDropdown[];
  taskGroupOptions?: taskgroupDropdown[];  // Changed to match the prop being passed
  parameterOptions?: ParameterDropdown[];
  selectedId?: number | null;
  isLoading?: boolean;
  disableProjectSelect?: boolean;
  disableTaskTypeSelect?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const getDataTypeColor = (displayName: string | null | undefined): string => {
  const t = (displayName || "").toLowerCase();
  if (t.includes("number") || t.includes("decimal")) return "#1976d2";
  if (t.includes("text")   || t.includes("string"))  return "#2e7d32";
  if (t.includes("date")   || t.includes("time"))    return "#ed6c02";
  if (t.includes("bool"))                             return "#9c27b0";
  return "#757575";
};

const ITEM_HEIGHT    = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: { style: { maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP, width: 350 } },
};

// ── Component ─────────────────────────────────────────────────────────────────
export const TaskDialog: React.FC<TaskDialogProps> = ({
  open,
  onClose,
  onSubmit,
  type,
  taskObj = {
    Task_Name: "",
    Task_Desc: null,
    Task_Type_Id: null,
    Project_Id: null,
    Paramet_Ids: [],
    Paramet_Data_Types: [],
    Para_Display_Names: [],
    Created_By: 1,
  },
  setTaskObj,
  projectOptions = [],
  taskGroupOptions = [],  // Changed to match interface
  parameterOptions = [],
  selectedId = null,
  isLoading = false,
  disableProjectSelect = false,
  disableTaskTypeSelect = false,
}) => {
  const [allTaskGroups, setAllTaskGroups] = useState<taskgroupDropdown[]>([]);
  const [loadingTaskGroups, setLoadingTaskGroups] = useState(false);

  // ── Load task groups once when dialog opens ───────────────────────────────
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoadingTaskGroups(true);
      try {
        const groups = await getAllTaskGroups();
        if (!cancelled) setAllTaskGroups(groups);
      } catch {
        if (!cancelled) toast.error("Failed to load task groups");
      } finally {
        if (!cancelled) setLoadingTaskGroups(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open]);

  // Use provided taskGroupOptions or fallback to allTaskGroups
  const availableTaskGroups = useMemo(() => {
    return taskGroupOptions.length > 0 ? taskGroupOptions : allTaskGroups;
  }, [taskGroupOptions, allTaskGroups]);

  // ── Filter groups for selected project ───────────────────────────────────
  const filteredTaskGroups = useMemo<taskgroupDropdown[]>(() => {
    if (taskObj.Project_Id == null) return availableTaskGroups;
    return availableTaskGroups.filter(
      (g) => g.Project_Id == null || g.Project_Id === taskObj.Project_Id
    );
  }, [availableTaskGroups, taskObj.Project_Id]);

  const handleProjectChange = useCallback(
    (e: SelectChangeEvent<string>) => {
      const newProjectId = e.target.value === "" ? null : Number(e.target.value);
      const stillValid =
        taskObj.Task_Type_Id != null &&
        availableTaskGroups.some(
          (g) =>
            g.Task_Type_Id === taskObj.Task_Type_Id &&
            (g.Project_Id == null || g.Project_Id === newProjectId)
        );
      setTaskObj?.({
        ...taskObj,
        Project_Id: newProjectId,
        Task_Type_Id: stillValid ? taskObj.Task_Type_Id : null,
      });
    },
    [taskObj, availableTaskGroups, setTaskObj]
  );

  const handleTaskGroupChange = useCallback(
    (e: SelectChangeEvent<string>) => {
      setTaskObj?.({
        ...taskObj,
        Task_Type_Id: e.target.value === "" ? null : Number(e.target.value),
      });
    },
    [taskObj, setTaskObj]
  );

  const validProjects = useMemo(
    () => projectOptions.filter((p) => p.Project_Id != null),
    [projectOptions]
  );

  const validParameters = useMemo(
    () => parameterOptions.filter((p) => p.Paramet_Id != null),
    [parameterOptions]
  );

  const parameterMap = useMemo(
    () => new Map(validParameters.map((p) => [p.Paramet_Id, p])),
    [validParameters]
  );

  const getParameterById = useCallback(
    (id: number) => parameterMap.get(id),
    [parameterMap]
  );

  const parameterValues = useMemo(
    () => (taskObj.Paramet_Ids || []).map(String),
    [taskObj.Paramet_Ids]
  );

  const handleParameterChange = useCallback(
    (event: SelectChangeEvent<string[]>) => {
      const raw = event.target.value;
      const selectedIds = (typeof raw === "string" ? raw.split(",").map(Number) : raw.map(Number)).filter(
        (n) => !isNaN(n) && n > 0
      );
      setTaskObj?.({
        ...taskObj,
        Paramet_Ids: selectedIds,
        Paramet_Data_Types: selectedIds.map((id) => getParameterById(id)?.Paramet_Data_Type || null),
        Para_Display_Names: selectedIds.map((id) => getParameterById(id)?.Para_Display_Name || ""),
      });
    },
    [taskObj, getParameterById, setTaskObj]
  );

  const handleSubmit = useCallback(() => {
    if (!taskObj.Task_Name?.trim()) { toast.error("Task Name is required"); return; }
    if (!taskObj.Task_Type_Id) { toast.error("Task Group is required"); return; }
    onSubmit();
  }, [taskObj.Task_Name, taskObj.Task_Type_Id, onSubmit]);

  if (type === "delete") {
    return (
      <AppDialog
        open={open}
        onClose={onClose}
        onSubmit={onSubmit}
        title="Confirm Delete"
        submitText="Delete"
        closeText="Cancel"
        maxWidth="xs"
        fullWidth
      >
        <Box sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="h6" color="error">Delete Task?</Typography>
          <Typography sx={{ mt: 2 }}>This action cannot be undone.</Typography>
          {selectedId && <Typography sx={{ mt: 1 }}>Task ID: {selectedId}</Typography>}
        </Box>
      </AppDialog>
    );
  }

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={type === "edit" ? "Edit Task" : "Create Task"}
      submitText={type === "edit" ? "Update" : "Save"}
      maxWidth="sm"
      fullWidth
    >
      <Box sx={{ p: 1 }}>

        {/* Project */}
        <FormControl fullWidth margin="dense" disabled={disableProjectSelect}>
          <InputLabel>Project</InputLabel>
          <Select
            label="Project"
            value={taskObj.Project_Id == null ? "" : String(taskObj.Project_Id)}
            onChange={handleProjectChange}
          >
            <MenuItem value=""><em>Select Project</em></MenuItem>
            {validProjects.map((p) => (
              <MenuItem key={p.Project_Id} value={String(p.Project_Id)}>
                {p.Project_Name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Task Group */}
        <FormControl fullWidth margin="dense" disabled={loadingTaskGroups || isLoading || disableTaskTypeSelect}>
          <InputLabel>Task Group *</InputLabel>
          <Select
            label="Task Group *"
            value={taskObj.Task_Type_Id == null ? "" : String(taskObj.Task_Type_Id)}
            onChange={handleTaskGroupChange}
          >
            <MenuItem value=""><em>Select Task Group</em></MenuItem>
            {filteredTaskGroups.map((g) => (
              <MenuItem key={g.Task_Type_Id} value={String(g.Task_Type_Id)}>
                {g.Task_Type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Task Name */}
        <TextField
          fullWidth
          margin="dense"
          label="Task Name *"
          value={taskObj.Task_Name}
          onChange={(e) => setTaskObj?.({ ...taskObj, Task_Name: e.target.value })}
        />

        {/* Description */}
        <TextField
          fullWidth
          margin="dense"
          label="Description"
          multiline
          rows={2}
          value={taskObj.Task_Desc || ""}
          onChange={(e) => setTaskObj?.({ ...taskObj, Task_Desc: e.target.value || null })}
        />

        {/* Parameters */}
        <FormControl fullWidth margin="dense">
          <InputLabel>Parameters</InputLabel>
          <Select
            multiple
            value={parameterValues}
            onChange={handleParameterChange}
            input={<OutlinedInput label="Parameters" />}
            renderValue={(selected) => (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {selected.map((v) => {
                  const param = getParameterById(Number(v));
                  return (
                    <Chip
                      key={v}
                      label={param?.Paramet_Name || v}
                      size="small"
                      sx={{
                        backgroundColor: getDataTypeColor(param?.Para_Display_Name),
                        color: "white",
                      }}
                    />
                  );
                })}
              </Box>
            )}
            MenuProps={MenuProps}
          >
            {validParameters.map((param) => (
              <MenuItem key={param.Paramet_Id} value={String(param.Paramet_Id)}>
                <Checkbox
                  checked={(taskObj.Paramet_Ids || []).includes(param.Paramet_Id)}
                />
                <ListItemText
                  primary={param.Paramet_Name}
                  secondary={param.Para_Display_Name}
                />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

      </Box>
    </AppDialog>
  );
};