import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEMO_STUDENT, verifyStudent, verifyStudentDemo, verifyStudentLive } from "./demo-auth";
import { readStudentCredential } from "@/lib/firebase";

vi.mock("@/lib/firebase", () => ({ readStudentCredential: vi.fn() }));

const input = { registrationNumber: "25BCA8071", hostelBlock: "MH6", room: "814", password: "synthetic-test-pin" } as const;

describe("Student verification source", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses Firebase allocation MH6/814 for real student 25BCA8071, including legacy verifier calls", async () => {
    vi.mocked(readStudentCredential).mockResolvedValue({ assigned_block: "MH6", assigned_room: 814, password: input.password });
    expect(verifyStudent).toBe(verifyStudentLive);
    expect(await verifyStudent(input)).toMatchObject({ ok: true, session: { registrationNumber: "25BCA8071", hostelBlock: "MH6", assignedRoom: "814" } });
    expect(readStudentCredential).toHaveBeenCalledExactlyOnceWith("25BCA8071");
  });

  it("validates the Firebase password", async () => {
    vi.mocked(readStudentCredential).mockResolvedValue({ assigned_block: "MH6", assigned_room: "814", password: "different-test-pin" });
    expect((await verifyStudent(input)).ok).toBe(false);
  });

  it("rejects an allocation different from the Firebase assignment", async () => {
    vi.mocked(readStudentCredential).mockResolvedValue({ assigned_block: "MH6", assigned_room: "815", password: input.password });
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    expect((await verifyStudent(input)).ok).toBe(false);
    vi.restoreAllMocks();
  });

  it("does not fall back to demo allocations when the Firebase record is absent", async () => {
    vi.mocked(readStudentCredential).mockResolvedValue(null);
    expect((await verifyStudent(DEMO_STUDENT)).ok).toBe(false);
    expect(readStudentCredential).toHaveBeenCalledExactlyOnceWith(DEMO_STUDENT.registrationNumber);
  });

  it("keeps explicit demo access independent of Firebase", () => {
    expect(verifyStudentDemo(DEMO_STUDENT).ok).toBe(true);
    expect(readStudentCredential).not.toHaveBeenCalled();
  });
});