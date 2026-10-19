/**
 * DEMO AUTHENTICATION — simulated institutional records.
 * Replace these verify functions with a real auth provider later; the
 * session shapes below are what the UI consumes, so the UI does not change.
 */
import { hardwareNodeId, type HostelBlock } from "@/lib/data";

export type StudentSession = {
  role: "STUDENT";
  registrationNumber: string;
  hostelBlock: HostelBlock;
  assignedRoom: string;
  hardwareNodeId: string;
  name?: string | undefined;
};

export type AdminSession = {
  role: "ADMIN";
  employeeId: string;
  hostelBlock: HostelBlock;
  /** Blocks this admin may monitor; expandable to multi-block later. */
  authorizedBlocks: HostelBlock[];
};

export type Session = StudentSession | AdminSession;

export type VerifyResult<T> = { ok: true; session: T } | { ok: false; error: string };

const studentRecords = [
  { registrationNumber: "22BCE1024", hostelBlock: "MH1", room: "304", password: "student123" },
  { registrationNumber: "23ECE1108", hostelBlock: "MH2", room: "204", password: "student123" },
  { registrationNumber: "24CSE1216", hostelBlock: "LH1", room: "103", password: "student123" },
] as const;

const adminRecords = [{ employeeId: "EMP-9082", password: "admin123", blocks: ["MH1"] as HostelBlock[] }];

export const DEMO_STUDENT = { registrationNumber: "22BCE1024", hostelBlock: "MH1" as HostelBlock, room: "304", password: "student123" };
export const DEMO_ADMIN = { employeeId: "EMP-9082", hostelBlock: "MH1" as HostelBlock, password: "admin123" };

export function verifyStudentDemo(input: { registrationNumber: string; hostelBlock: HostelBlock; room: string; password: string }): VerifyResult<StudentSession> {
  const reg = input.registrationNumber.trim().toUpperCase();
  const record = studentRecords.find((r) => r.registrationNumber === reg);
  if (!record || record.hostelBlock !== input.hostelBlock || record.room !== input.room) {
    return { ok: false, error: `Invalid Allocation: ${reg} is not assigned to ${input.hostelBlock}, Room ${input.room}.` };
  }
  if (record.password !== input.password) return { ok: false, error: "Invalid Credentials: The Password / PIN is incorrect." };
  return {
    ok: true,
    session: { role: "STUDENT", registrationNumber: reg, hostelBlock: record.hostelBlock, assignedRoom: record.room, hardwareNodeId: hardwareNodeId(record.hostelBlock, record.room) },
  };
}

export function verifyAdmin(input: { employeeId: string; hostelBlock: HostelBlock; password: string }): VerifyResult<AdminSession> {
  const id = input.employeeId.trim().toUpperCase();
  const record = adminRecords.find((r) => r.employeeId === id);
  if (!record || record.password !== input.password) {
    return { ok: false, error: "Access Denied: Employee ID or Security Master Password is invalid." };
  }
  if (!record.blocks.includes(input.hostelBlock)) {
    return { ok: false, error: `Invalid Facility Assignment: ${id} is not authorized for ${input.hostelBlock}.` };
  }
  return { ok: true, session: { role: "ADMIN", employeeId: id, hostelBlock: input.hostelBlock, authorizedBlocks: [input.hostelBlock] } };
}

/**
 * Student verification against Firebase credentials/students/{reg}.
 * Missing Firebase records are rejected; demo access uses verifyStudentDemo only.
 */
export async function verifyStudentLive(input: { registrationNumber: string; hostelBlock: HostelBlock; room: string; password: string }): Promise<VerifyResult<StudentSession>> {
  const reg = input.registrationNumber.trim().toUpperCase();
  const { readStudentCredential } = await import("@/lib/firebase");
  let rec;
  try {
    rec = await readStudentCredential(reg);
  } catch {
    return { ok: false, error: "Connection Error: Could not reach the hostel records service. Try again." };
  }
  if (!rec) return { ok: false, error: "Invalid Credentials: The Password / PIN is incorrect." };
  // Look fields up by trimmed key so stray whitespace in record keys never breaks matching.
  const field = (name: string) => Object.entries(rec as Record<string, unknown>).find(([k]) => k.trim() === name)?.[1];
  const block = String(field("assigned_block") ?? "").trim().toUpperCase();
  const room = String(field("assigned_room") ?? "").trim();
  const enteredBlock = String(input.hostelBlock).trim().toUpperCase();
  const enteredRoom = String(input.room).trim();
  if (block !== enteredBlock || room !== enteredRoom) {
    // Temporary debug (no password logged).
    console.warn("[HostelWatt] allocation mismatch", { registrationNumber: reg, firebaseAssignedBlock: block, enteredHostel: enteredBlock, firebaseAssignedRoom: room, enteredRoom });
    return { ok: false, error: `Invalid Allocation: ${reg} is not assigned to ${input.hostelBlock}, Room ${input.room}.` };
  }
  if (String(rec.password ?? "") !== input.password) return { ok: false, error: "Invalid Credentials: The Password / PIN is incorrect." };
  return { ok: true, session: { role: "STUDENT", registrationNumber: reg, hostelBlock: input.hostelBlock, assignedRoom: room, hardwareNodeId: hardwareNodeId(input.hostelBlock, room), name: rec.name } };
}

// The ordinary student verifier must never use hardcoded demo allocations.
export const verifyStudent = verifyStudentLive;

/**
 * Admin verification against Firebase credentials/wardens/{employeeId}.
 * The session's hostel block always comes from the Firebase record.
 */
export async function verifyAdminLive(input: { employeeId: string; hostelBlock: HostelBlock; password: string }): Promise<VerifyResult<AdminSession>> {
  const id = input.employeeId.trim().toUpperCase();
  const { readWardenCredential } = await import("@/lib/firebase");
  let rec;
  try {
    rec = await readWardenCredential(id);
  } catch {
    return { ok: false, error: "Connection Error: Could not reach the hostel records service. Try again." };
  }
  if (!rec || String(rec.password ?? "") !== input.password) {
    return { ok: false, error: "Access Denied: Employee ID or Security Master Password is invalid." };
  }
  const block = String(rec.assigned_block ?? "").trim().toUpperCase() as HostelBlock;
  if (!block || block !== String(input.hostelBlock).trim().toUpperCase()) {
    return { ok: false, error: `Invalid Facility Assignment: ${id} is not authorized for ${input.hostelBlock}.` };
  }
  return { ok: true, session: { role: "ADMIN", employeeId: id, hostelBlock: block, authorizedBlocks: [block] } };
}
