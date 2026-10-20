import React, { useMemo } from "react";
import DataTable from "../../../Components/dataTable";
import { isScheduleCompletedForNextDate } from "../../TodayPlan/todayplan.api";

interface TaskComparisonTableProps {
  data: Record<string, unknown>[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: any[];
  loading?: boolean;
  projectSchedules?: Record<string, unknown>[];
  executedTasks?: Record<string, unknown>[];
}

export const TaskComparisonTable: React.FC<TaskComparisonTableProps> = ({
  data,
  columns,
  projectSchedules = [],
}) => {
  const filteredData = useMemo(() => {
    if (!projectSchedules || projectSchedules.length === 0) {
      return data;
    }
    return data.filter(
      (item) => !isScheduleCompletedForNextDate(item, projectSchedules)
    );
  }, [data, projectSchedules]);

  return (
    <DataTable
      dataArray={filteredData}
      columns={columns}
    />
  );
};

export default TaskComparisonTable;
