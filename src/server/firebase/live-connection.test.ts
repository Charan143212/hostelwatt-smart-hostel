import { describe, expect, it, vi } from 'vitest';

vi.mock('@tanstack/react-start/server-only', () => ({}));
vi.mock('@tanstack/react-start', () => ({ createServerOnlyFn: (fn: unknown) => fn }));

import { checkFirebaseConnectivity } from '../services/firebase.server';
import { createFirebaseRequest } from './rest.server';

// Explicitly opt-in live checks. Never print credentials or database records.
describe.runIf(process.env['RUN_FIREBASE_INTEGRATION'] === 'true')('real Firebase connection', () => {
  it('authenticates with the service account and reads the report collection', async () => {
    expect(await checkFirebaseConnectivity()).toEqual({ status: 'ok', service: 'Firebase Realtime Database' });
    const request = await createFirebaseRequest();
    const result = await request('hardware_reports');
    expect(result === null || (typeof result === 'object' && !Array.isArray(result))).toBe(true);
  }, 45_000);

  it.runIf(process.env['RUN_FIREBASE_WRITE_VERIFICATION'] === 'true')('writes, patches, reads back and removes one temporary report', async () => {
    const request = await createFirebaseRequest();
    const id = `verification_${crypto.randomUUID()}`;
    const path = `hardware_reports/${id}`;
    const now = Date.now();
    const report = { hostel: 'VERIFICATION', room: 'TEMP', reported_by: 'SERVER_VERIFICATION', issue_type: 'Other', description: 'Temporary server connectivity verification; deleted immediately.', status: 'OPEN', created_at: now, updated_at: now };
    // Never overwrite an existing record, even in the event of an ID collision.
    expect((await request(path)) === null).toBe(true);
    try {
      await request(path, 'PUT', report);
      const created = await request(path);
      expect(JSON.stringify(created) === JSON.stringify(report) || (typeof created === 'object' && created !== null && 'status' in created && created.status === 'OPEN')).toBe(true);
      await request(path, 'PATCH', { status: 'RESOLVED', updated_at: now + 1 });
      const updated = await request(path);
      expect(typeof updated === 'object' && updated !== null && 'status' in updated && updated.status === 'RESOLVED'
        && 'description' in updated && updated.description === report.description && 'updated_at' in updated && updated.updated_at === now + 1).toBe(true);
      const collection = await request('hardware_reports');
      expect(typeof collection === 'object' && collection !== null && id in collection).toBe(true);
    } finally {
      // RTDB PUT null deletes only this generated temporary path. No public
      // DELETE endpoint or broader database permission is added for testing.
      await request(path, 'PUT', null);
      expect((await request(path)) === null).toBe(true);
    }
  }, 60_000);
});