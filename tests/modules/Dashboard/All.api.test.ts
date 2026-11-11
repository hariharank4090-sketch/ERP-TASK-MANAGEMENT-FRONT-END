import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchLink } from '../../../src/Components/customFetch';
import {
  clearDashboardCaches,
  getDashboardProjectSchedules,
  getDashboardTaskTypes,
  getProjectDropdown,
  getTaskDropdown,
  getEmployeeDropdown,
  getDashboardProjectScheduleEmp,
  getEnrichedWorkMaster,
  prefetchDashboardData,
} from '../../../src/modules/Dashboard/All.api';

vi.mock('../../../src/Components/customFetch', () => ({ fetchLink: vi.fn() }));

describe('dashboard schedule request reuse', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearDashboardCaches();
  });

  it('does not let a late response from the previous company overwrite current projects', async () => {
    let finishOldCompany!: (value: any) => void;
    vi.mocked(fetchLink)
      .mockImplementationOnce(() => new Promise(resolve => { finishOldCompany = resolve; }))
      .mockResolvedValueOnce({
        success: true,
        data: [{ Project_Id: 2, Project_Name: 'Current company project' }],
      } as any);

    const oldRequest = getProjectDropdown();
    clearDashboardCaches();
    await getProjectDropdown();
    finishOldCompany({ success: true, data: [{ Project_Id: 1, Project_Name: 'Previous company project' }] });
    await oldRequest;

    const projects = await getProjectDropdown();
    expect(projects[0].Project_Name).toBe('Current company project');
    expect(fetchLink).toHaveBeenCalledTimes(2);
  });

  it('reuses login prefetch requests when the dashboard opens', async () => {
    let finishRequests!: () => void;
    const pending = new Promise<void>(resolve => { finishRequests = resolve; });
    vi.mocked(fetchLink).mockImplementation(async () => {
      await pending;
      return { success: true, data: [] } as any;
    });

    const preload = prefetchDashboardData();
    const types = getDashboardTaskTypes();
    const pageLoad = Promise.all([
      getProjectDropdown(), getTaskDropdown(), getEmployeeDropdown(),
      getDashboardProjectSchedules(false, types),
      getDashboardProjectScheduleEmp(), getEnrichedWorkMaster(), types,
    ]);

    // Seven endpoints, each requested once even while prefetch is pending.
    expect(fetchLink).toHaveBeenCalledTimes(7);
    finishRequests();
    await Promise.all([preload, pageLoad]);
    expect(fetchLink).toHaveBeenCalledTimes(7);
  });

  it('uses the shared task types without requesting the task-type dropdown', async () => {
    vi.mocked(fetchLink).mockImplementation(async ({ address }) => ({
      success: true,
      data: address === 'masters/taskType/'
        ? [{ Task_Type_Id: 7, Task_Type: 'Inspection' }]
        : [{ Sch_Id: 12, Task_Type_Id: 7 }],
    }) as any);

    const types = getDashboardTaskTypes();
    const [schedules] = await Promise.all([
      getDashboardProjectSchedules(false, types),
      types,
    ]);

    expect(fetchLink).toHaveBeenCalledTimes(2);
    expect(fetchLink).not.toHaveBeenCalledWith(expect.objectContaining({
      address: 'masters/taskType/dropdown/',
    }));
    expect(schedules.data[0].taskType).toBe('Inspection');

    await getDashboardProjectSchedules(false, types);
    expect(fetchLink).toHaveBeenCalledTimes(2);
  });

  it('uses refreshed task-type names when refreshing schedules', async () => {
    vi.mocked(fetchLink).mockResolvedValue({
      success: true, data: [{ Sch_Id: 12, Task_Type_Id: 7 }],
    } as any);

    const original = await getDashboardProjectSchedules(false, Promise.resolve([
      { Task_Type_Id: 7, Task_Type: 'Original' } as any,
    ]));
    const refreshed = await getDashboardProjectSchedules(true, Promise.resolve([
      { Task_Type_Id: 7, Task_Type: 'Updated' } as any,
    ]));

    expect(original.data[0].taskType).toBe('Original');
    expect(refreshed.data[0].taskType).toBe('Updated');
    expect(fetchLink).toHaveBeenCalledTimes(2);
  });
});
