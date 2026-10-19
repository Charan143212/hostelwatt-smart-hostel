import { z } from 'zod';

export const issueTypes = ['Power Sensor', 'Occupancy Sensor', 'Automatic Power Control', 'Room Telemetry', 'Other'] as const;
export const reportStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED'] as const;
export const firebaseKey = z.string().trim().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/);
const description = z.string().trim().min(1).max(4000);

export const createReportSchema = z.object({
  hostel: firebaseKey, room: firebaseKey, reported_by: firebaseKey,
  issue_type: z.enum(issueTypes), description,
}).strict();
export const patchReportSchema = z.object({
  status: z.enum(reportStatuses).optional(), description: description.optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'At least one update is required');
export const reportFilterSchema = z.object({ hostel: firebaseKey.optional(), room: firebaseKey.optional() }).strict();
export const storedReportSchema = createReportSchema.extend({
  status: z.enum(reportStatuses), created_at: z.number().int().nonnegative(), updated_at: z.number().int().nonnegative(),
});

export type CreateHardwareReport = z.infer<typeof createReportSchema>;
export type HardwareReportPatch = z.infer<typeof patchReportSchema>;
export type HardwareReport = z.infer<typeof storedReportSchema>;
export type StoredHardwareReport = HardwareReport & { id: string };
export type ReportFilters = z.infer<typeof reportFilterSchema>;
export type ReportPrincipal = { role: 'student' | 'admin'; id: string; hostel: string; room?: string };