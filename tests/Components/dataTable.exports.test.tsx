import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DataTable, { exportToExcel, generatePDF } from '../../src/Components/dataTable';

const mocks = vi.hoisted(() => ({
  pdfLoaded: vi.fn(), excelLoaded: vi.fn(), pluginLoaded: vi.fn(),
  autoTable: vi.fn(), save: vi.fn(), writeFile: vi.fn(),
  jsonToSheet: vi.fn(() => ({ sheet: true })),
}));

vi.mock('jspdf', () => {
  mocks.pdfLoaded();
  return { default: class { autoTable = mocks.autoTable; save = mocks.save; } };
});
vi.mock('jspdf-autotable', () => ({ applyPlugin: mocks.pluginLoaded }));
vi.mock('xlsx', () => {
  mocks.excelLoaded();
  return {
    utils: { json_to_sheet: mocks.jsonToSheet, book_new: () => ({}), book_append_sheet: vi.fn() },
    writeFile: mocks.writeFile,
  };
});

describe('table export code loading', () => {
  const columns = [{ Field_Name: 'name', ColumnHeader: 'Name', Field_Data: 'string' as const, isVisible: 1 as const }];
  const data = [{ name: 'Project Alpha' }];

  it('renders listing data without loading export libraries', () => {
    render(<DataTable columns={columns} dataArray={data} />);
    expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    expect(mocks.pdfLoaded).not.toHaveBeenCalled();
    expect(mocks.excelLoaded).not.toHaveBeenCalled();
  });

  it('loads PDF code on demand and exports the existing rows', async () => {
    await generatePDF(data, columns);
    expect(mocks.pdfLoaded).toHaveBeenCalledOnce();
    expect(mocks.pluginLoaded).toHaveBeenCalledOnce();
    expect(mocks.autoTable).toHaveBeenCalledWith({ head: [['name']], body: [['Project Alpha']] });
    expect(mocks.save).toHaveBeenCalledWith('table.pdf');
  });

  it('loads Excel code on demand and exports the existing rows', async () => {
    await exportToExcel(data, columns);
    expect(mocks.excelLoaded).toHaveBeenCalledOnce();
    expect(mocks.jsonToSheet).toHaveBeenCalledWith(data);
    expect(mocks.writeFile).toHaveBeenCalledWith({}, 'table.xlsx');
  });
});
