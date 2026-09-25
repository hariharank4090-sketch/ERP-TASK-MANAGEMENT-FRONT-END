import React from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  Divider,
  Tooltip,
  FormControl,
  TextField,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import SearchableSelect from "./SearchableSelect";

export interface FilterSideSliderProps {
  open: boolean;
  onClose: () => void;
  onOpen?: () => void;
  title?: string;
  onSubmit?: () => void;
  onReset?: () => void;
  submitText?: string;
  closeText?: string;
  resetText?: string;
  children?: React.ReactNode;
  width?: number | string;
  showSideArrowTab?: boolean;
  inline?: boolean;
}

const DefaultFilterContent: React.FC = () => {
  const [projectStatus, setProjectStatus] = React.useState("ALL");
  const [project, setProject] = React.useState("ALL");
  const [taskType, setTaskType] = React.useState("ALL");
  const [task, setTask] = React.useState("ALL");
  const [employee, setEmployee] = React.useState("ALL");
  const [fromDate, setFromDate] = React.useState("");
  const [toDate, setToDate] = React.useState("");

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Project Status */}
      <FormControl size="small" fullWidth>
        <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, color: "#64748b" }}>
          Project Status
        </Typography>
        <SearchableSelect
          value={projectStatus}
          onChange={(e) => setProjectStatus(e.target.value)}
          options={[
            { value: "ALL", label: "All Status" },
            { value: "ACTIVE", label: "Active Only" },
            { value: "INACTIVE", label: "Inactive Only" },
          ]}
          searchPlaceholder="Search status..."
        />
      </FormControl>

      {/* Project */}
      <FormControl size="small" fullWidth>
        <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, color: "#64748b" }}>
          Project
        </Typography>
        <SearchableSelect
          value={project}
          onChange={(e) => setProject(e.target.value)}
          options={[
            { value: "ALL", label: "All Projects" },
          ]}
          allOptionLabel="All Projects"
          allOptionValue="ALL"
          searchPlaceholder="Search projects..."
        />
      </FormControl>

      {/* Task Type */}
      <FormControl size="small" fullWidth>
        <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, color: "#64748b" }}>
          Task Type
        </Typography>
        <SearchableSelect
          value={taskType}
          onChange={(e) => setTaskType(e.target.value)}
          options={[
            { value: "ALL", label: "All Task Types" },
          ]}
          allOptionLabel="All Task Types"
          allOptionValue="ALL"
          searchPlaceholder="Search task types..."
        />
      </FormControl>

      {/* Task */}
      <FormControl size="small" fullWidth>
        <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, color: "#64748b" }}>
          Task
        </Typography>
        <SearchableSelect
          value={task}
          onChange={(e) => setTask(e.target.value)}
          options={[
            { value: "ALL", label: "All Tasks" },
          ]}
          allOptionLabel="All Tasks"
          allOptionValue="ALL"
          searchPlaceholder="Search tasks..."
        />
      </FormControl>

      {/* Employee */}
      <FormControl size="small" fullWidth>
        <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, color: "#64748b" }}>
          Employee
        </Typography>
        <SearchableSelect
          value={employee}
          onChange={(e) => setEmployee(e.target.value)}
          options={[
            { value: "ALL", label: "All Employees" },
          ]}
          allOptionLabel="All Employees"
          allOptionValue="ALL"
          searchPlaceholder="Search employees..."
        />
      </FormControl>

      {/* From Date */}
      <FormControl size="small" fullWidth>
        <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, color: "#64748b" }}>
          From Date
        </Typography>
        <TextField
          type="date"
          size="small"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
          sx={{
            backgroundColor: "#fff",
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#d1d5db" },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#cda363" },
          }}
        />
      </FormControl>

      {/* To Date */}
      <FormControl size="small" fullWidth>
        <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, color: "#64748b" }}>
          To Date
        </Typography>
        <TextField
          type="date"
          size="small"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
          sx={{
            backgroundColor: "#fff",
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#d1d5db" },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#cda363" },
          }}
        />
      </FormControl>
    </Box>
  );
};

const FilterSideSlider: React.FC<FilterSideSliderProps> = ({
  open,
  onClose,
  onOpen,
  onSubmit,
  submitText = "SEARCH",
  title = "Filter Options",
  closeText = "CANCEL",
  children,
  width = 270,
  showSideArrowTab = true,
  inline = false,
}) => {
  React.useEffect(() => {
    if (open && !inline) {
      document.body.classList.add("filter-slider-open");
    } else {
      document.body.classList.remove("filter-slider-open");
    }

    return () => {
      document.body.classList.remove("filter-slider-open");
    };
  }, [open, inline]);

  if (inline) {
    if (!open) return null;
    return (
      <Box
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#ffffff",
          overflow: "hidden",
        }}
      >
        {/* Body */}
        <Box
          sx={{
            p: 1.5,
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
            backgroundColor: "#ffffff",
            "& .MuiTypography-caption": { fontSize: "0.75rem" },
            "& .MuiInputBase-root": { fontSize: "0.8rem" },
            "& .MuiInputLabel-root": { fontSize: "0.8rem" },
          }}
        >
          {children || <DefaultFilterContent />}
        </Box>

        <Divider />

        {/* Footer Actions - CANCEL & SEARCH buttons */}
        <Box
          sx={{
            p: 1.25,
            px: 1.5,
            backgroundColor: "#ffffff",
            display: "flex",
            alignItems: "center",
            gap: 1,
            justifyContent: "space-between",
          }}
        >
          <Button
            variant="outlined"
            onClick={onClose}
            sx={{
              flex: 1,
              color: "#64748b",
              borderColor: "#cbd5e1",
              fontWeight: 600,
              textTransform: "uppercase",
              fontSize: "0.75rem",
              borderRadius: "8px",
              py: 0.6,
              "&:hover": {
                borderColor: "#94a3b8",
                backgroundColor: "#f1f5f9",
              },
            }}
          >
            {closeText}
          </Button>
          {onSubmit && (
            <Button
              variant="contained"
              onClick={onSubmit}
              sx={{
                flex: 1,
                backgroundColor: "#cda363",
                color: "#ffffff",
                fontWeight: 600,
                textTransform: "uppercase",
                fontSize: "0.75rem",
                borderRadius: "8px",
                py: 0.6,
                boxShadow: "none",
                "&:hover": {
                  backgroundColor: "#b88a4f",
                  boxShadow: "none",
                },
              }}
            >
              {submitText || "SEARCH"}
            </Button>
          )}
        </Box>
      </Box>
    );
  }

  return (
    <>
      {/* Right Edge Arrow Toggle Button (shown only when drawer is closed) */}
      {showSideArrowTab && !open && (
        <Tooltip title="Filter Options" placement="left">
          <IconButton
            onClick={() => onOpen && onOpen()}
            sx={{
              position: "fixed",
              right: 0,
              top: "50%",
              transform: "translateY(-50%)",
              backgroundColor: "#cda363",
              color: "#ffffff",
              borderRadius: "8px 0 0 8px",
              width: 28,
              height: 44,
              boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
              zIndex: 2500,
              "&:hover": {
                backgroundColor: "#b88a4f",
              },
            }}
          >
            <ChevronLeftIcon />
          </IconButton>
        </Tooltip>
      )}

      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        hideBackdrop={true}
        ModalProps={{
          keepMounted: true,
          disableEnforceFocus: true,
          disableAutoFocus: true,
          disableScrollLock: true,
          sx: { pointerEvents: "none" },
        }}
        PaperProps={{
          sx: {
            pointerEvents: "auto",
            width: { xs: "100%", sm: width },
            maxWidth: "100vw",
            position: "fixed",
            top: { xs: "36px", sm: "45px", md: "48px" },
            bottom: { xs: "0px", sm: "3px", md: "6px" },
            right: { xs: 0, sm: "4.5px", md: "6px" },
            height: "auto",
            display: "flex",
            flexDirection: "column",
            boxShadow: "-4px 0 16px rgba(0,0,0,0.1)",
            borderRadius: "8px",
            border: "1px solid #d9bd91",
            overflow: "visible",
            backgroundColor: "#ffffff",
            zIndex: 1200,
          },
        }}
      >
        {/* Outer container matching reference image */}
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            borderRadius: "8px",
            overflow: "hidden",
            position: "relative",
            backgroundColor: "#ffffff",
            boxSizing: "border-box",
          }}
        >
          {/* Header */}
          <Box
            sx={{
              backgroundColor: "#cda363",
              color: "#ffffff",
              px: 1.5,
              py: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, fontSize: "0.875rem", letterSpacing: 0.2 }}
            >
              {title}
            </Typography>
            <IconButton
              onClick={onClose}
              size="small"
              sx={{
                color: "#ffffff",
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.3)" },
                width: 22,
                height: 22,
                p: 0,
              }}
            >
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Inner Content Area */}
          <Box
            sx={{
              p: 1.5,
              flex: 1,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
              backgroundColor: "#ffffff",
              "& .MuiTypography-caption": { fontSize: "0.75rem" },
              "& .MuiInputBase-root": { fontSize: "0.8rem" },
              "& .MuiInputLabel-root": { fontSize: "0.8rem" },
            }}
          >
            {children || <DefaultFilterContent />}
          </Box>

          <Divider sx={{ borderColor: "#e2e8f0" }} />

          {/* Footer Actions - CANCEL & SEARCH buttons */}
          <Box
            sx={{
              p: 1.25,
              px: 1.5,
              backgroundColor: "#ffffff",
              display: "flex",
              alignItems: "center",
              gap: 1,
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <Button
              variant="outlined"
              onClick={onClose}
              sx={{
                flex: 1,
                color: "#64748b",
                borderColor: "#cbd5e1",
                fontWeight: 600,
                textTransform: "uppercase",
                fontSize: "0.75rem",
                borderRadius: "8px",
                py: 0.6,
                "&:hover": {
                  borderColor: "#94a3b8",
                  backgroundColor: "#f1f5f9",
                },
              }}
            >
              {closeText}
            </Button>
            {onSubmit && (
              <Button
                variant="contained"
                onClick={onSubmit}
                sx={{
                  flex: 1,
                  backgroundColor: "#cda363",
                  color: "#ffffff",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  fontSize: "0.75rem",
                  borderRadius: "8px",
                  py: 0.6,
                  boxShadow: "none",
                  "&:hover": {
                    backgroundColor: "#b88a4f",
                    boxShadow: "none",
                  },
                }}
              >
                {submitText || "SEARCH"}
              </Button>
            )}
          </Box>
        </Box>
      </Drawer>
    </>
  );
};

export default FilterSideSlider;

