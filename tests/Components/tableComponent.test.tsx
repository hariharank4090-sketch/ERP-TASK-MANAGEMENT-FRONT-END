import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import AdvancedDataTable from '../../src/Components/tableComponent';
import { renderWithProviders } from '../../src/test/test-utils';

describe('AdvancedDataTable Component', () => {
  interface TestItem {
    id: number;
    title: string;
    score: number;
  }

  const columns = [
    { key: 'id' as const, label: 'Task ID' },
    { key: 'title' as const, label: 'Task Title' },
    { key: 'score' as const, label: 'Score' },
  ];

  const data: TestItem[] = [
    { id: 101, title: 'Code Review', score: 95 },
    { id: 102, title: 'Testing Suite', score: 88 },
  ];

  it('renders title and table data', () => {
    renderWithProviders(
      <AdvancedDataTable
        title="Quality Metrics"
        data={data}
        columns={columns}
      />
    );

    expect(screen.getByText('Quality Metrics')).toBeInTheDocument();
    expect(screen.getByText('Task ID')).toBeInTheDocument();
    expect(screen.getByText('Task Title')).toBeInTheDocument();
    expect(screen.getByText('Code Review')).toBeInTheDocument();
    expect(screen.getByText('Testing Suite')).toBeInTheDocument();
  });
});
