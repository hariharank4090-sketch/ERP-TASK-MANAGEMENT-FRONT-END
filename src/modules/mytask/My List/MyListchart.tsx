import React from "react";
import { Box, Typography, Paper } from "@mui/material";

interface MyListChartProps {
  title?: string;
  assignedCount?: number;
  executedCount?: number;
}

export const MyListChart: React.FC<MyListChartProps> = ({
  title = "Task Comparison Chart",
  assignedCount = 0,
  executedCount = 0,
}) => {
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Box sx={{ display: "flex", gap: 4, mt: 1 }}>
        <Box>
          <Typography variant="caption" color="textSecondary">Assigned Tasks</Typography>
          <Typography variant="h4" color="primary.main">{assignedCount}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="textSecondary">Executed Tasks</Typography>
          <Typography variant="h4" color="success.main">{executedCount}</Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default MyListChart;
