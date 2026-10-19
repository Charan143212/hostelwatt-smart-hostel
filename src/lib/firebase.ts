import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { child, get, getDatabase, onValue, ref, type Database } from "firebase/database";

/**
 * Firebase Realtime Database client (existing HostelWatt project).
 * Config comes from VITE_FIREBASE_* env vars; the database URL falls back to
 * the project's public RTDB endpoint (not a secret).
 */
const env = import.meta.env;
const firebaseConfig = {
  apiKey: env['VITE_FIREBASE_API_KEY'],
  authDomain: env['VITE_FIREBASE_AUTH_DOMAIN'],
  projectId: env['VITE_FIREBASE_PROJECT_ID'] ?? "hostelwatt",
  appId: env['VITE_FIREBASE_APP_ID'],
  databaseURL:
    env['VITE_FIREBASE_DATABASE_URL'] ?? "https://hostelwatt-default-rtdb.asia-southeast1.firebasedatabase.app",
};

let db: Database | null = null;

export function getFirebaseApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export function getDb(): Database {
  if (!db) db = getDatabase(getFirebaseApp());
  return db;
}

export type Telemetry = { occupancy: number; power_watts: number };
export type EventLog = { headcount: number; status: string; timestamp: number; trigger: string };

const roomPath = (block: string, room: string) => `hostel_blocks/${block}/rooms/${room}`;

export async function readRoomTelemetry(block: string, room: string): Promise<Telemetry | null> {
  const snap = await get(child(ref(getDb()), `${roomPath(block, room)}/telemetry`));
  return snap.exists() ? (snap.val() as Telemetry) : null;
}

export async function readRoomEventLogs(block: string, room: string): Promise<Array<EventLog & { id: string }>> {
  const snap = await get(child(ref(getDb()), `${roomPath(block, room)}/event_logs`));
  if (!snap.exists()) return [];
  return Object.entries(snap.val() as Record<string, EventLog>).map(([id, v]) => ({ id, ...v }));
}

// ---------- Student credentials + live room (dev/demo auth; DB structure unchanged) ----------

export type StudentCredential = { assigned_block: string; assigned_room: string | number; name?: string; password?: string };

export async function readStudentCredential(registrationNumber: string): Promise<StudentCredential | null> {
  const snap = await get(child(ref(getDb()), `credentials/students/${registrationNumber}`));
  if (!snap.exists()) return null;
  // Normalise keys/values: records may contain stray whitespace (e.g. " assigned_block").
  const raw = snap.val() as Record<string, unknown>;
  const clean = Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k.trim(), typeof v === "string" && k.trim() !== "password" ? v.trim() : v]),
  );
  return clean as StudentCredential;
}

export type LiveRoom = {
  telemetry: Telemetry | null;
  /** Ordered oldest → newest (push-key order). */
  events: Array<EventLog & { id: string }>;
};

/** Subscribe to a room; returns unsubscribe. */
export function subscribeRoom(block: string, room: string, onData: (r: LiveRoom) => void, onError: (e: Error) => void) {
  return onValue(
    ref(getDb(), roomPath(block, room)),
    (snap) => {
      const v = (snap.val() ?? {}) as { telemetry?: Telemetry; event_logs?: Record<string, EventLog> };
      const events = Object.entries(v.event_logs ?? {})
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([id, e]) => ({ id, ...e }));
      onData({ telemetry: v.telemetry ?? null, events });
    },
    onError,
  );
}

/** Event timestamps may be epoch (s/ms) or device uptime ms; format accordingly. */
export function formatEventTime(ts: number, now = Date.now()): { relative: string; clock: string } {
  const ms = ts >= 1e12 ? ts : ts >= 1e9 ? ts * 1000 : null;
  if (ms === null) {
    const s = Math.floor(ts / 1000);
    const t = `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
    return { relative: `T+${t}`, clock: `T+${t}` };
  }
  const diff = Math.max(0, Math.round((now - ms) / 60000));
  const relative = diff < 1 ? "just now" : diff < 60 ? `${diff} min ago` : diff < 1440 ? `${Math.floor(diff / 60)} h ago` : `${Math.floor(diff / 1440)} d ago`;
  return { relative, clock: new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
}

// ---------- Warden credentials + live hostel rooms ----------

export type WardenCredential = { assigned_block: string; name?: string; password?: string };

export async function readWardenCredential(employeeId: string): Promise<WardenCredential | null> {
  const snap = await get(child(ref(getDb()), `credentials/wardens/${employeeId}`));
  if (!snap.exists()) return null;
  const raw = snap.val() as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k.trim(), typeof v === "string" && k.trim() !== "password" ? v.trim() : v]),
  ) as WardenCredential;
}

export type LiveHostelRoom = LiveRoom & { number: string; lastUpdated: number | null };

/** Subscribe to every room under hostel_blocks/{block}/rooms (enumerated dynamically). */
export function subscribeHostelRooms(block: string, onData: (rooms: LiveHostelRoom[]) => void, onError: (e: Error) => void) {
  return onValue(
    ref(getDb(), `hostel_blocks/${block}/rooms`),
    (snap) => {
      const all = (snap.val() ?? {}) as Record<string, { telemetry?: Telemetry; event_logs?: Record<string, EventLog>; last_updated?: number }>;
      onData(
        Object.entries(all).map(([number, v]) => ({
          number: number.trim(),
          telemetry: v?.telemetry ?? null,
          lastUpdated: typeof v?.last_updated === "number" ? v.last_updated : null,
          events: Object.entries(v?.event_logs ?? {})
            .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
            .map(([id, e]) => ({ id, ...e })),
        })),
      );
    },
    onError,
  );
}
