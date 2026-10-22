import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import TodayTaskDialog from '../../../src/modules/workMaster/TodayTaskDialog';
import { renderWithProviders } from '../../../src/test/test-utils';

vi.mock('../../../src/Components/customFetch', () => ({
  fetchLink: vi.fn().mockResolvedValue({
    success: true,
    data: [],
  }),
}));

describe('TodayTaskDialog Component', () => {
  it('renders dialog when open is true', () => {
    const onCloseMock = vi.fn();
    renderWithProviders(
      <TodayTaskDialog
        open={true}
        onClose={onCloseMock}
        selectedPlan={{
          Task_Name: 'Database Backup',
          Project_Name: 'ERP System',
        }}
      />
    );

    expect(screen.getByText('Work Timer')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Database Backup')).toBeInTheDocument();
  });
});
