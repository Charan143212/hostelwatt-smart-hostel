import '@tanstack/react-start/server-only';
import type { FirebaseRequest } from '../firebase/rest.server';
import { storedReportSchema, type CreateHardwareReport, type HardwareReportPatch, type ReportFilters, type ReportPrincipal, type StoredHardwareReport } from '../types/hardware-issues';
import { ApiError } from './api-error.server';

function assertScope(principal: ReportPrincipal, hostel: string, room?: string) {
  if (hostel !== principal.hostel || (principal.role === 'student' && room !== principal.room)) {
    throw new ApiError(403, 'FORBIDDEN', 'Report access is outside your assigned hostel or room.');
  }
}

export function hardwareReportRepository(db: FirebaseRequest) {
  const read = async (id: string): Promise<StoredHardwareReport> => {
    const value = await db(`hardware_reports/${id}`);
    if (value === null) throw new ApiError(404, 'REPORT_NOT_FOUND', 'Hardware report not found.');
    const parsed = storedReportSchema.safeParse(value);
    if (!parsed.success) throw new ApiError(502, 'INVALID_REPORT_DATA', 'Stored report data is invalid.');
    return { id, ...parsed.data };
  };
  return {
    async create(input: CreateHardwareReport, principal: ReportPrincipal): Promise<StoredHardwareReport> {
      if (principal.role !== 'student' || input.reported_by !== principal.id) {
        throw new ApiError(403, 'FORBIDDEN', 'Reports must be submitted by the authenticated student.');
      }
      assertScope(principal, input.hostel, input.room);
      const id = crypto.randomUUID();
      const timestamp = Date.now();
      const report = { ...input, status: 'OPEN' as const, created_at: timestamp, updated_at: timestamp };
      await db(`hardware_reports/${id}`, 'PUT', report);
      return { id, ...report };
    },
    async list(filters: ReportFilters, principal: ReportPrincipal): Promise<StoredHardwareReport[]> {
      assertScope(principal, filters.hostel ?? principal.hostel, filters.room ?? principal.room);
      const raw = await db('hardware_reports');
      if (raw === null) return [];
      if (typeof raw !== 'object' || Array.isArray(raw)) throw new ApiError(502, 'INVALID_REPORT_DATA', 'Stored report data is invalid.');
      const reports: StoredHardwareReport[] = [];
      for (const [id, value] of Object.entries(raw)) {
        const parsed = storedReportSchema.safeParse(value);
        if (!parsed.success) throw new ApiError(502, 'INVALID_REPORT_DATA', 'Stored report data is invalid.');
        const report = parsed.data;
        if (report.hostel !== principal.hostel || (principal.role === 'student' && report.room !== principal.room)
          || (filters.hostel && report.hostel !== filters.hostel) || (filters.room && report.room !== filters.room)) continue;
        reports.push({ id, ...report });
      }
      return reports.sort((a, b) => b.created_at - a.created_at || a.id.localeCompare(b.id));
    },
    async patch(id: string, input: HardwareReportPatch, principal: ReportPrincipal): Promise<StoredHardwareReport> {
      if (principal.role !== 'admin') throw new ApiError(403, 'FORBIDDEN', 'Only the assigned hostel administrator can update reports.');
      const existing = await read(id);
      assertScope(principal, existing.hostel, existing.room);
      await db(`hardware_reports/${id}`, 'PATCH', { ...input, updated_at: Math.max(Date.now(), existing.updated_at + 1) });
      return read(id);
    },
  };
}