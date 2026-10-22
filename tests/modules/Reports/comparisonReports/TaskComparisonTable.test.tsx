import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import TaskComparisonTable from '../../../../src/modules/Reports/comparisonReports/TaskComparisonTable';
import { renderWithProviders } from '../../../../src/test/test-utils';

vi.mock('../../../../src/modules/TodayPlan/todayplan.api', () => ({
  isScheduleCompletedForNextDate: vi.fn().mockReturnValue(false),
}));

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
});
