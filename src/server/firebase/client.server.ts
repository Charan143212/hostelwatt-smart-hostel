import '@tanstack/react-start/server-only';
import type { FirebaseServerCredentials } from '../types/status';
import { EXPECTED_FIREBASE_DATABASE_URL } from './config.server';

export const FIREBASE_DATABASE_URL = EXPECTED_FIREBASE_DATABASE_URL;
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

function base64Url(bytes: Uint8Array): string {
  return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function encodeJson(value: unknown): string {
  return base64Url(new TextEncoder().encode(JSON.stringify(value)));
}

// No SDK, filesystem, global-scope I/O, or credential-bearing URL is required.
export async function getFirebaseAccessToken(credentials: FirebaseServerCredentials): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${encodeJson({ alg: 'RS256', typ: 'JWT' })}.${encodeJson({
    iss: credentials.email,
    scope: 'https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email',
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  })}`;
  const pem = credentials.privateKey.replace(/\\n/g, '\n')
    .replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, '');
  const key = await crypto.subtle.importKey(
    'pkcs8', Uint8Array.from(atob(pem), (char) => char.charCodeAt(0)),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'],
  );
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned));
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${base64Url(new Uint8Array(signature))}`,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error('Firebase server authentication failed');
  const result: unknown = await response.json();
  if (typeof result !== 'object' || result === null || !('access_token' in result)
    || typeof result.access_token !== 'string' || result.access_token.length === 0) {
    throw new Error('Firebase server authentication failed');
  }
  return result.access_token;
}

export async function probeFirebaseDatabase(accessToken: string): Promise<boolean> {
  const response = await fetch(`${FIREBASE_DATABASE_URL}/.json?shallow=true`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(10_000),
  });
  // Never return, parse, log, or expose even the root key names.
  await response.body?.cancel();
  return response.ok;
}