/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, fireEvent, within } from "@testing-library/react";
import MyList from "../../../src/modules/mytask/My List/MyList";
import {
  formatDate,
  hasWorkRecord,
  getTaskCounts,
  type TaskRecord,
} from "../../../src/modules/mytask/My List/MyListUtils";
import { renderWithProviders, mockUser, mockCompany } from "../../../src/test/test-utils";
import {
  getEnrichedTodayPlan,
  getEnrichedWorkMaster,
  getEmployeeDropdown,
} from "../../../src/modules/TodayPlan/todayplan.api";
import { getTask } from "../../../src/modules/Master/Task/Task.api";
import { fetchLink } from "../../../src/Components/customFetch";

const mockAutoTable = vi.fn();
const mockSave = vi.fn();
const mockSetPage = vi.fn();
const mockText = vi.fn();

vi.mock("jspdf", () => {
  return {
    default: class MockJsPDF {
      internal = {
        pageSize: { getWidth: () => 297, getHeight: () => 210 },
        getNumberOfPages: () => 2,
      };
      setFont = vi.fn();
      setFontSize = vi.fn();
      setTextColor = vi.fn();
      text = mockText;
      setPage = mockSetPage;
      getNumberOfPages = () => 2;
      save = mockSave;
    },
  };
});

vi.mock("jspdf-autotable", () => ({
  default: (...args: any[]) => mockAutoTable(...args),
}));

const mockEmployees = [
  { Emp_Id: 1, Emp_Name: "HARIHARAN" },
  { Emp_Id: 2, Emp_Name: "ARUN PANDI" },
];

const mockAssigned = [
  {
    Id: "1",
    Task_Assign_dt: "2026-11-18",
    Task_Id: 101,
    Sch_Id: 201,
    Emp_Id: 1,
    Emp_Name: "HARIHARAN",
    Task_Name: "TESTING",
    Sch_Time: "09:30:00",
    EN_Time: "13:30:00",
    Invovled_Stat: 1,
  },
  {
    Id: "2",
    Task_Assign_dt: "2026-11-17",
    Task_Id: 101,
    Sch_Id: 201,
    Emp_Id: 1,
    Emp_Name: "HARIHARAN",
    Task_Name: "TESTING",
    Sch_Time: "09:30:00",
    EN_Time: "13:30:00",
    Invovled_Stat: 3,
  },
  {
    Id: "3",
    Task_Assign_dt: "2026-11-18",
    Task_Id: 101,
    Sch_Id: 201,
    Emp_Id: 2,
    Emp_Name: "ARUN PANDI",
    Task_Name: "TESTING",
    Sch_Time: "09:30:00",
    EN_Time: "13:30:00",
    Invovled_Stat: 2,
  },
  {
    Id: "4",
    Task_Assign_dt: "2026-11-18",
    Task_Id: 102,
    Sch_Id: 202,
    Emp_Id: 2,
    Emp_Name: "ARUN PANDI",
    Task_Name: "EMPLOYEE ATTENDANCE",
    Sch_Time: "09:00:00",
    EN_Time: "17:00:00",
    Invovled_Stat: 2,
  },
];

const mockExecuted = [
  {
    Work_Id: 10,
    Work_Dt: "2026-11-17",
    Task_Id: 101,
    Sch_Id: 201,
    Emp_Id: 1,
    Emp_Name: "HARIHARAN",
    Task_Name: "TESTING",
    Start_Time: "09:30:00",
    End_Time: "13:00:00",
    Work_Status: "Completed",
    Work_Done: "Completed testing",
  },
];

vi.mock("../../../src/modules/TodayPlan/todayplan.api", () => ({
  getEnrichedTodayPlan: vi.fn(),
  getEnrichedWorkMaster: vi.fn(),
  getEmployeeDropdown: vi.fn(),
  getProjectScheduleMaster: vi.fn().mockResolvedValue([]),
  isScheduleCompletedForNextDate: vi.fn().mockReturnValue(false),
}));

vi.mock("../../../src/modules/Master/Projects/Projects.api", () => ({
  getProjectMaster: vi.fn().mockResolvedValue([
    { Project_Id: 1, Project_Name: "Alpha Project", Project_Status: 1 },
  ]),
}));

const mockMasterTasks = [
  { Task_Id: 101, Task_Name: "TESTING FROM MASTER", Project_Id: 1, Project_Name: "Alpha Project" },
  { Task_Id: 102, Task_Name: "EMPLOYEE ATTENDANCE", Project_Id: 1, Project_Name: "Alpha Project" },
];

vi.mock("../../../src/modules/Master/Task/Task.api", () => ({
  getTask: vi.fn(),
}));

vi.mock("../../../src/Components/customFetch", () => ({
  fetchLink: vi.fn().mockResolvedValue({ success: true, data: null }),
}));

describe("MyListUtils", () => {
  it("formats YYYY-MM-DD dates to DD-MM-YYYY", () => {
    expect(formatDate("2026-11-18")).toBe("18-11-2026");
    expect(formatDate("-")).toBe("-");
    expect(formatDate(null)).toBe("-");
  });

  it("detects work records accurately with hasWorkRecord", () => {
    expect(
      hasWorkRecord({
        executedStart: "-",
        executedEnd: "-",
        executedDuration: "-",
        executedStatus: "-",
        workDetails: "-",
      })
    ).toBe(false);

    expect(
      hasWorkRecord({
        executedStart: "9:30 AM",
        executedEnd: "-",
        executedDuration: "-",
        executedStatus: "-",
        workDetails: "-",
      })
    ).toBe(true);
  });

  it("uses overallTaskSummary when provided and falls back to allTasks calculation otherwise", () => {
    const sampleTasks: TaskRecord[] = [
      {
        date: "2026-11-18",
        task: "TESTING",
        employee: "HARIHARAN",
        assignedStart: "9:30 AM",
        assignedEnd: "1:30 PM",
        assignedDuration: "4h",
        assignedStatus: "New",
        executedStart: "-",
        executedEnd: "-",
        executedDuration: "-",
        executedStatus: "-",
        workDetails: "-",
      },
      {
        date: "2026-11-17",
        task: "TESTING",
        employee: "HARIHARAN",
        assignedStart: "9:30 AM",
        assignedEnd: "1:30 PM",
        assignedDuration: "4h",
        assignedStatus: "Completed",
        executedStart: "9:30 AM",
        executedEnd: "1:00 PM",
        executedDuration: "3h 30m",
        executedStatus: "Completed",
        workDetails: "Done",
      },
    ];

    expect(
      getTaskCounts({ employee: "HARIHARAN", task: "TESTING" }, sampleTasks, [
        {
          employee: "HARIHARAN",
          task: "TESTING",
          totalAssignedDates: 325,
          totalWorkingDays: 225,
        },
      ])
    ).toEqual({ totalAssignedDates: 325, totalWorkingDays: 225 });

    expect(
      getTaskCounts({ employee: "HARIHARAN", task: "TESTING" }, sampleTasks)
    ).toEqual({ totalAssignedDates: 2, totalWorkingDays: 1 });
  });
});

const unmappedAdminUser = {
  ...mockUser,
  Local_User_ID: 999,
  Global_User_ID: 999,
  id: 999,
};

const unmappedAdminCompany = {
  ...mockCompany,
  Local_User_ID: 999,
  Global_User_ID: 999,
};

describe("MyList Page (Employee Daily Task Details)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getEnrichedTodayPlan).mockResolvedValue(mockAssigned as any);
    vi.mocked(getEnrichedWorkMaster).mockResolvedValue(mockExecuted as any);
    vi.mocked(getEmployeeDropdown).mockResolvedValue(mockEmployees as any);
    vi.mocked(getTask).mockResolvedValue(mockMasterTasks as any);
    vi.mocked(fetchLink).mockResolvedValue({ success: true, data: null } as any);
  });

  it("does not list other employees data when admin has no matching employee data, and lists selected employees when filtered", async () => {
    renderWithProviders(<MyList />, {
      user: unmappedAdminUser,
      company: unmappedAdminCompany,
    });

    expect(screen.getByText("Employee Daily Task Details")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Filter Options" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset Filters" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export Excel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export PDF" })).toBeInTheDocument();

    const chipsContainer = document.getElementById("activeFilterChips")!;
    expect(within(chipsContainer).getByText("All Tasks")).toBeInTheDocument();

    // Admin with no matching employee record must NOT see other employees' data initially
    await waitFor(() => {
      expect(
        screen.getByText("No task records found for the selected filters.")
      ).toBeInTheDocument();
    });

    // Admin selects HARIHARAN (single-select) -> Task Name dropdown shows only HARIHARAN's tasks
    fireEvent.click(screen.getByRole("button", { name: "Filter Options" }));
    fireEvent.mouseDown(screen.getByLabelText("Employee Name"));
    fireEvent.click(await screen.findByRole("option", { name: "HARIHARAN" }));

    fireEvent.mouseDown(screen.getByLabelText("Task Name"));
    expect(await screen.findByRole("option", { name: "TESTING FROM MASTER" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "EMPLOYEE ATTENDANCE" })).not.toBeInTheDocument();
    fireEvent.keyDown(document.activeElement || document.body, { key: "Escape" });

    fireEvent.click(screen.getByRole("button", { name: "SEARCH" }));

    const table = screen.getByTestId("data-table");
    const tbody = table.querySelector("tbody")!;
    await waitFor(
      () => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(within(tbody).getByText("TESTING FROM MASTER")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    expect(within(table).getByText("Project")).toBeInTheDocument();
    expect(within(table).getByText("Task Name")).toBeInTheDocument();
    expect(within(table).getByText("Employee")).toBeInTheDocument();
    expect(within(table).getByText("Start Time")).toBeInTheDocument();
    expect(within(table).getByText("End Time")).toBeInTheDocument();
    expect(within(table).getByText("Duration")).toBeInTheDocument();
    expect(within(table).getByText("Total Assigned Dates")).toBeInTheDocument();
    expect(within(table).getByText("Total Working Days")).toBeInTheDocument();

    const rows = within(tbody).getAllByRole("row");
    expect(rows.length).toBe(1);

    const testingRowCells = within(rows[0]).getAllByRole("cell");
    expect(testingRowCells[0]).toHaveTextContent("Alpha Project");
    expect(testingRowCells[1]).toHaveTextContent("TESTING FROM MASTER");
    expect(testingRowCells[2]).toHaveTextContent("HARIHARAN");
    expect(testingRowCells[3]).toHaveTextContent("9:30 AM");
    expect(testingRowCells[4]).toHaveTextContent("1:30 PM");
    expect(testingRowCells[5]).toHaveTextContent("4h");
    expect(testingRowCells[6]).toHaveTextContent("2");
    expect(testingRowCells[7]).toHaveTextContent("1");
  });

  it("filters to individual employee details (non-cumulative) when admin selects an employee, and resets", async () => {
    vi.mocked(fetchLink).mockResolvedValue({
      success: true,
      data: { Emp_Id: 1 },
    } as any);

    renderWithProviders(<MyList />, {
      user: unmappedAdminUser,
      company: unmappedAdminCompany,
    });

    const table = screen.getByTestId("data-table");
    const tbody = table.querySelector("tbody")!;
    await waitFor(
      () => {
        expect(within(tbody).getByText("TESTING FROM MASTER")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    fireEvent.click(screen.getByRole("button", { name: "Filter Options" }));

    const empSelect = screen.getByLabelText("Employee Name");
    fireEvent.mouseDown(empSelect);

    const arunOption = await screen.findByRole("option", { name: "ARUN PANDI" });
    fireEvent.click(arunOption);

    fireEvent.click(screen.getByRole("button", { name: "SEARCH" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(within(tbody).getByText("EMPLOYEE ATTENDANCE")).toBeInTheDocument();
    });
    const filteredRows = within(tbody).getAllByRole("row");
    expect(filteredRows.length).toBe(2);

    // TESTING FROM MASTER should show ONLY ARUN PANDI's details (non-cumulative: 1 assigned date, 0 working days)
    const testingCells = within(filteredRows[0]).getAllByRole("cell");
    expect(testingCells[1]).toHaveTextContent("TESTING FROM MASTER");
    expect(testingCells[2]).toHaveTextContent("ARUN PANDI");
    expect(testingCells[2]).not.toHaveTextContent("HARIHARAN");
    expect(testingCells[6]).toHaveTextContent("1");
    expect(testingCells[7]).toHaveTextContent("0");

    const chipsContainer = document.getElementById("activeFilterChips")!;
    expect(chipsContainer).toHaveTextContent("Employee: ARUN PANDI");

    // Reset filters returns to logged-in admin's own employee tasks
    fireEvent.click(screen.getByRole("button", { name: "Reset Filters" }));

    await waitFor(() => {
      const resetRows = within(tbody).getAllByRole("row");
      expect(resetRows.length).toBe(1);
      expect(within(resetRows[0]).getAllByRole("cell")[2]).toHaveTextContent("HARIHARAN");
    });
    expect(chipsContainer).toHaveTextContent("All Tasks");
  });

  it("lists only the logged-in employee's details initially for non-admin login", async () => {
    renderWithProviders(<MyList />, {
      user: {
        ...mockUser,
        UserTypeId: 2,
        userType: 2,
        Local_User_ID: 1,
        Name: "HARIHARAN",
        name: "HARIHARAN",
      },
      company: {
        ...mockCompany,
        UserTypeId: 2,
        Local_User_ID: 1,
      },
    });

    const table = screen.getByTestId("data-table");
    const tbody = table.querySelector("tbody")!;

    await waitFor(() => {
      expect(within(tbody).getByText("TESTING FROM MASTER")).toBeInTheDocument();
    });

    // EMPLOYEE ATTENDANCE is only assigned to ARUN PANDI, so it must not appear
    expect(within(tbody).queryByText("EMPLOYEE ATTENDANCE")).not.toBeInTheDocument();

    const rows = within(tbody).getAllByRole("row");
    expect(rows.length).toBe(1);
    const cells = within(rows[0]).getAllByRole("cell");
    expect(cells[1]).toHaveTextContent("TESTING FROM MASTER");
    expect(cells[2]).toHaveTextContent("HARIHARAN");
    expect(cells[2]).not.toHaveTextContent("ARUN PANDI");
    expect(cells[6]).toHaveTextContent("2");
    expect(cells[7]).toHaveTextContent("1");

    const chipsContainer = document.getElementById("activeFilterChips")!;
    expect(chipsContainer).toHaveTextContent("Employee: HARIHARAN");
  });

  it("matches non-admin employee by User_Mgt_Id / Emp_Id even when user.Name differs from Emp_Name", async () => {
    vi.mocked(getEmployeeDropdown).mockResolvedValue([
      { Emp_Id: 1, Emp_Name: "HARIHARAN", User_Mgt_Id: 10 },
      { Emp_Id: 2, Emp_Name: "ARUN PANDI", User_Mgt_Id: 99 },
    ] as any);

    renderWithProviders(<MyList />, {
      user: {
        ...mockUser,
        UserTypeId: 2,
        userType: 2,
        Local_User_ID: 99,
        Name: "Arun Login Display Name",
        name: "Arun Login Display Name",
      },
      company: {
        ...mockCompany,
        UserTypeId: 2,
        Local_User_ID: 99,
      },
    });

    const table = screen.getByTestId("data-table");
    const tbody = table.querySelector("tbody")!;

    await waitFor(
      () => {
        expect(within(tbody).getByText("EMPLOYEE ATTENDANCE")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    const rows = within(tbody).getAllByRole("row");
    expect(rows.length).toBe(2);
    expect(within(rows[0]).getAllByRole("cell")[2]).toHaveTextContent("ARUN PANDI");
    expect(within(rows[0]).getAllByRole("cell")[2]).not.toHaveTextContent("HARIHARAN");
    expect(within(rows[0]).getAllByRole("cell")[6]).toHaveTextContent("1");
    expect(within(rows[0]).getAllByRole("cell")[7]).toHaveTextContent("0");
  });

  it("shows admin-related tasks initially via getEmpId mapping without listing other employees, and switches to selected employee on filter", async () => {
    vi.mocked(getEmployeeDropdown).mockResolvedValue([
      { Emp_Id: 1, Emp_Name: "HARIHARAN" },
      { Emp_Id: 2, Emp_Name: "ARUN PANDI" },
    ] as any);
    vi.mocked(fetchLink).mockResolvedValue({
      success: true,
      data: { Emp_Id: 1 },
    } as any);

    renderWithProviders(<MyList />, {
      user: {
        ...mockUser,
        UserTypeId: 1,
        userType: 1,
        Local_User_ID: 50,
        Name: "Admin User",
        name: "Admin User",
      },
      company: {
        ...mockCompany,
        UserTypeId: 1,
        Local_User_ID: 50,
      },
    });

    const table = screen.getByTestId("data-table");
    const tbody = table.querySelector("tbody")!;

    await waitFor(() => {
      expect(within(tbody).getByText("TESTING FROM MASTER")).toBeInTheDocument();
    });

    // Initially admin sees only admin-related task (HARIHARAN), not ARUN PANDI's EMPLOYEE ATTENDANCE
    expect(within(tbody).queryByText("EMPLOYEE ATTENDANCE")).not.toBeInTheDocument();
    let rows = within(tbody).getAllByRole("row");
    expect(rows.length).toBe(1);
    expect(within(rows[0]).getAllByRole("cell")[2]).toHaveTextContent("HARIHARAN");
    expect(within(rows[0]).getAllByRole("cell")[2]).not.toHaveTextContent("ARUN PANDI");

    // Admin selects ARUN PANDI in filter dialog -> shows ARUN PANDI's related tasks
    fireEvent.click(screen.getByRole("button", { name: "Filter Options" }));
    fireEvent.mouseDown(screen.getByLabelText("Employee Name"));
    const arunOption = await screen.findByRole("option", { name: "ARUN PANDI" });
    fireEvent.click(arunOption);
    fireEvent.click(screen.getByRole("button", { name: "SEARCH" }));

    await waitFor(
      () => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(within(tbody).getByText("EMPLOYEE ATTENDANCE")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    rows = within(tbody).getAllByRole("row");
    expect(rows.length).toBe(2);
    expect(within(rows[0]).getAllByRole("cell")[2]).toHaveTextContent("ARUN PANDI");
    expect(within(rows[1]).getAllByRole("cell")[2]).toHaveTextContent("ARUN PANDI");
  });

  it("prioritizes User_Mgt_Id over Emp_Id when mapping admin login user id to employee id", async () => {
    vi.mocked(getEmployeeDropdown).mockResolvedValue([
      { Emp_Id: 1, Emp_Name: "HARIHARAN", User_Mgt_Id: 10 },
      { Emp_Id: 2, Emp_Name: "ARUN PANDI", User_Mgt_Id: 1 },
    ] as any);

    renderWithProviders(<MyList />, {
      user: {
        ...mockUser,
        UserTypeId: 1,
        userType: 1,
        Local_User_ID: 1,
        Name: "Admin User",
        name: "Admin User",
      },
      company: {
        ...mockCompany,
        UserTypeId: 1,
        Local_User_ID: 1,
      },
    });

    const table = screen.getByTestId("data-table");
    const tbody = table.querySelector("tbody")!;

    await waitFor(() => {
      expect(within(tbody).getByText("EMPLOYEE ATTENDANCE")).toBeInTheDocument();
    });

    const rows = within(tbody).getAllByRole("row");
    expect(rows.length).toBe(2);
    expect(within(rows[0]).getAllByRole("cell")[2]).toHaveTextContent("ARUN PANDI");
    expect(within(rows[0]).getAllByRole("cell")[2]).not.toHaveTextContent("HARIHARAN");
    expect(within(rows[1]).getAllByRole("cell")[2]).toHaveTextContent("ARUN PANDI");
  });

  it("paginates 10 rows per page with FilterableTable TablePagination", async () => {
    const manyMasterTasks = Array.from({ length: 12 }, (_, idx) => ({
      Task_Id: 200 + idx,
      Task_Name: `TASK_${idx + 1}`,
      Project_Id: 1,
      Project_Name: "Alpha Project",
    }));

    const manyAssigned = manyMasterTasks.map((t, idx) => ({
      Id: String(idx + 1),
      Task_Assign_dt: "2026-11-18",
      Task_Id: t.Task_Id,
      Sch_Id: 300 + idx,
      Emp_Id: 1,
      Emp_Name: "HARIHARAN",
      Task_Name: t.Task_Name,
      Sch_Time: "09:00:00",
      EN_Time: "10:00:00",
      Invovled_Stat: 1,
    }));

    vi.mocked(getTask).mockResolvedValue(manyMasterTasks as any);
    vi.mocked(getEnrichedTodayPlan).mockResolvedValue(manyAssigned as any);
    vi.mocked(getEnrichedWorkMaster).mockResolvedValue([] as any);
    vi.mocked(fetchLink).mockResolvedValue({ success: true, data: { Emp_Id: 1 } } as any);

    renderWithProviders(<MyList />, {
      user: unmappedAdminUser,
      company: unmappedAdminCompany,
    });

    const table = screen.getByTestId("data-table");
    const tbody = table.querySelector("tbody")!;

    await waitFor(() => {
      expect(screen.getByText("1-10 of 12")).toBeInTheDocument();
    });
    expect(within(tbody).getAllByRole("row").length).toBe(10);

    const prevBtn = screen.getByRole("button", { name: "Go to previous page" });
    const nextBtn = screen.getByRole("button", { name: "Go to next page" });
    expect(prevBtn).toBeDisabled();
    expect(nextBtn).not.toBeDisabled();

    fireEvent.click(nextBtn);
    expect(screen.getByText("11-12 of 12")).toBeInTheDocument();
    expect(prevBtn).not.toBeDisabled();
    expect(nextBtn).toBeDisabled();
    expect(within(tbody).getAllByRole("row").length).toBe(2);
  });

  it("shows empty state message when no records are returned", async () => {
    vi.mocked(getTask).mockResolvedValue([] as any);
    vi.mocked(getEnrichedTodayPlan).mockResolvedValue([] as any);
    vi.mocked(getEnrichedWorkMaster).mockResolvedValue([] as any);

    renderWithProviders(<MyList />);

    await waitFor(() => {
      expect(
        screen.getByText("No task records found for the selected filters.")
      ).toBeInTheDocument();
    });
  });

  it("exports Excel CSV and PDF with 7-column table structure", async () => {
    const createObjectURLMock = vi.fn(() => "blob:mock-url");
    const revokeObjectURLMock = vi.fn();
    globalThis.URL.createObjectURL = createObjectURLMock;
    globalThis.URL.revokeObjectURL = revokeObjectURLMock;

    vi.mocked(fetchLink).mockResolvedValue({ success: true, data: { Emp_Id: 2 } } as any);

    renderWithProviders(<MyList />, {
      user: unmappedAdminUser,
      company: unmappedAdminCompany,
    });

    const table = screen.getByTestId("data-table");
    const tbody = table.querySelector("tbody")!;
    await waitFor(
      () => {
        expect(within(tbody).getByText("EMPLOYEE ATTENDANCE")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    fireEvent.click(screen.getByRole("button", { name: "Export Excel" }));
    expect(createObjectURLMock).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLMock).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Export PDF" }));
    expect(mockText).toHaveBeenCalledWith("Employee Daily Task Details", 10, 13);
    expect(mockAutoTable).toHaveBeenCalledTimes(1);
    const autoTableConfig = mockAutoTable.mock.calls[0][1];
    expect(autoTableConfig.head[0]).toEqual([
      "Project",
      "Task Name",
      "Employee",
      "Assigned Start Time",
      "Assigned End Time",
      "Assigned Duration",
      "Total Assigned Dates",
      "Total Working Days",
    ]);
    expect(autoTableConfig.body.length).toBe(2);
    expect(mockSave).toHaveBeenCalledWith("Employee_Daily_Task_Details.pdf");
  });
});
