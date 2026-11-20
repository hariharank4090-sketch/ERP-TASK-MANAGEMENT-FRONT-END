import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import TaskComparisonTable from '../../../../src/modules/Reports/comparisonReports/TaskComparisonTable';
import { renderWithProviders } from '../../../../src/test/test-utils';

vi.mock('../../../../src/modules/TodayPlan/todayplan.api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../src/modules/TodayPlan/todayplan.api')>();
  return {
    ...actual,
    isScheduleCompletedForNextDate: vi.fn().mockReturnValue(false),
  };
});

describe('TaskComparisonTable Component', () => {
  const columns = [
    { Field_Name: 'taskName', ColumnHeader: 'Task Name', isVisible: 1, Field_Data: 'string' },
    { Field_Name: 'status', ColumnHeader: 'Status', isVisible: 1, Field_Data: 'string' },
  ];

  const data = [
    { taskName: 'API Endpoint Setup', status: 'Completed' },
    { taskName: 'DB Migration', status: 'In Progress' },
  ];

  it('renders task comparison table with rows', () => {
    renderWithProviders(
      <TaskComparisonTable
        data={data}
        columns={columns}
      />
    );

    expect(screen.getByText('Task Name')).toBeInTheDocument();
    expect(screen.getByText('API Endpoint Setup')).toBeInTheDocument();
  });

  it('filters completed schedules for next dates based on display date while keeping uncompleted schedules', async () => {
    const { isScheduleCompletedForNextDate } = await import('../../../../src/modules/TodayPlan/todayplan.api');
    vi.mocked(isScheduleCompletedForNextDate).mockImplementation((plan: any, _schedules: any[], targetDate?: any) => {
      const isCompleted = Number(plan.Schedule_Sch_Status) === 3;
      if (!isCompleted) return false;
      const compDate = '2026-11-15';
      const checkDt = targetDate ? String(targetDate).slice(0, 10) : '';
      return checkDt > compDate;
    });

    const comparisonData = [
      {
        taskName: 'Ongoing Schedule Task',
        dateStr: '17-11-2026',
        Task_Assign_dt: '2026-10-15',
        Schedule_Sch_Status: 1, // Not completed
      },
      {
        taskName: 'Old Completed Schedule Task',
        dateStr: '17-11-2026',
        Task_Assign_dt: '2026-10-15',
        Schedule_Sch_Status: 3, // Completed on 2026-11-15
      },
    ];

    renderWithProviders(
      <TaskComparisonTable
        data={comparisonData}
        columns={columns}
        projectSchedules={[{ schId: 1 }]}
      />
    );

    expect(screen.getByText('Ongoing Schedule Task')).toBeInTheDocument();
    expect(screen.queryByText('Old Completed Schedule Task')).not.toBeInTheDocument();
  });
});
