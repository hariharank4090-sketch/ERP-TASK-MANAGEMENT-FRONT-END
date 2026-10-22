import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import TaskComparisonChart from '../../../../src/modules/Reports/comparisonReports/TaskComparisonChart';
import { renderWithProviders } from '../../../../src/test/test-utils';

describe('TaskComparisonChart Component', () => {
  it('renders task comparison chart with counts', () => {
    renderWithProviders(
      <TaskComparisonChart
        title="Sprint 1 Comparison"
        assignedCount={15}
        executedCount={12}
      />
    );

    expect(screen.getByText('Sprint 1 Comparison')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });
});
