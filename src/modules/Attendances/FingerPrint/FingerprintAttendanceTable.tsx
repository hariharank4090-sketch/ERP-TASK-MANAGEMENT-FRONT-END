import React from "react";
import DataTable from "../../../Components/dataTable";
import type { AttendanceResult } from "./variables";

interface FingerprintAttendanceTableProps {
  data: AttendanceResult[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: any[];
  loading?: boolean;
}

export const FingerprintAttendanceTable: React.FC<FingerprintAttendanceTableProps> = ({
  data,
  columns,
}) => {
  return (
    <DataTable
      dataArray={data as unknown as Record<string, unknown>[]}
      columns={columns}
    />
  );
};

export default FingerprintAttendanceTable;
