import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import CostBasedReports from '../../../../src/modules/Reports/costReports/CostReports';
import { renderWithProviders } from '../../../../src/test/test-utils';

vi.mock('../../../../src/modules/Reports/costReports/CostReports.api', () => ({
  fetchStaffBasedReport: vi.fn().mockResolvedValue([]),
  fetchCostCenterList: vi.fn().mockResolvedValue([]),
}));

describe('CostBasedReports Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders cost based reports view toggles', async () => {
    renderWithProviders(<CostBasedReports />);

    await waitFor(() => {
      expect(screen.getByText('ABSTRACT')).toBeInTheDocument();
      expect(screen.getByText('EXPANDED')).toBeInTheDocument();
    });
  });
});
