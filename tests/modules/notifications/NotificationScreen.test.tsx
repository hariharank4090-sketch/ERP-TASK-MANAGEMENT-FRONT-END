import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import NotificationScreen from '../../../src/modules/notifications/NotificationScreen';
import { renderWithProviders } from '../../../src/test/test-utils';
import { fetchLink } from '../../../src/Components/customFetch';

vi.mock('../../../src/Components/customFetch', () => ({
  fetchLink: vi.fn().mockResolvedValue({
    success: true,
    data: [],
  }),
}));

vi.mock('../../../src/modules/notifications/TicketDetailsDialog', () => ({
  default: ({ open, ticket, onConfirmSuccess, onClose }: any) =>
    open ? (
      <div data-testid="ticket-details-dialog">
        <span>{ticket?.title}</span>
        <span data-testid="dialog-involved-user">{ticket?.involvedUserName}</span>
        <button
          type="button"
          onClick={async () => {
            await onConfirmSuccess?.();
            onClose?.();
          }}
        >
          Mock Confirm Schedule
        </button>
      </div>
    ) : null,
}));

describe('NotificationScreen Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders notification center header and All, Unread, Read tabs', async () => {
    renderWithProviders(<NotificationScreen />);

    expect(screen.getByText('Notification Center')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /^All/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Unread/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Read/i })).toBeInTheDocument();
  });

  it('displays unscheduled tickets in Unread tab and confirmed/scheduled tickets in Read tab', async () => {
    const mockTickets = [
      {
        Id: 101,
        Subject: 'Unscheduled Ticket',
        Description: 'Needs scheduling',
        Status: 'New',
        Employee_Involved_Id: 1,
        From_CompanyId: 101,
        To_CompanyId: 101,
        Created_At: new Date().toISOString(),
      },
      {
        Id: 102,
        Subject: 'Scheduled Ticket',
        Description: 'Already scheduled',
        Status: 'in progress',
        Employee_Involved_Id: 1,
        T_Sch_Id: 55,
        From_CompanyId: 101,
        To_CompanyId: 101,
        Created_At: new Date().toISOString(),
      },
    ];

    vi.mocked(fetchLink).mockResolvedValue({
      success: true,
      data: mockTickets,
    } as any);

    renderWithProviders(<NotificationScreen />);

    // All tab shows both
    expect(await screen.findByText('Unscheduled Ticket')).toBeInTheDocument();
    expect(screen.getByText('Scheduled Ticket')).toBeInTheDocument();

    // Unread tab shows only Unscheduled Ticket
    fireEvent.click(screen.getByRole('button', { name: /^Unread/i }));
    expect(screen.getByText('Unscheduled Ticket')).toBeInTheDocument();
    expect(screen.queryByText('Scheduled Ticket')).not.toBeInTheDocument();

    // Read tab shows only Scheduled Ticket
    fireEvent.click(screen.getByRole('button', { name: /^Read/i }));
    expect(screen.queryByText('Unscheduled Ticket')).not.toBeInTheDocument();
    expect(screen.getByText('Scheduled Ticket')).toBeInTheDocument();
  });

  it('moves a ticket from Unread tab to Read tab when confirm schedule succeeds', async () => {
    let tickets = [
      {
        Id: 201,
        Subject: 'Ticket To Confirm',
        Description: 'Pending confirmation',
        Status: 'New',
        Employee_Involved_Id: 1,
        From_CompanyId: 101,
        To_CompanyId: 101,
        Created_At: new Date().toISOString(),
      },
    ];

    vi.mocked(fetchLink).mockImplementation(async ({ address }: any) => {
      if (String(address).startsWith('masters/tickets')) {
        return { success: true, data: tickets } as any;
      }
      return { success: true, data: [] } as any;
    });

    renderWithProviders(<NotificationScreen />);

    // Initially in Unread tab
    expect(await screen.findByText('Ticket To Confirm')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^Unread/i }));
    expect(screen.getByText('Ticket To Confirm')).toBeInTheDocument();

    // Select ticket and confirm schedule
    fireEvent.click(screen.getByText('Ticket To Confirm'));
    expect(await screen.findByTestId('ticket-details-dialog')).toBeInTheDocument();

    // Backend now has status 'in progress' after confirm
    tickets = [{ ...tickets[0], Status: 'in progress', T_Sch_Id: 99 } as any];
    fireEvent.click(screen.getByRole('button', { name: /Mock Confirm Schedule/i }));

    // Should disappear from Unread tab
    await waitFor(() => {
      expect(screen.queryByText('Ticket To Confirm')).not.toBeInTheDocument();
    });

    // Should appear in Read tab and All tab
    fireEvent.click(screen.getByRole('button', { name: /^Read/i }));
    expect(await screen.findByText('Ticket To Confirm')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^All/i }));
    expect(screen.getByText('Ticket To Confirm')).toBeInTheDocument();
  });

  it('lists tickets mapped by Ticket_Id in the schedule table under the Read tab', async () => {
    const mockTickets = [
      {
        Id: 301,
        Subject: 'Unmapped Unscheduled Ticket',
        Description: 'Not in schedule table',
        Status: 'New',
        Employee_Involved_Id: 1,
        From_CompanyId: 101,
        To_CompanyId: 101,
        Created_At: new Date().toISOString(),
      },
      {
        Id: 302,
        Subject: 'Mapped Scheduled Ticket',
        Description: 'Mapped in projectSchedule table',
        Status: 'New',
        Employee_Involved_Id: 1,
        From_CompanyId: 101,
        To_CompanyId: 101,
        Created_At: new Date().toISOString(),
      },
    ];

    vi.mocked(fetchLink).mockImplementation(async ({ address }: any) => {
      if (String(address).startsWith('masters/tickets')) {
        return { success: true, data: mockTickets } as any;
      }
      if (String(address).startsWith('masters/projectSchedule')) {
        return { success: true, data: { data: [{ Sch_Id: 88, Ticket_Id: 302 }] } } as any;
      }
      return { success: true, data: [] } as any;
    });

    renderWithProviders(<NotificationScreen />);

    expect(await screen.findByText('Unmapped Unscheduled Ticket')).toBeInTheDocument();
    expect(screen.getByText('Mapped Scheduled Ticket')).toBeInTheDocument();

    // Unread tab should only show Unmapped Unscheduled Ticket
    fireEvent.click(screen.getByRole('button', { name: /^Unread/i }));
    expect(screen.getByText('Unmapped Unscheduled Ticket')).toBeInTheDocument();
    expect(screen.queryByText('Mapped Scheduled Ticket')).not.toBeInTheDocument();

    // Read tab should show Mapped Scheduled Ticket
    fireEvent.click(screen.getByRole('button', { name: /^Read/i }));
    expect(screen.queryByText('Unmapped Unscheduled Ticket')).not.toBeInTheDocument();
    expect(screen.getByText('Mapped Scheduled Ticket')).toBeInTheDocument();
  });

  it('lists scheduled/assigned tickets in Read tab for non-admin user (userTypeId=3) matched via Emp_Id', async () => {
    const staffUser = {
      Global_User_ID: 262,
      Local_User_ID: 262,
      UserTypeId: 3,
      Name: 'Staff User',
      UserName: 'staffuser',
      Company_Id: 3,
      Company_Name: 'Test Corp',
      DB_Name: 'test_db',
      id: 262,
      name: 'Staff User',
      userType: 3,
    };

    const staffCompany = {
      companyId: 3,
      companyName: 'Test Corp',
      token: 'mock-jwt-token-12345',
      dbName: 'test_db',
      UserTypeId: 3,
      Local_User_ID: 262,
      Global_User_ID: 262,
    };

    localStorage.setItem('COMPANY_ID', '3');
    localStorage.setItem('USERTYPE_ID', '3');

    const mockTickets = [
      {
        Id: 401,
        Subject: 'Staff Scheduled Ticket',
        Description: 'Scheduled for employee 45',
        Status: 'in progress',
        Employee_Involved_Id: 45,
        T_Sch_Id: 77,
        From_CompanyId: 3,
        To_CompanyId: 3,
        Created_At: new Date().toISOString(),
      },
      {
        Id: 402,
        Subject: 'Staff Unscheduled Ticket',
        Description: 'Not yet scheduled',
        Status: 'Assigned',
        Employee_Involved_Id: 45,
        From_CompanyId: 3,
        To_CompanyId: 3,
        Created_At: new Date().toISOString(),
      },
    ];

    vi.mocked(fetchLink).mockImplementation(async ({ address }: any) => {
      if (String(address).startsWith('masters/tickets')) {
        return { success: true, data: mockTickets } as any;
      }
      if (String(address).startsWith('masters/ticketTasks/getEmpId/')) {
        return { success: true, data: [{ Emp_Id: 45 }] } as any;
      }
      return { success: true, data: [] } as any;
    });

    renderWithProviders(<NotificationScreen />, { user: staffUser, company: staffCompany });

    expect(await screen.findByText('Staff Scheduled Ticket')).toBeInTheDocument();
    expect(screen.getByText('Staff Unscheduled Ticket')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^Unread/i }));
    expect(screen.getByText('Staff Unscheduled Ticket')).toBeInTheDocument();
    expect(screen.queryByText('Staff Scheduled Ticket')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^Read/i }));
    expect(screen.getByText('Staff Scheduled Ticket')).toBeInTheDocument();
    expect(screen.queryByText('Staff Unscheduled Ticket')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('User')).not.toBeInTheDocument();
  });

  it('initially lists only the logged-in admin user tickets and filters by selected user in dropdown', async () => {
    const mockTickets = [
      {
        Id: 501,
        Subject: 'Admin Own Ticket',
        Description: 'Assigned to logged-in admin',
        Status: 'New',
        Employee_Involved_Id: 1,
        From_CompanyId: 101,
        To_CompanyId: 101,
        Created_At: new Date().toISOString(),
      },
      {
        Id: 502,
        Subject: 'Other User Ticket',
        Description: 'Assigned to another user',
        Status: 'New',
        Employee_Involved_Id: 262,
        Admin_Acknowledged_At: '2026-11-19T10:00:00Z',
        From_CompanyId: 101,
        To_CompanyId: 101,
        Created_At: new Date().toISOString(),
      },
      {
        Id: 503,
        Subject: 'Other User Scheduled Ticket',
        Description: 'Scheduled for another user',
        Status: 'in progress',
        Employee_Involved_Id: 262,
        T_Sch_Id: 90,
        From_CompanyId: 101,
        To_CompanyId: 101,
        Created_At: new Date().toISOString(),
      },
    ];

    vi.mocked(fetchLink).mockImplementation(async ({ address }: any) => {
      if (String(address).startsWith('masters/tickets')) {
        return { success: true, data: mockTickets } as any;
      }
      if (String(address).startsWith('masters/users')) {
        return {
          success: true,
          data: [
            { UserId: 1, Name: 'Test Admin', UserTypeId: 1 },
            { UserId: 262, Name: 'Jane Staff', UserTypeId: 3 },
          ],
        } as any;
      }
      return { success: true, data: [] } as any;
    });

    renderWithProviders(<NotificationScreen />);

    // Initially only Admin Own Ticket is shown, Other User Ticket is hidden
    expect(await screen.findByText('Admin Own Ticket')).toBeInTheDocument();
    expect(screen.queryByText('Other User Ticket')).not.toBeInTheDocument();

    // Open User dropdown and select Jane Staff
    const userSelect = screen.getByLabelText('User');
    fireEvent.mouseDown(userSelect);
    const option = await screen.findByRole('option', { name: 'Jane Staff' });
    fireEvent.click(option);

    expect(await screen.findByText('Other User Ticket')).toBeInTheDocument();
    expect(screen.getByText('Other User Scheduled Ticket')).toBeInTheDocument();
    expect(screen.queryByText('Admin Own Ticket')).not.toBeInTheDocument();

    // Check Unread tab for selected user
    fireEvent.click(screen.getByRole('button', { name: /^Unread/i }));
    expect(screen.getByText('Other User Ticket')).toBeInTheDocument();
    expect(screen.queryByText('Other User Scheduled Ticket')).not.toBeInTheDocument();

    // Check Read tab for selected user
    fireEvent.click(screen.getByRole('button', { name: /^Read/i }));
    expect(screen.getByText('Other User Scheduled Ticket')).toBeInTheDocument();
    expect(screen.queryByText('Other User Ticket')).not.toBeInTheDocument();

    // Clicking ticket card opens dialog with involved user name
    fireEvent.click(screen.getByText('Other User Scheduled Ticket'));
    expect(await screen.findByTestId('ticket-details-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-involved-user')).toHaveTextContent('Jane Staff');
  });

  it('filters tickets by Priority dropdown (Emergency, High, Medium, Low) on admin login', async () => {
    const mockTickets = [
      {
        Id: 601,
        Subject: 'Emergency Outage',
        Description: 'System down',
        Priority: 'Emergency',
        Status: 'New',
        Employee_Involved_Id: 1,
        From_CompanyId: 101,
        To_CompanyId: 101,
        Created_At: new Date().toISOString(),
      },
      {
        Id: 602,
        Subject: 'Medium Update',
        Description: 'Routine change',
        Priority: 'Medium',
        Status: 'New',
        Employee_Involved_Id: 1,
        From_CompanyId: 101,
        To_CompanyId: 101,
        Created_At: new Date().toISOString(),
      },
    ];

    vi.mocked(fetchLink).mockImplementation(async ({ address }: any) => {
      if (String(address).startsWith('masters/tickets')) {
        return { success: true, data: mockTickets } as any;
      }
      return { success: true, data: [] } as any;
    });

    renderWithProviders(<NotificationScreen />);

    expect(await screen.findByText('Emergency Outage')).toBeInTheDocument();
    expect(screen.getByText('Medium Update')).toBeInTheDocument();

    const prioritySelect = screen.getByLabelText('Priority');
    fireEvent.mouseDown(prioritySelect);
    expect(await screen.findByRole('option', { name: 'Emergency' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'High' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Medium' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Low' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('option', { name: 'Emergency' }));
    expect(screen.getByText('Emergency Outage')).toBeInTheDocument();
    expect(screen.queryByText('Medium Update')).not.toBeInTheDocument();
  });
});


