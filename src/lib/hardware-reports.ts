import { z } from 'zod';
import type { Session, StudentSession, AdminSession } from './auth/demo-auth';
import { getReportHeaders } from './auth/report-access';
import { createReportSchema, storedReportSchema, reportStatuses, type CreateHardwareReport } from './contracts/hardware-issues';

export const reportQueryKey = (session: Session) => ['hardware-reports', session.role, session.hostelBlock,
  session.role === 'STUDENT' ? session.registrationNumber : session.employeeId,
  session.role === 'STUDENT' ? session.assignedRoom : 'all'] as const;

const responseReportSchema = storedReportSchema.extend({ id: z.string().min(1) });
export type Report = z.infer<typeof responseReportSchema>;
export type ReportStatus = typeof reportStatuses[number];
export { reportStatuses };

export function studentReportInput(session: StudentSession, issue_type: CreateHardwareReport['issue_type'], description: string): CreateHardwareReport {
  return createReportSchema.parse({ hostel: session.hostelBlock, room: session.assignedRoom,
    reported_by: session.registrationNumber, issue_type, description });
}

async function reportRequest(session: Session, path: string, method = 'GET', input?: unknown): Promise<unknown> {
  const headers = getReportHeaders(session);
  if (!headers) throw new Error('Please verify your institutional access again to use hardware reports.');
  let response: Response;
  try {
    response = await fetch(path, { method, credentials: 'same-origin', headers: { ...headers, 'Content-Type': 'application/json' },
      ...(input === undefined ? {} : { body: JSON.stringify(input) }) });
  } catch { throw new Error('Could not reach the reporting service. Please try again.'); }
  if (!response.ok) {
    if (response.status === 401) throw new Error('Please verify your institutional access again. Demo access cannot submit or manage real reports.');
    if (response.status === 403) throw new Error('This report is outside your assigned hostel or room.');
    if (response.status === 400) throw new Error('Check the issue type and description, then try again.');
    if (response.status === 404) throw new Error('This report is no longer available. Refresh the list.');
    throw new Error('The reporting service is unavailable right now. Please try again shortly.');
  }
  try { return await response.json(); }
  catch { throw new Error('The reporting service returned an incomplete response. Please refresh before trying again.'); }
}

export async function listReports(session: Session): Promise<Report[]> {
  const query = new URLSearchParams({ hostel: session.hostelBlock });
  if (session.role === 'STUDENT') query.set('room', session.assignedRoom);
  const data = z.object({ reports: z.array(responseReportSchema) }).parse(await reportRequest(session, `/api/hardware-issues?${query}`));
  // Defense in depth; server independently verifies the same scope.
  return data.reports.filter((report) => report.hostel === session.hostelBlock && (session.role === 'ADMIN' || report.room === session.assignedRoom));
}

export async function submitStudentReport(session: StudentSession, issue_type: CreateHardwareReport['issue_type'], description: string): Promise<Report> {
  return z.object({ report: responseReportSchema }).parse(await reportRequest(session, '/api/hardware-issues', 'POST', studentReportInput(session, issue_type, description))).report;
}

export async function updateReportStatus(session: AdminSession, report: Report, status: ReportStatus): Promise<Report> {
  if (report.hostel !== session.hostelBlock) throw new Error('This report is outside your assigned hostel.');
  if (!reportStatuses.includes(status)) throw new Error('Select a valid report status.');
  return z.object({ report: responseReportSchema }).parse(await reportRequest(session, `/api/hardware-issues/${encodeURIComponent(report.id)}`, 'PATCH', { status })).report;
}