import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { webcrypto } from 'node:crypto';

vi.mock('@tanstack/react-start/server-only', () => ({}));
vi.mock('@tanstack/react-start', () => ({ createServerOnlyFn: (fn: unknown) => fn }));

import { createReportSchema, issueTypes, patchReportSchema, reportStatuses, type ReportPrincipal } from './types/hardware-issues';
import { hardwareReportRepository } from './services/hardware-issues.server';
import { handleHardwareIssues } from './routes/hardware-issues.server';
import { createFirebaseRequest, type FirebaseRequest } from './firebase/rest.server';
import { ApiError } from './services/api-error.server';

// Test-only fixtures, never seeded or used by application code.
const input = { hostel: 'MH6', room: '814', reported_by: '25BCA8071', issue_type: 'Power Sensor' as const, description: 'Sensor disconnected' };
const student: ReportPrincipal = { role: 'student', id: '25BCA8071', hostel: 'MH6', room: '814' };
const admin: ReportPrincipal = { role: 'admin', id: 'TEST_WARDEN', hostel: 'MH6' };
const stored = { ...input, status: 'OPEN' as const, created_at: 1000, updated_at: 1000 };

function request(method: string, body?: unknown, role = 'student', query = '') {
  const id = role === 'student' ? student.id : admin.id;
  return new Request(`http://localhost/api/hardware-issues${query}`, {
    method,
    headers: { 'Content-Type': 'application/json', 'X-HostelWatt-Role': role, Authorization: `Basic ${btoa(`${id}:test-only-password`)}` },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

function testDatabase() {
  const records: Record<string, unknown> = {};
  const db = vi.fn<FirebaseRequest>(async (path, method = 'GET', data) => {
    if (path.startsWith('credentials/')) return { assigned_block: 'MH6', assigned_room: 814, password: 'test-only-password' };
    const id = path.split('/')[1];
    if (!id) return Object.keys(records).length ? { ...records } : null;
    if (method === 'PUT') { records[id] = data; return data; }
    if (method === 'PATCH') { records[id] = { ...records[id] as object, ...data as object }; return data; }
    return records[id] ?? null;
  });
  return { records, db, connect: async () => db };
}

describe('hardware issue validation and rules', () => {
  beforeEach(() => vi.stubGlobal('crypto', webcrypto));
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

  it.each(['hostel', 'room', 'reported_by', 'issue_type', 'description'])('requires %s on creation', (field) => {
    const value: Record<string, unknown> = { ...input };
    delete value[field];
    expect(createReportSchema.safeParse(value).success).toBe(false);
  });

  it.each(['Power Sensor', 'Occupancy Sensor', 'Automatic Power Control', 'Room Telemetry', 'Other'])('accepts issue type %s', (issue_type) => {
    expect(createReportSchema.safeParse({ ...input, issue_type }).success).toBe(true);
  });

  it('rejects unknown issue types, blank text, path traversal and client timestamps', () => {
    expect(issueTypes).toHaveLength(5);
    for (const value of [{ issue_type: 'Unknown' }, { description: ' ' }, { room: '../814' }, { created_at: 1 }, { status: 'RESOLVED' }]) {
      expect(createReportSchema.safeParse({ ...input, ...value }).success).toBe(false);
    }
  });

  it.each(['OPEN', 'IN_PROGRESS', 'RESOLVED'])('accepts status %s for patches', (status) => {
    expect(patchReportSchema.safeParse({ status }).success).toBe(true);
  });

  it('restricts patches to status and description and rejects empty patches', () => {
    expect(reportStatuses).toHaveLength(3);
    for (const value of [{}, { status: 'CLOSED' }, { description: ' ' }, { room: '815' }, { updated_at: 0 }]) {
      expect(patchReportSchema.safeParse(value).success).toBe(false);
    }
  });

  it('generates unique server IDs and OPEN reports with equal server timestamps', async () => {
    const { db, records } = testDatabase();
    vi.spyOn(Date, 'now').mockReturnValue(1234567890000);
    const repository = hardwareReportRepository(db);
    const first = await repository.create(input, student);
    const second = await repository.create(input, student);
    expect(first.id).not.toBe(second.id);
    expect(first).toEqual({ ...input, id: first.id, status: 'OPEN', created_at: 1234567890000, updated_at: 1234567890000 });
    expect(records[first.id]).toEqual({ ...input, status: 'OPEN', created_at: 1234567890000, updated_at: 1234567890000 });
  });

  it('filters stored reports by hostel and room and scopes access', async () => {
    const { db, records } = testDatabase();
    records['one'] = stored;
    records['two'] = { ...stored, room: '815' };
    records['three'] = { ...stored, hostel: 'MH7' };
    const repository = hardwareReportRepository(db);
    expect(await repository.list({ hostel: 'MH6', room: '814' }, admin)).toEqual([{ id: 'one', ...stored }]);
    expect((await repository.list({}, admin)).map((report) => report.id)).toEqual(['one', 'two']);
    expect(await repository.list({}, student)).toEqual([{ id: 'one', ...stored }]);
    await expect(repository.list({ hostel: 'MH7' }, admin)).rejects.toMatchObject({ status: 403 });
  });

  it('updates only requested fields and updated_at then reads back storage', async () => {
    const { db, records } = testDatabase();
    records['one'] = stored;
    vi.spyOn(Date, 'now').mockReturnValue(2000);
    const report = await hardwareReportRepository(db).patch('one', { status: 'IN_PROGRESS', description: 'Inspection scheduled' }, admin);
    expect(report).toEqual({ ...stored, id: 'one', status: 'IN_PROGRESS', description: 'Inspection scheduled', updated_at: 2000 });
    expect(db).toHaveBeenCalledWith('hardware_reports/one', 'PATCH', { status: 'IN_PROGRESS', description: 'Inspection scheduled', updated_at: 2000 });
    expect(db.mock.calls.at(-1)).toEqual(['hardware_reports/one']);
  });

  it('returns 404 without creating a report when patching a missing ID', async () => {
    const { db } = testDatabase();
    await expect(hardwareReportRepository(db).patch('missing', { status: 'RESOLVED' }, admin)).rejects.toMatchObject({ status: 404 });
    expect(db.mock.calls.some((call) => call[1] === 'PATCH')).toBe(false);
  });

  it('rejects student impersonation, cross-room creation and student updates', async () => {
    const { db } = testDatabase();
    const repository = hardwareReportRepository(db);
    await expect(repository.create({ ...input, reported_by: 'OTHER' }, student)).rejects.toMatchObject({ status: 403 });
    await expect(repository.create({ ...input, room: '815' }, student)).rejects.toMatchObject({ status: 403 });
    await expect(repository.patch('one', { status: 'RESOLVED' }, student)).rejects.toMatchObject({ status: 403 });
    expect(db).not.toHaveBeenCalled();
  });

  it('returns an explicit configuration error without making network requests', async () => {
    vi.stubEnv('FIREBASE_CLIENT_EMAIL', '');
    vi.stubEnv('FIREBASE_PRIVATE_KEY', '');
    const network = vi.fn();
    vi.stubGlobal('fetch', network);
    const response = await handleHardwareIssues(request('POST', input));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: { code: 'FIREBASE_NOT_CONFIGURED', message: 'Server-side Firebase credentials are not configured.' } });
    expect(network).not.toHaveBeenCalled();
  });

  it('exercises authorized POST, filtered GET and PATCH against a test-only adapter', async () => {
    const { connect } = testDatabase();
    const created = await handleHardwareIssues(request('POST', input), undefined, connect);
    expect(created.status).toBe(201);
    const { report } = await created.json();
    const updated = await handleHardwareIssues(request('PATCH', { status: 'RESOLVED' }, 'admin'), report.id, connect);
    expect(updated.status).toBe(200);
    const listed = await handleHardwareIssues(request('GET', undefined, 'student', '?hostel=MH6&room=814'), undefined, connect);
    expect(listed.status).toBe(200);
    expect((await listed.json()).reports).toEqual([expect.objectContaining({ id: report.id, status: 'RESOLVED', created_at: report.created_at })]);
  });

  it('does not treat a browser session or invalid credentials as API authentication', async () => {
    const { connect, db } = testDatabase();
    const unsigned = new Request('http://localhost/api/hardware-issues', { headers: { 'X-HostelWatt-Role': 'admin' } });
    expect((await handleHardwareIssues(unsigned, undefined, connect)).status).toBe(401);
    const invalid = request('GET');
    invalid.headers.set('Authorization', `Basic ${btoa(`${student.id}:wrong-password`)}`);
    expect((await handleHardwareIssues(invalid, undefined, connect)).status).toBe(401);
    expect(db.mock.calls.every((call) => call[0].startsWith('credentials/'))).toBe(true);
  });

  it('rejects invalid JSON, unknown filters, duplicate filters and invalid patch IDs', async () => {
    const { connect, db } = testDatabase();
    const malformed = new Request('http://localhost/api/hardware-issues', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
    expect((await handleHardwareIssues(malformed, undefined, connect)).status).toBe(400);
    expect((await handleHardwareIssues(request('GET', undefined, 'admin', '?unknown=1'), undefined, connect)).status).toBe(400);
    expect((await handleHardwareIssues(request('GET', undefined, 'admin', '?room=814&room=815'), undefined, connect)).status).toBe(400);
    expect((await handleHardwareIssues(request('PATCH', { status: 'OPEN' }, 'admin'), '..', connect)).status).toBe(400);
    expect(db).not.toHaveBeenCalled();
  });

  it('does not return fake success when storage fails', async () => {
    const failing: FirebaseRequest = async (path) => {
      if (path.startsWith('credentials/')) return { assigned_block: 'MH6', assigned_room: '814', password: 'test-only-password' };
      throw new ApiError(502, 'FIREBASE_UNAVAILABLE', 'Firebase database operation failed.');
    };
    expect((await handleHardwareIssues(request('POST', input), undefined, async () => failing)).status).toBe(502);
  });

  it('rejects a cross-hostel administrator patch', async () => {
    const { db, records } = testDatabase();
    records['one'] = { ...stored, hostel: 'MH7' };
    await expect(hardwareReportRepository(db).patch('one', { status: 'RESOLVED' }, admin)).rejects.toMatchObject({ status: 403 });
  });

  it('does not accept malformed configured keys as successful Firebase access', async () => {
    vi.stubEnv('FIREBASE_PROJECT_ID', 'hostelwatt');
    vi.stubEnv('FIREBASE_DATABASE_URL', 'https://hostelwatt-default-rtdb.asia-southeast1.firebasedatabase.app');
    vi.stubEnv('FIREBASE_CLIENT_EMAIL', 'test@hostelwatt.iam.gserviceaccount.com');
    vi.stubEnv('FIREBASE_PRIVATE_KEY', 'test-only-invalid-key');
    await expect(createFirebaseRequest()).rejects.toMatchObject({ status: 502, code: 'FIREBASE_UNAVAILABLE' });
  });
});