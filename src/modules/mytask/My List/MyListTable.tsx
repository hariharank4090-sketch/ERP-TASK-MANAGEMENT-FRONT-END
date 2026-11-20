import React, { useMemo } from "react";
import DataTable from "../../../Components/dataTable";
import { isScheduleCompletedForNextDate, getDateOnly } from "../../TodayPlan/todayplan.api";

interface MyListTableTableProps {
  data: Record<string, unknown>[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: any[];
  loading?: boolean;
  projectSchedules?: Record<string, unknown>[];
  executedTasks?: Record<string, unknown>[];
}

export const MyListTable: React.FC<MyListTableTableProps> = ({
  data,
  columns,
  projectSchedules = [],
}) => {
  const filteredData = useMemo(() => {
    if (!projectSchedules || projectSchedules.length === 0) {
      return data;
    }
    return data.filter((item) => {
      const itemDate = getDateOnly(
        (item.dateStr as string) ||
        (item.date as string) ||
        (item.Work_Dt as string) ||
        (item.rawWorkDate as string) ||
        (item.Task_Assign_dt as string) ||
        (item.Schedule_Sch_Date as string) ||
        (item.rawAssignedDate as string)
      );
      return !isScheduleCompletedForNextDate(item, projectSchedules, itemDate);
    });
  }, [data, projectSchedules]);

  return (
    <DataTable
      dataArray={filteredData}
      columns={columns}
    />
  );
};

export default MyListTable;
