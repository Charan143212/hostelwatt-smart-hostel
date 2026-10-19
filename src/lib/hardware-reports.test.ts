import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { clearReportAccess, getReportHeaders, setReportAccess } from './auth/report-access';
import { listReports, studentReportInput, submitStudentReport, updateReportStatus, type Report } from './hardware-reports';
import type { StudentSession, AdminSession } from './auth/demo-auth';

const student: StudentSession = { role: 'STUDENT', registrationNumber: '25BCA8071', hostelBlock: 'MH6', assignedRoom: '814', hardwareNodeId: 'MH6-814' };
const admin: AdminSession = { role: 'ADMIN', employeeId: 'EMP_1001', hostelBlock: 'MH6', authorizedBlocks: ['MH6'] };
const report: Report = { id: 'test-report', hostel: 'MH6', room: '814', reported_by: '25BCA8071', issue_type: 'Power Sensor', description: 'Sensor disconnected', status: 'OPEN', created_at: 1000, updated_at: 1000 };

describe('hardware report browser API', () => {
  beforeEach(() => clearReportAccess());
  afterEach(() => { clearReportAccess(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it('derives locked hostel, room and reporting identity only from the student session', () => {
    expect(studentReportInput(student, 'Power Sensor', 'Sensor disconnected')).toEqual({ hostel: 'MH6', room: '814', reported_by: '25BCA8071', issue_type: 'Power Sensor', description: 'Sensor disconnected' });
  });

  it('POSTs the exact student session payload to the real endpoint and returns its persisted response', async () => {
    setReportAccess(student, 'synthetic-test-password');
    const request = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ report }));
    vi.stubGlobal('fetch', request);
    expect(await submitStudentReport(student, 'Power Sensor', 'Sensor disconnected')).toEqual(report);
    expect(request).toHaveBeenCalledExactlyOnceWith('/api/hardware-issues', expect.objectContaining({ method: 'POST', body: JSON.stringify(studentReportInput(student, 'Power Sensor', 'Sensor disconnected')), headers: expect.objectContaining({ 'X-HostelWatt-Role': 'student' }) }));
  });

  it('rejects demo or restored UI sessions without real request access and never sends a request', async () => {
    const request = vi.fn(); vi.stubGlobal('fetch', request);
    await expect(submitStudentReport(student, 'Power Sensor', 'Sensor disconnected')).rejects.toThrow();
    expect(request).not.toHaveBeenCalled();
  });

  it('clears authorization on logout/demo login and cannot reuse it for a different identity', () => {
    setReportAccess(student, 'synthetic-test-password');
    expect(getReportHeaders(student)).not.toBeNull();
    expect(getReportHeaders({ ...student, registrationNumber: 'OTHER' })).toBeNull();
    expect(getReportHeaders(admin)).toBeNull();
    clearReportAccess(); expect(getReportHeaders(student)).toBeNull();
    setReportAccess(student, 'synthetic-test-password'); setReportAccess(student);
    expect(getReportHeaders(student)).toBeNull();
    expect(window.localStorage.getItem('hostelwatt.demo-session')).toBeNull();
  });

  it('requests only the admin assigned hostel and excludes out-of-scope responses', async () => {
    setReportAccess(admin, 'synthetic-test-password');
    const request = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ reports: [report, { ...report, id: 'other', hostel: 'MH7' }] }));
    vi.stubGlobal('fetch', request);
    expect(await listReports(admin)).toEqual([report]);
    expect(request).toHaveBeenCalledWith('/api/hardware-issues?hostel=MH6', expect.objectContaining({ method: 'GET' }));
  });

  it.each(['OPEN', 'IN_PROGRESS', 'RESOLVED'] as const)('PATCHes only status %s for the assigned admin', async (status) => {
    setReportAccess(admin, 'synthetic-test-password');
    const saved = { ...report, status, updated_at: 2000 };
    const request = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ report: saved }));
    vi.stubGlobal('fetch', request);
    expect(await updateReportStatus(admin, report, status)).toEqual(saved);
    expect(request).toHaveBeenCalledExactlyOnceWith('/api/hardware-issues/test-report', expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ status }), headers: expect.objectContaining({ 'X-HostelWatt-Role': 'admin' }) }));
  });

  it('rejects cross-hostel status management before any request', async () => {
    setReportAccess(admin, 'synthetic-test-password');
    const request = vi.fn(); vi.stubGlobal('fetch', request);
    await expect(updateReportStatus(admin, { ...report, hostel: 'MH7' }, 'RESOLVED')).rejects.toThrow();
    expect(request).not.toHaveBeenCalled();
  });

  it.each([400, 401, 403, 404, 500, 503])('rejects HTTP %s rather than claiming success', async (status) => {
    setReportAccess(student, 'synthetic-test-password');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ error: { message: 'internal provider details must not surface' } }, { status })));
    await expect(submitStudentReport(student, 'Other', 'Sensor disconnected')).rejects.toThrow();
  });
});