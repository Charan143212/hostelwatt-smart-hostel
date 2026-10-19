import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tanstack/react-start/server-only', () => ({}));
vi.mock('@tanstack/react-start', () => ({ createServerOnlyFn: (fn: unknown) => fn }));

import { healthResponse } from './routes/health.server';
import { checkFirebaseConnectivity } from './services/firebase.server';
import { FIREBASE_DATABASE_URL, probeFirebaseDatabase } from './firebase/client.server';

describe('HostelWatt server foundation', () => {
  beforeEach(() => {
    vi.stubEnv('FIREBASE_PROJECT_ID', 'hostelwatt');
    vi.stubEnv('FIREBASE_DATABASE_URL', FIREBASE_DATABASE_URL);
    vi.stubEnv('FIREBASE_CLIENT_EMAIL', '');
    vi.stubEnv('FIREBASE_PRIVATE_KEY', '');
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it('returns the requested health JSON independently of Firebase credentials', async () => {
    const response = healthResponse();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok', service: 'HostelWatt API' });
  });

  it('does not access Firebase without server credentials', async () => {
    const request = vi.fn();
    vi.stubGlobal('fetch', request);
    expect(await checkFirebaseConnectivity()).toEqual({ status: 'not_configured', service: 'Firebase Realtime Database' });
    expect(request).not.toHaveBeenCalled();
  });

  it('probes the existing database read-only without exposing its contents', async () => {
    const request = vi.fn().mockResolvedValue(new Response('{"private-key-name":true}', { status: 200 }));
    vi.stubGlobal('fetch', request);
    expect(await probeFirebaseDatabase('test-only-token')).toBe(true);
    expect(request).toHaveBeenCalledWith(
      'https://hostelwatt-default-rtdb.asia-southeast1.firebasedatabase.app/.json?shallow=true',
      expect.objectContaining({ method: 'GET', headers: { Authorization: 'Bearer test-only-token' } }),
    );
    expect(FIREBASE_DATABASE_URL).toBe('https://hostelwatt-default-rtdb.asia-southeast1.firebasedatabase.app');
  });

  it('treats denied RTDB access as a failed connectivity check', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 403 })));
    expect(await probeFirebaseDatabase('test-only-token')).toBe(false);
  });

  it('never exposes invalid credential details through diagnostic results', async () => {
    vi.stubEnv('FIREBASE_CLIENT_EMAIL', 'test@hostelwatt.iam.gserviceaccount.com');
    vi.stubEnv('FIREBASE_PRIVATE_KEY', 'invalid-test-only-key');
    expect(await checkFirebaseConnectivity()).toEqual({ status: 'unavailable', service: 'Firebase Realtime Database' });
  });
});