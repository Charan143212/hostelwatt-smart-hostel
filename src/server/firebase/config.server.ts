import '@tanstack/react-start/server-only';
import { createServerOnlyFn } from '@tanstack/react-start';
import { ApiError } from '../services/api-error.server';

export const EXPECTED_FIREBASE_DATABASE_URL = 'https://hostelwatt-default-rtdb.asia-southeast1.firebasedatabase.app';

// Secrets are read at request time only, never from browser config or JSON files.
export const getFirebaseServerConfig = createServerOnlyFn(() => {
  const projectId = process.env['FIREBASE_PROJECT_ID'];
  const email = process.env['FIREBASE_CLIENT_EMAIL'];
  const privateKey = process.env['FIREBASE_PRIVATE_KEY'];
  const databaseUrl = process.env['FIREBASE_DATABASE_URL'];
  if (!projectId || !email || !privateKey || !databaseUrl) {
    throw new ApiError(503, 'FIREBASE_NOT_CONFIGURED', 'Server-side Firebase credentials are not configured.');
  }
  // Pin the existing destination to prevent token disclosure or data relocation.
  if (projectId !== 'hostelwatt' || databaseUrl.replace(/\/$/, '') !== EXPECTED_FIREBASE_DATABASE_URL
    || !email.endsWith(`@${projectId}.iam.gserviceaccount.com`)) {
    throw new ApiError(503, 'FIREBASE_INVALID_CONFIG', 'Server-side Firebase configuration does not match the existing project.');
  }
  return { projectId, email, privateKey: privateKey.replace(/\\n/g, '\n'), databaseUrl: EXPECTED_FIREBASE_DATABASE_URL };
});