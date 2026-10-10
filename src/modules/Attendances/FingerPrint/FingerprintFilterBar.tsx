import React, { useState } from "react";
import TopFilterBar from "../../../Components/TopFilterBar";
import { TextField, Box } from "@mui/material";

interface FingerprintFilterBarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onOpenFilterDialog?: () => void;
  onSync?: () => void;
}

export const FingerprintFilterBar: React.FC<FingerprintFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  onOpenFilterDialog,
  onSync,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <TopFilterBar
      onSearch={onSync || (() => {})}
      onReset={() => onSearchChange("")}
      dialogOpen={dialogOpen}
      onOpenDialog={onOpenFilterDialog || (() => setDialogOpen(true))}
      onCloseDialog={() => setDialogOpen(false)}
    >
      <Box sx={{ p: 1 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </Box>
    </TopFilterBar>
  );
};

export default FingerprintFilterBar;
