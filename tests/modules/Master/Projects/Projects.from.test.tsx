import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { ProjectDialog } from '../../../../src/modules/Master/Projects/Projects.from';
import { renderWithProviders } from '../../../../src/test/test-utils';

describe('ProjectDialog Component', () => {
  it('renders project form inputs in create mode', () => {
    const onCloseMock = vi.fn();
    const onSubmitMock = vi.fn();

    renderWithProviders(
      <ProjectDialog
        open={true}
        onClose={onCloseMock}
        onSubmit={onSubmitMock}
        type="create"
        projectObj={{
          Project_Name: 'Phoenix Project',
          Project_Desc: 'New rewrite',
          Project_Head: 1,
          Company_Id: 101,
          Est_Start_Dt: '2026-01-01',
          Est_End_Dt: '2026-12-31',
          Project_Status: 1,
          IsActive: 1,
        }}
      />
    );

    expect(screen.getByDisplayValue('Phoenix Project')).toBeInTheDocument();
  });
});
