import '@tanstack/react-start/server-only';
import { firebaseKey, type ReportPrincipal } from '../types/hardware-issues';
import type { FirebaseRequest } from '../firebase/rest.server';
import { ApiError } from './api-error.server';

// Independent API authorization against existing records; no change to UI login.
export async function authenticateReportRequest(request: Request, db: FirebaseRequest): Promise<ReportPrincipal> {
  const deny = () => new ApiError(401, 'UNAUTHORIZED', 'Valid institutional credentials are required.');
  const role = request.headers.get('X-HostelWatt-Role');
  const header = request.headers.get('Authorization');
  if ((role !== 'student' && role !== 'admin') || !header?.startsWith('Basic ') || header.length > 4096) throw deny();
  let decoded: string;
  try { decoded = new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(atob(header.slice(6)), (c) => c.charCodeAt(0))); }
  catch { throw deny(); }
  const separator = decoded.indexOf(':');
  if (separator < 1) throw deny();
  const id = decoded.slice(0, separator).trim().toUpperCase();
  const password = decoded.slice(separator + 1);
  if (!firebaseKey.safeParse(id).success || password.length === 0 || password.length > 1024) throw deny();
  const raw = await db(`credentials/${role === 'student' ? 'students' : 'wardens'}/${id}`);
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) throw deny();
  const record = Object.fromEntries(Object.entries(raw).map(([key, value]) => [key.trim(), value]));
  if (typeof record['password'] !== 'string') throw deny();
  // Fixed-size digest comparison avoids early-exit plaintext comparison.
  const [provided, stored] = await Promise.all([password, record['password']].map(async (value) =>
    new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))));
  if (!provided || !stored) throw deny();
  let difference = 0;
  for (let i = 0; i < 32; i++) difference |= (provided[i] ?? 0) ^ (stored[i] ?? 0);
  if (difference !== 0) throw deny();
  const hostel = firebaseKey.safeParse(record['assigned_block']);
  if (!hostel.success) throw deny();
  if (role === 'admin') return { role, id, hostel: hostel.data };
  const room = firebaseKey.safeParse(String(record['assigned_room'] ?? ''));
  if (!room.success) throw deny();
  return { role, id, hostel: hostel.data, room: room.data };
}