import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import DataTable, { type Column } from '../../src/Components/dataTable';
import { renderWithProviders } from '../../src/test/test-utils';

describe('DataTable Component', () => {
  const columns: Column[] = [
    { Field_Name: 'id', ColumnHeader: 'ID', isVisible: 1, Field_Data: 'number' },
    { Field_Name: 'name', ColumnHeader: 'Name', isVisible: 1, Field_Data: 'string' },
    { Field_Name: 'status', ColumnHeader: 'Status', isVisible: 1, Field_Data: 'string' },
  ];

  const data = [
    { id: 1, name: 'Alpha Project', status: 'Active' },
    { id: 2, name: 'Beta Project', status: 'Pending' },
  ];

  it('renders table headers and data rows correctly', () => {
    renderWithProviders(
      <DataTable
        columns={columns}
        dataArray={data}
      />
    );

    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Alpha Project')).toBeInTheDocument();
    expect(screen.getByText('Beta Project')).toBeInTheDocument();
  });

  it('renders action buttons if showCreateButton prop is true', () => {
    const onCreateMock = vi.fn();
    renderWithProviders(
      <DataTable
        columns={columns}
        dataArray={data}
        showCreateButton={true}
        createButtonLabel="Create New"
        onCreateClick={onCreateMock}
      />
    );

    expect(screen.getByRole('button', { name: /create new/i })).toBeInTheDocument();
  });
});
