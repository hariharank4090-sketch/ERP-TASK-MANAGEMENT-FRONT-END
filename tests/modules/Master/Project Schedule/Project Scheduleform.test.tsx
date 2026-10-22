import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { ProjectScheduleDialog } from '../../../../src/modules/Master/Project Schedule/Project Scheduleform';
import { renderWithProviders } from '../../../../src/test/test-utils';

describe('ProjectScheduleDialog Component', () => {
  it('renders schedule dialog in create mode', () => {
    const onCloseMock = vi.fn();
    const onSubmitMock = vi.fn();

    renderWithProviders(
      <ProjectScheduleDialog
        open={true}
        onClose={onCloseMock}
        onSubmit={onSubmitMock}
        type="create"
        scheduleObj={{
          Sch_Type_Id: 1,
          Sch_No: 'SCH-001',
          Sch_Date: '2026-01-01',
          Entry_By: 1,
          Project_Id: 1,
          Task_Type_Id: 1,
          Task_Id: 1,
          Sch_Type: 1,
          Sch_Plan_Id: 1,
          Sch_Start_Date: '2026-01-01',
          Sch_End_Date: '2026-12-31',
          Sch_Est_Start_Time: '09:00',
          Sch_Est_End_Time: '17:00',
          Task_Sch_Duaration: 8,
          Task_Sch_Timer_Based: false,
          Sch_Status: 1,
        }}
      />
    );

    expect(screen.getByText(/create project schedule/i)).toBeInTheDocument();
  });
});
