import { afterEach, describe, expect, it } from 'vitest';
import { signIn, signOut } from './session-store';
import { getReportHeaders } from './report-access';
import type { StudentSession } from './demo-auth';

const student: StudentSession = { role: 'STUDENT', registrationNumber: '25BCA8071', hostelBlock: 'MH6', assignedRoom: '814', hardwareNodeId: 'MH6-814' };
describe('report authorization lifecycle', () => {
  afterEach(() => { signOut(); localStorage.clear(); });
  it('keeps only existing non-sensitive session fields in localStorage and clears access on logout', () => {
    signIn(student, 'synthetic-test-secret');
    expect(JSON.parse(localStorage.getItem('hostelwatt.demo-session') ?? 'null')).toEqual(student);
    expect(getReportHeaders(student)).not.toBeNull();
    signOut();
    expect(getReportHeaders(student)).toBeNull();
    expect(localStorage.getItem('hostelwatt.demo-session')).toBeNull();
  });
  it('demo sign-in never reuses a prior real report authorization', () => {
    signIn(student, 'synthetic-test-secret'); signIn(student);
    expect(getReportHeaders(student)).toBeNull();
  });
});