import React from "react";
import DataTable from "../../../Components/dataTable";

interface TaskComparisonTableProps {
  data: Record<string, unknown>[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: any[];
  loading?: boolean;
}

export const TaskComparisonTable: React.FC<TaskComparisonTableProps> = ({
  data,
  columns,
}) => {
  return (
    <DataTable
      dataArray={data}
      columns={columns}
    />
  );
};

export default TaskComparisonTable;
