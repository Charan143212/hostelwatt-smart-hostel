import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { webcrypto } from 'node:crypto';

vi.mock('@tanstack/react-start/server-only', () => ({}));
vi.mock('@tanstack/react-start', () => ({ createServerOnlyFn: (fn: unknown) => fn }));

import { getFirebaseServerConfig, EXPECTED_FIREBASE_DATABASE_URL } from './config.server';
import { getFirebaseAccessToken } from './client.server';
import { createFirebaseRequest } from './rest.server';

describe('server Firebase environment configuration', () => {
  beforeEach(() => {
    vi.stubEnv('FIREBASE_PROJECT_ID', 'hostelwatt');
    vi.stubEnv('FIREBASE_DATABASE_URL', EXPECTED_FIREBASE_DATABASE_URL);
    vi.stubEnv('FIREBASE_CLIENT_EMAIL', 'test@hostelwatt.iam.gserviceaccount.com');
    vi.stubEnv('FIREBASE_PRIVATE_KEY', 'test-only-key');
    vi.stubGlobal('crypto', webcrypto);
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it.each(['FIREBASE_PROJECT_ID', 'FIREBASE_DATABASE_URL', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'])('requires %s before making any request', async (name) => {
    vi.stubEnv(name, '');
    const network = vi.fn();
    vi.stubGlobal('fetch', network);
    await expect(createFirebaseRequest()).rejects.toMatchObject({ status: 503, code: 'FIREBASE_NOT_CONFIGURED' });
    expect(network).not.toHaveBeenCalled();
  });

  it('converts escaped private key newlines while preserving actual newlines', () => {
    vi.stubEnv('FIREBASE_PRIVATE_KEY', 'line1\\nline2\nline3');
    expect(getFirebaseServerConfig().privateKey).toBe('line1\nline2\nline3');
  });

  it('pins the existing project and RTDB destination', () => {
    expect(getFirebaseServerConfig().projectId).toBe('hostelwatt');
    expect(getFirebaseServerConfig().databaseUrl).toBe('https://hostelwatt-default-rtdb.asia-southeast1.firebasedatabase.app');
    vi.stubEnv('FIREBASE_DATABASE_URL', `${EXPECTED_FIREBASE_DATABASE_URL}/`);
    expect(getFirebaseServerConfig().databaseUrl).toBe(EXPECTED_FIREBASE_DATABASE_URL);
    for (const url of ['https://example.invalid', `${EXPECTED_FIREBASE_DATABASE_URL}/other`, `${EXPECTED_FIREBASE_DATABASE_URL}?override=1`]) {
      vi.stubEnv('FIREBASE_DATABASE_URL', url);
      expect(() => getFirebaseServerConfig()).toThrow(expect.objectContaining({ code: 'FIREBASE_INVALID_CONFIG' }));
    }
  });

  it('rejects a service account or project outside the existing project', () => {
    vi.stubEnv('FIREBASE_PROJECT_ID', 'other-project');
    expect(() => getFirebaseServerConfig()).toThrow(expect.objectContaining({ code: 'FIREBASE_INVALID_CONFIG' }));
    vi.stubEnv('FIREBASE_PROJECT_ID', 'hostelwatt');
    vi.stubEnv('FIREBASE_CLIENT_EMAIL', 'test@other-project.iam.gserviceaccount.com');
    expect(() => getFirebaseServerConfig()).toThrow(expect.objectContaining({ code: 'FIREBASE_INVALID_CONFIG' }));
  });

  it('signs and verifies an OAuth assertion with an escaped PKCS8 PEM', async () => {
    // Ephemeral test-only key, never stored as an application credential.
    const pair = await webcrypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
    const der = await webcrypto.subtle.exportKey('pkcs8', pair.privateKey);
    vi.stubEnv('FIREBASE_PRIVATE_KEY', `-----BEGIN PRIVATE KEY-----\\n${Buffer.from(der).toString('base64')}\\n-----END PRIVATE KEY-----`);
    const network = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ access_token: 'test-only-token' })));
    vi.stubGlobal('fetch', network);
    expect(await getFirebaseAccessToken(getFirebaseServerConfig())).toBe('test-only-token');
    const call = network.mock.calls[0];
    if (!call) throw new Error('Expected token request');
    const [url, options] = call;
    expect(url).toBe('https://oauth2.googleapis.com/token');
    const assertion = (options?.body as URLSearchParams).get('assertion');
    if (!assertion) throw new Error('Expected signed assertion');
    const [header, payload, signature] = assertion.split('.');
    if (!header || !payload || !signature) throw new Error('Expected complete signed assertion');
    expect(await webcrypto.subtle.verify('RSASSA-PKCS1-v1_5', pair.publicKey, Buffer.from(signature, 'base64url'), new TextEncoder().encode(`${header}.${payload}`))).toBe(true);
    expect(JSON.parse(Buffer.from(payload, 'base64url').toString()).iss).toBe('test@hostelwatt.iam.gserviceaccount.com');
  });
});