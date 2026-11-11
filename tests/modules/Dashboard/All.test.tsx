import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import All from '../../../src/modules/Dashboard/All';
import { renderWithProviders } from '../../../src/test/test-utils';
import { useAuth } from '../../../src/auth/authContext';

// Mock the Dashboard All.api functions
vi.mock('../../../src/modules/Dashboard/All.api', () => ({
  getEnrichedWorkMaster: vi.fn().mockResolvedValue([]),
  getTaskDropdown: vi.fn().mockResolvedValue([]),
  getEmployeeDropdown: vi.fn().mockResolvedValue([]),
  getProjectDropdown: vi.fn().mockResolvedValue([]),
  getDashboardProjectSchedules: vi.fn().mockResolvedValue([]),
  getDashboardProjectEmpSchedules: vi.fn().mockResolvedValue([]),
  getDashboardProjectScheduleEmp: vi.fn().mockResolvedValue([]),
  getTaskTypeDropdown: vi.fn().mockResolvedValue([]),
  getDashboardTaskTypes: vi.fn().mockResolvedValue([]),
  clearDashboardCaches: vi.fn(),
}));

describe('Dashboard All Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hides the previous company listing behind one circle until the new data is ready', async () => {
    const api = await import('../../../src/modules/Dashboard/All.api');
    let finishProjects!: (value: any) => void;
    vi.mocked(api.getProjectDropdown)
      .mockResolvedValueOnce([{ Project_Id: 1, Project_Name: 'Previous company', IsActive: 1 } as any])
      .mockReturnValueOnce(new Promise(resolve => { finishProjects = resolve; }));

    function ChangeCompany() {
      const { updateUser } = useAuth();
      return <button onClick={() => updateUser({ Company_Id: 202, DB_Name: 'second_company' })}>Change company</button>;
    }

    renderWithProviders(<><ChangeCompany /><All /></>);
    const oldProject = await screen.findByText('Previous company');
    await waitFor(() => expect(oldProject).toBeVisible());
    fireEvent.click(screen.getByRole('button', { name: 'Change company' }));

    try {
      expect(oldProject).not.toBeVisible();
      expect(screen.queryByRole('progressbar', { name: 'Loading dashboard data' })).not.toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    } finally {
      await act(async () => {
        finishProjects([{ Project_Id: 2, Project_Name: 'Selected company', IsActive: 1 }]);
      });
    }

    await waitFor(() => expect(screen.getByText('Selected company')).toBeVisible());
    expect(screen.queryByText('Previous company')).not.toBeInTheDocument();
    expect(screen.queryByRole('progressbar', { name: 'Loading dashboard data' })).not.toBeInTheDocument();
  });

  it('keeps a single loader without starting requests before the company is ready', async () => {
    const api = await import('../../../src/modules/Dashboard/All.api');
    renderWithProviders(<All />, { user: null, company: null, token: null });

    await act(async () => {});

    expect(api.getProjectDropdown).not.toHaveBeenCalled();
    expect(api.getEnrichedWorkMaster).not.toHaveBeenCalled();
    expect(screen.queryByRole('progressbar', { name: 'Loading dashboard data' })).not.toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('renders dashboard with project overview and filters', async () => {
    renderWithProviders(<All />);

    // Check for Project Overview heading and table container
    await waitFor(() => {
      expect(screen.getByText('Project Overview')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /filter options/i })).toBeInTheDocument();
    });
  });

  it('shares task types with schedule enrichment during the initial load', async () => {
    const api = await import('../../../src/modules/Dashboard/All.api');
    renderWithProviders(<All />);

    await waitFor(() => expect(api.getDashboardProjectSchedules).toHaveBeenCalled());
    expect(api.getDashboardTaskTypes).toHaveBeenCalledTimes(1);
    const sharedTypes = vi.mocked(api.getDashboardTaskTypes).mock.results[0].value;
    expect(api.getDashboardProjectSchedules).toHaveBeenCalledWith(false, sharedTypes);
  });

  it('renders dashboard with project data properly', async () => {
    const { getProjectDropdown } = await import('../../../src/modules/Dashboard/All.api');
    vi.mocked(getProjectDropdown).mockResolvedValueOnce([
      {
        Project_Id: 101,
        Project_Name: 'Alpha Project',
        Project_Desc: 'Alpha description',
        IsActive: 1,
      } as any,
    ]);

    renderWithProviders(<All />);

    await waitFor(() => {
      expect(screen.getByText('Alpha Project')).toBeInTheDocument();
    });
  });

  it('displays projects while employee details and work history are still loading', async () => {
    const api = await import('../../../src/modules/Dashboard/All.api');
    let finishEmployees!: (value: any) => void;
    let finishWork!: (value: any) => void;
    vi.mocked(api.getEmployeeDropdown).mockReturnValueOnce(new Promise(resolve => {
      finishEmployees = resolve;
    }));
    vi.mocked(api.getEnrichedWorkMaster).mockReturnValueOnce(new Promise(resolve => {
      finishWork = resolve;
    }));
    vi.mocked(api.getProjectDropdown).mockResolvedValueOnce([
      { Project_Id: 102, Project_Name: 'Fast Project', IsActive: 1 } as any,
    ]);

    renderWithProviders(<All />);

    try {
      await act(async () => {});
      expect(screen.getByText('Fast Project')).toBeVisible();
      expect(screen.queryByRole('progressbar', { name: 'Loading dashboard data' })).not.toBeInTheDocument();
      expect(screen.getByRole('table')).toBeVisible();
      await act(async () => {
        finishEmployees([]);
      });
      expect(screen.queryByRole('progressbar', { name: 'Loading dashboard data' })).not.toBeInTheDocument();
      expect(screen.getByRole('table')).toBeVisible();
    } finally {
      await act(async () => {
        finishEmployees([]);
        finishWork({ success: true, data: [] });
      });
    }

    await waitFor(() => {
      expect(screen.queryAllByRole('progressbar').some(bar => !bar.hasAttribute('aria-valuenow'))).toBe(false);
    });
    expect(screen.getByText('Fast Project')).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeVisible();
  });

  it('displays projects before a slow schedule response and adds details when ready', async () => {
    const api = await import('../../../src/modules/Dashboard/All.api');
    let finishSchedules!: (value: any) => void;
    vi.mocked(api.getDashboardProjectSchedules).mockReturnValueOnce(new Promise(resolve => {
      finishSchedules = resolve;
    }));
    vi.mocked(api.getProjectDropdown).mockResolvedValueOnce([
      { Project_Id: 103, Project_Name: 'Immediate Project', IsActive: 1 } as any,
    ]);

    renderWithProviders(<All />);

    try {
      await act(async () => {});
      expect(screen.getByText('Immediate Project')).toBeVisible();
      expect(screen.queryByText('07/11/2026')).not.toBeInTheDocument();
    } finally {
      await act(async () => {
        finishSchedules({ data: [{
          Sch_Id: 1, Project_Id: 103, Task_Id: 1,
          Sch_End_Date: '2026-11-07', Sch_Status: 3,
        }] });
      });
    }

    expect(await screen.findByText('07/11/2026')).toBeInTheDocument();
    expect(screen.getByText('Immediate Project')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryAllByRole('progressbar').some(bar => !bar.hasAttribute('aria-valuenow'))).toBe(false);
    });
  });
});

