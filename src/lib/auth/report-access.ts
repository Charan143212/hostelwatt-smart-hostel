import type { Session } from './demo-auth';

// Request-only access held in memory; never persisted with the UI session.
let access: { role: Session['role']; id: string; authorization: string } | null = null;

export function setReportAccess(session: Session, password?: string) {
  access = null;
  if (!password) return;
  const id = session.role === 'STUDENT' ? session.registrationNumber : session.employeeId;
  const bytes = new TextEncoder().encode(`${id}:${password}`);
  access = { role: session.role, id, authorization: `Basic ${btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''))}` };
}

export function clearReportAccess() { access = null; }

export function getReportHeaders(session: Session): Record<string, string> | null {
  const id = session.role === 'STUDENT' ? session.registrationNumber : session.employeeId;
  if (!access || access.role !== session.role || access.id !== id) return null;
  return { Authorization: access.authorization, 'X-HostelWatt-Role': session.role === 'STUDENT' ? 'student' : 'admin' };
}