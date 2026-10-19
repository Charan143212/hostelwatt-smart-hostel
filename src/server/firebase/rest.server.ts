import '@tanstack/react-start/server-only';
import { createServerOnlyFn } from '@tanstack/react-start';
import { getFirebaseAccessToken } from './client.server';
import { getFirebaseServerConfig } from './config.server';
import { ApiError } from '../services/api-error.server';

export type FirebaseRequest = (path: string, method?: 'GET' | 'PUT' | 'PATCH', data?: unknown) => Promise<unknown>;

export const createFirebaseRequest = createServerOnlyFn(async (): Promise<FirebaseRequest> => {
  const { email, privateKey, databaseUrl } = getFirebaseServerConfig();
  let token: string;
  try { token = await getFirebaseAccessToken({ email, privateKey }); }
  catch { throw new ApiError(502, 'FIREBASE_UNAVAILABLE', 'Firebase server authentication is unavailable.'); }

  return async (path, method = 'GET', data) => {
    if (!/^(credentials\/(students|wardens)\/[A-Za-z0-9_-]+|hardware_reports(\/[A-Za-z0-9_-]+)?)$/.test(path)
      || (method !== 'GET' && !/^hardware_reports\/[A-Za-z0-9_-]+$/.test(path))) {
      throw new ApiError(500, 'INVALID_DATABASE_OPERATION', 'Invalid database operation.');
    }
    try {
      const response = await fetch(`${databaseUrl}/${path}.json`, {
        method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        ...(data === undefined ? {} : { body: JSON.stringify(data) }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) {
        await response.body?.cancel();
        throw new Error('Database request failed');
      }
      return await response.json();
    } catch {
      throw new ApiError(502, 'FIREBASE_UNAVAILABLE', 'Firebase database operation failed.');
    }
  };
});