import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import ProjectTaskComparison from '../../../../src/modules/Reports/comparisonReports/ProjectTaskComparison';
import { renderWithProviders } from '../../../../src/test/test-utils';

const mockAutoTable = vi.fn();
const mockSave = vi.fn();

vi.mock('jspdf', () => {
  return {
    default: class MockJsPDF {
      internal = { pageSize: { getWidth: () => 297, getHeight: () => 210 } };
      setFont = vi.fn();
      setFontSize = vi.fn();
      setTextColor = vi.fn();
      setFillColor = vi.fn();
      setDrawColor = vi.fn();
      text = vi.fn();
      roundedRect = vi.fn();
      rect = vi.fn();
      getTextWidth = vi.fn(() => 20);
      save = mockSave;
    },
  };
});

vi.mock('jspdf-autotable', () => ({
  default: (...args: any[]) => mockAutoTable(...args),
}));

const mockAssigned = [
  {
    Id: '1',
    Task_Assign_dt: new Date().toISOString().slice(0, 10),
    Task_Id: 101,
    Sch_Id: 201,
    Emp_Id: 1,
    Emp_Name: 'John Doe',
    Task_Name: 'Develop Feature X',
    Project_Name: 'Alpha Project',
    Sch_Time: '10:00:00',
    EN_Time: '11:00:00',
    Invovled_Stat: 2,
  },
];

const mockExecuted = [
  {
    Work_Id: 1,
    Work_Dt: new Date().toISOString().slice(0, 10),
    Task_Id: 101,
    Sch_Id: 201,
    Emp_Id: 1,
    Emp_Name: 'John Doe',
    Task_Name: 'Develop Feature X',
    Project_Name: 'Alpha Project',
    Start_Time: '10:00:00',
    End_Time: '11:00:00',
    Work_Status: 'Completed',
    Work_Done: 'Finished coding',
  },
];

vi.mock('../../../../src/modules/TodayPlan/todayplan.api', () => ({
  getEnrichedTodayPlan: vi.fn().mockImplementation(() => Promise.resolve(mockAssigned)),
  getEnrichedWorkMaster: vi.fn().mockImplementation(() => Promise.resolve(mockExecuted)),
  getEmployeeDropdown: vi.fn().mockResolvedValue([{ Emp_Id: 1, Emp_Name: 'John Doe' }]),
  getProjectScheduleMaster: vi.fn().mockResolvedValue([]),
  isScheduleCompletedForNextDate: vi.fn().mockReturnValue(false),
}));

vi.mock('../../../../src/Components/customFetch', () => ({
  fetchLink: vi.fn().mockResolvedValue({
    success: true,
    data: [],
  }),
}));

describe('ProjectTaskComparison Report Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders project task comparison report header and controls', async () => {
    renderWithProviders(<ProjectTaskComparison />);

    await waitFor(() => {
      expect(screen.getByText(/comparison/i)).toBeInTheDocument();
    });
  });

  it('downloads PDF in Day View with exact table headers and column styles', async () => {
    renderWithProviders(<ProjectTaskComparison />);

    await waitFor(() => {
      expect(screen.getByText('Develop Feature X')).toBeInTheDocument();
    });

    const pdfButton = screen.getAllByRole('button', { name: /pdf/i })[0];
    expect(pdfButton).not.toBeDisabled();

    fireEvent.click(pdfButton);

    expect(mockAutoTable).toHaveBeenCalled();
    const lastCall = mockAutoTable.mock.calls[mockAutoTable.mock.calls.length - 1];
    const autoTableOptions = lastCall[1];

    expect(autoTableOptions.head[0][0].content).toBe('Date');
    expect(autoTableOptions.head[0][1].content).toBe('Task Name');
    expect(autoTableOptions.head[0][3].content).toBe('Assigned Details');
    expect(autoTableOptions.head[0][3].colSpan).toBe(4);
    expect(autoTableOptions.head[0][4].content).toBe('Executed Details');
    expect(autoTableOptions.head[0][4].colSpan).toBe(5);
    expect(autoTableOptions.columnStyles[0].cellWidth).toBe(20);
    expect(autoTableOptions.columnStyles[1].cellWidth).toBe(38);
    expect(mockSave).toHaveBeenCalled();
  });

  it('downloads PDF in dialogue with the exact same table methods', async () => {
    renderWithProviders(<ProjectTaskComparison />);

    await waitFor(() => {
      expect(screen.getByText('Develop Feature X')).toBeInTheDocument();
    });

    // Switch view to Week or List or Calendar so group row is visible, or simulate opening modal
    const filterBtn = screen.getByLabelText('Filter Options');
    fireEvent.click(filterBtn);

    const viewSelect = screen.getByDisplayValue('Day');
    fireEvent.change(viewSelect, { target: { value: 'List' } });

    const applyBtn = screen.getByRole('button', { name: /apply|search/i });
    fireEvent.click(applyBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    const groupRow = await screen.findByText(/Click to View All/i);
    fireEvent.click(groupRow);

    await screen.findByText(/Tasks for/i);

    // Click the PDF button inside the dialogue
    const allPdfButtons = screen.getAllByRole('button', { name: /pdf/i });
    const modalPdfButton = allPdfButtons[allPdfButtons.length - 1];
    fireEvent.click(modalPdfButton);

    expect(mockAutoTable).toHaveBeenCalled();
    const lastCall = mockAutoTable.mock.calls[mockAutoTable.mock.calls.length - 1];
    const autoTableOptions = lastCall[1];

    expect(autoTableOptions.head[0][0].content).toBe('Date');
    expect(autoTableOptions.head[0][1].content).toBe('Task Name');
    expect(autoTableOptions.head[0][3].content).toBe('Assigned Details');
    expect(autoTableOptions.head[0][3].colSpan).toBe(4);
    expect(autoTableOptions.head[0][4].content).toBe('Executed Details');
    expect(autoTableOptions.head[0][4].colSpan).toBe(5);
    expect(autoTableOptions.columnStyles[0].cellWidth).toBe(20);
    expect(autoTableOptions.columnStyles[1].cellWidth).toBe(38);
    expect(mockSave).toHaveBeenCalled();
  });

  it('displays multiple executed entries for same assigned task under each other and calculates total and avg duration', async () => {
    const { getEnrichedTodayPlan, getEnrichedWorkMaster } = await import('../../../../src/modules/TodayPlan/todayplan.api');
    
    const todayStr = new Date().toISOString().slice(0, 10);
    vi.mocked(getEnrichedTodayPlan).mockResolvedValueOnce({
      success: true,
      message: 'OK',
      data: [
        {
          Id: '1',
          Task_Assign_dt: todayStr,
          Task_Id: 101,
          Sch_Id: 201,
          Emp_Id: 1,
          Emp_Name: 'John Doe',
          Task_Name: 'Develop Feature X',
          Project_Name: 'Alpha Project',
          Sch_Time: '10:00:00',
          EN_Time: '18:00:00',
          Invovled_Stat: 2,
        },
      ],
    } as any);

    vi.mocked(getEnrichedWorkMaster).mockResolvedValueOnce({
      success: true,
      message: 'OK',
      data: [
        {
          Work_Id: 1,
          Work_Dt: todayStr,
          Task_Id: 101,
          Sch_Id: 201,
          Emp_Id: 1,
          Emp_Name: 'John Doe',
          Task_Name: 'Develop Feature X',
          Project_Name: 'Alpha Project',
          Start_Time: '10:00:00',
          End_Time: '12:00:00',
          Work_Status: 'In Progress',
          Work_Done: 'Execution Part 1',
        },
        {
          Work_Id: 2,
          Work_Dt: todayStr,
          Task_Id: 101,
          Sch_Id: 201,
          Emp_Id: 1,
          Emp_Name: 'John Doe',
          Task_Name: 'Develop Feature X',
          Project_Name: 'Alpha Project',
          Start_Time: '13:00:00',
          End_Time: '15:04:00',
          Work_Status: 'Completed',
          Work_Done: 'Execution Part 2',
        },
      ],
    } as any);

    renderWithProviders(<ProjectTaskComparison />);

    await waitFor(() => {
      expect(screen.getByText('Execution Part 1')).toBeInTheDocument();
      expect(screen.getByText('Execution Part 2')).toBeInTheDocument();
    });

    // Verify filter by employee to see duration chips/cards
    const filterBtn = screen.getByLabelText('Filter Options');
    fireEvent.click(filterBtn);

    const empSelect = screen.getByText('All Employees');
    fireEvent.mouseDown(empSelect);

    const empOption = await screen.findByRole('option', { name: 'John Doe' });
    fireEvent.click(empOption);

    const applyBtn = screen.getByRole('button', { name: /apply|search/i });
    fireEvent.click(applyBtn);

    await waitFor(() => {
      expect(screen.getAllByText(/4h 4m/i).length).toBeGreaterThan(0);
    });
  });

  it('merges overlapping assigned task intervals (e.g. 9 am to 7 pm and 5 pm to 7 pm) into 10h total and 10h avg duration', async () => {
    const { getEnrichedTodayPlan, getEnrichedWorkMaster } = await import('../../../../src/modules/TodayPlan/todayplan.api');
    
    const todayStr = new Date().toISOString().slice(0, 10);
    vi.mocked(getEnrichedTodayPlan).mockResolvedValueOnce({
      success: true,
      message: 'OK',
      data: [
        {
          Id: '1',
          Task_Assign_dt: todayStr,
          Task_Id: 101,
          Sch_Id: 201,
          Emp_Id: 1,
          Emp_Name: 'John Doe',
          Task_Name: 'Task One',
          Project_Name: 'Alpha Project',
          Sch_Time: '09:00:00',
          EN_Time: '19:00:00',
          Invovled_Stat: 2,
        },
        {
          Id: '2',
          Task_Assign_dt: todayStr,
          Task_Id: 102,
          Sch_Id: 202,
          Emp_Id: 1,
          Emp_Name: 'John Doe',
          Task_Name: 'Task Two',
          Project_Name: 'Alpha Project',
          Sch_Time: '17:00:00',
          EN_Time: '19:00:00',
          Invovled_Stat: 2,
        },
      ],
    } as any);

    vi.mocked(getEnrichedWorkMaster).mockResolvedValueOnce({
      success: true,
      message: 'OK',
      data: [
        {
          Work_Id: 1,
          Work_Dt: todayStr,
          Task_Id: 101,
          Sch_Id: 201,
          Emp_Id: 1,
          Emp_Name: 'John Doe',
          Task_Name: 'Task One',
          Project_Name: 'Alpha Project',
          Start_Time: '09:00:00',
          End_Time: '19:00:00',
          Work_Status: 'Completed',
          Work_Done: 'Execution One',
        },
        {
          Work_Id: 2,
          Work_Dt: todayStr,
          Task_Id: 102,
          Sch_Id: 202,
          Emp_Id: 1,
          Emp_Name: 'John Doe',
          Task_Name: 'Task Two',
          Project_Name: 'Alpha Project',
          Start_Time: '17:00:00',
          End_Time: '19:00:00',
          Work_Status: 'Completed',
          Work_Done: 'Execution Two',
        },
      ],
    } as any);

    renderWithProviders(<ProjectTaskComparison />);

    await waitFor(() => {
      expect(screen.getByText('Task One')).toBeInTheDocument();
      expect(screen.getByText('Task Two')).toBeInTheDocument();
    });

    // Verify chips are removed from top header
    expect(screen.queryByText(/Assigned Records: 2/i)).not.toBeInTheDocument();

    // Verify stats in summary cards
    expect(screen.getByText('Assigned Records')).toBeInTheDocument();
    expect(screen.getByText('Assigned Duration')).toBeInTheDocument();
    expect(screen.getByText('Assigned Avg Duration/Day')).toBeInTheDocument();
    expect(screen.getByText('Executed Records')).toBeInTheDocument();
    expect(screen.getByText('Executed Duration')).toBeInTheDocument();
    expect(screen.getByText('Executed Avg Duration/Day')).toBeInTheDocument();

    // Check that duration shows 10h (not 12h)
    const durationElements = screen.getAllByText('10h');
    expect(durationElements.length).toBeGreaterThanOrEqual(4);
  });

  it('displays uncompleted schedule assigned task date-wise on viewed date even without executed entry and hides completed schedule on next dates', async () => {
    const { getEnrichedTodayPlan, getEnrichedWorkMaster, isScheduleCompletedForNextDate } = await import('../../../../src/modules/TodayPlan/todayplan.api');
    
    // Simulate isScheduleCompletedForNextDate real logic for this test
    vi.mocked(isScheduleCompletedForNextDate).mockImplementation((plan: any, schedules: any[], targetDate?: any) => {
      const schId = String(plan.Sch_Id || '');
      const sched = schedules.find((s: any) => String(s.schId) === schId);
      const isCompleted = sched ? Number(sched.schStatus) === 3 : Number(plan.Schedule_Sch_Status) === 3;
      if (!isCompleted) return false;
      const compDate = sched?.schCompDate || plan.Schedule_Sch_Comp_Date || '2026-11-15';
      const checkDt = targetDate ? String(targetDate).slice(0, 10) : '';
      return checkDt > compDate;
    });

    vi.mocked(getEnrichedTodayPlan).mockResolvedValueOnce({
      success: true,
      message: 'OK',
      data: [
        {
          Id: 'uncompleted-1',
          Task_Assign_dt: '2026-10-15', // assigned on earlier date
          Task_Id: 201,
          Sch_Id: 301,
          Emp_Id: 1,
          Emp_Name: 'John Doe',
          Task_Name: 'Uncompleted Rolling Task',
          Project_Name: 'Alpha Project',
          Sch_Time: '09:00:00',
          EN_Time: '18:00:00',
          Invovled_Stat: 0,
          Schedule_Sch_Status: 1, // In Progress (not completed)
        },
        {
          Id: 'completed-1',
          Task_Assign_dt: '2026-10-15',
          Task_Id: 202,
          Sch_Id: 302,
          Emp_Id: 1,
          Emp_Name: 'John Doe',
          Task_Name: 'Completed Old Task',
          Project_Name: 'Alpha Project',
          Sch_Time: '09:00:00',
          EN_Time: '18:00:00',
          Invovled_Stat: 3,
          Schedule_Sch_Status: 3, // Completed
          Schedule_Sch_Comp_Date: '2026-11-15', // completed before today
        },
      ],
    } as any);

    // No executed work for uncompleted task
    vi.mocked(getEnrichedWorkMaster).mockResolvedValueOnce({
      success: true,
      message: 'OK',
      data: [],
    } as any);

    renderWithProviders(<ProjectTaskComparison />);

    // Uncompleted rolling task should display date-wise with its assigned details
    await waitFor(() => {
      expect(screen.getByText('Uncompleted Rolling Task')).toBeInTheDocument();
    });

    // Completed task whose completion date has passed should NOT be displayed
    expect(screen.queryByText('Completed Old Task')).not.toBeInTheDocument();
  });
});
