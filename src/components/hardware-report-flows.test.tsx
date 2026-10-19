import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { HardwareIssueDialog } from './HardwareIssueDialog';
import { AdminHardwareIssues } from './AdminHardwareIssues';
import { listReports, submitStudentReport, updateReportStatus, reportQueryKey, type Report } from '@/lib/hardware-reports';
import type { AdminSession, StudentSession } from '@/lib/auth/demo-auth';

const state = vi.hoisted(() => ({ session: null as unknown }));
vi.mock('@/lib/auth/session-store', () => ({ useAuthState: () => state, setAuthModalOpen: vi.fn() }));
vi.mock('@/lib/auth/report-access', () => ({ getReportHeaders: () => ({ Authorization: 'test-only' }) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/hardware-reports', async (importOriginal) => ({ ...await importOriginal<typeof import('@/lib/hardware-reports')>(), listReports: vi.fn(), submitStudentReport: vi.fn(), updateReportStatus: vi.fn() }));
vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, disabled, children }: { value: string; onValueChange: (v: string) => void; disabled?: boolean; children: ReactNode }) => <select value={value} disabled={disabled} onChange={(e) => onValueChange(e.target.value)}><option value="" />{children}</select>,
  SelectTrigger: () => null, SelectValue: () => null, SelectContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: ReactNode }) => <option value={value}>{children}</option>,
}));

const student: StudentSession = { role: 'STUDENT', registrationNumber: '25BCA8071', hostelBlock: 'MH6', assignedRoom: '814', hardwareNodeId: 'MH6-814' };
const admin: AdminSession = { role: 'ADMIN', employeeId: 'EMP_1001', hostelBlock: 'MH6', authorizedBlocks: ['MH6'] };
const report: Report = { id: 'test-report', hostel: 'MH6', room: '814', reported_by: '25BCA8071', issue_type: 'Power Sensor', description: 'Sensor disconnected', status: 'OPEN', created_at: 1000, updated_at: 1000 };
function client() { return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } }); }

describe('connected hardware report flows', () => {
  beforeEach(() => { vi.clearAllMocks(); state.session = student; });
  afterEach(() => cleanup());

  it('submits once while pending, uses session identity, closes only on success and refreshes issue data', async () => {
    let resolve: ((value: Report) => void) | undefined;
    vi.mocked(submitStudentReport).mockReturnValue(new Promise((done) => { resolve = done; }));
    const queryClient = client(); const refresh = vi.spyOn(queryClient, 'invalidateQueries'); const close = vi.fn();
    render(<QueryClientProvider client={queryClient}><HardwareIssueDialog open onOpenChange={close} /></QueryClientProvider>);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Power Sensor' } });
    fireEvent.change(screen.getByLabelText('What happened?'), { target: { value: 'Sensor disconnected' } });
    const button = screen.getByRole('button', { name: 'Submit Hardware Report' });
    fireEvent.click(button); fireEvent.click(button);
    expect(submitStudentReport).toHaveBeenCalledExactlyOnceWith(student, 'Power Sensor', 'Sensor disconnected');
    expect(close).not.toHaveBeenCalled(); expect(toast.success).not.toHaveBeenCalled();
    if (!resolve) throw new Error('Expected pending request'); resolve(report);
    await waitFor(() => expect(close).toHaveBeenCalledWith(false));
    expect(queryClient.getQueryData(reportQueryKey(student))).toEqual([report]);
    expect(refresh).toHaveBeenCalledWith({ queryKey: ['hardware-reports'] });
    expect(toast.success).toHaveBeenCalledTimes(1);
  });

  it('retains the form and never signals success when submission fails', async () => {
    vi.mocked(submitStudentReport).mockRejectedValue(new Error('Service unavailable'));
    const close = vi.fn();
    render(<QueryClientProvider client={client()}><HardwareIssueDialog open onOpenChange={close} /></QueryClientProvider>);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Other' } });
    fireEvent.change(screen.getByLabelText('What happened?'), { target: { value: 'Sensor disconnected' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit Hardware Report' }));
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect(close).not.toHaveBeenCalled(); expect(toast.success).not.toHaveBeenCalled();
    expect((screen.getByLabelText('What happened?') as HTMLTextAreaElement).value).toBe('Sensor disconnected');
  });

  it('loads assigned admin reports, updates status once and displays the persisted response in cache', async () => {
    state.session = admin;
    vi.mocked(listReports).mockResolvedValue([report]);
    vi.mocked(updateReportStatus).mockResolvedValue({ ...report, status: 'RESOLVED', updated_at: 2000 });
    const queryClient = client();
    render(<QueryClientProvider client={queryClient}><AdminHardwareIssues session={admin} /></QueryClientProvider>);
    const select = await screen.findByRole('combobox');
    expect(listReports).toHaveBeenCalledWith(admin);
    fireEvent.change(select, { target: { value: 'RESOLVED' } });
    await waitFor(() => expect(updateReportStatus).toHaveBeenCalledExactlyOnceWith(admin, report, 'RESOLVED'));
    await waitFor(() => expect(toast.success).toHaveBeenCalledTimes(1));
  });

  it('keeps the stored status unchanged and signals no success after a failed admin update', async () => {
    state.session = admin;
    vi.mocked(listReports).mockResolvedValue([report]);
    vi.mocked(updateReportStatus).mockRejectedValue(new Error('Update failed'));
    const queryClient = client();
    render(<QueryClientProvider client={queryClient}><AdminHardwareIssues session={admin} /></QueryClientProvider>);
    fireEvent.change(await screen.findByRole('combobox'), { target: { value: 'IN_PROGRESS' } });
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect(queryClient.getQueryData(reportQueryKey(admin))).toEqual([report]);
    expect(toast.success).not.toHaveBeenCalled();
  });
});