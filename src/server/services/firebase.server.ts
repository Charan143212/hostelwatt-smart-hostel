import '@tanstack/react-start/server-only';
import { createServerOnlyFn } from '@tanstack/react-start';
import { getFirebaseAccessToken, probeFirebaseDatabase } from '../firebase/client.server';
import type { FirebaseConnectivityStatus } from '../types/status';
import { getFirebaseServerConfig } from '../firebase/config.server';
import { ApiError } from './api-error.server';

// Internal-only diagnostic: not an RPC or public route, and performs no writes.
export const checkFirebaseConnectivity = createServerOnlyFn(async (): Promise<FirebaseConnectivityStatus> => {
  const service = 'Firebase Realtime Database' as const;
  try {
    const { email, privateKey } = getFirebaseServerConfig();
    const token = await getFirebaseAccessToken({ email, privateKey });
    return { status: await probeFirebaseDatabase(token) ? 'ok' : 'unavailable', service };
  } catch (error) {
    if (error instanceof ApiError && error.code === 'FIREBASE_NOT_CONFIGURED') return { status: 'not_configured', service };
    // Provider errors may contain sensitive information; report only a safe status.
    return { status: 'unavailable', service };
  }
});