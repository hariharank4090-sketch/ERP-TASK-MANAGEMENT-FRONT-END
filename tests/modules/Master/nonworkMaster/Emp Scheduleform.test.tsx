import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import EmpScheduleForm from '../../../../src/modules/Master/nonworkMaster/Emp Scheduleform';
import { renderWithProviders } from '../../../../src/test/test-utils';

vi.mock('../../../../src/Components/customFetch', () => ({
  fetchLink: vi.fn().mockResolvedValue({
    success: true,
    data: [],
  }),
}));

describe('EmpScheduleForm (TodayTaskDialog re-export) Component', () => {
  it('renders re-exported dialog component', () => {
    renderWithProviders(
      <EmpScheduleForm
        open={true}
        onClose={vi.fn()}
        selectedPlan={{
          Task_Name: 'Database Tuning',
          Project_Name: 'Core Platform',
        }}
      />
    );

    expect(screen.getByText('Work Timer')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Database Tuning')).toBeInTheDocument();
  });
});
