import '@tanstack/react-start/server-only';
import { z } from 'zod';
import { createFirebaseRequest, type FirebaseRequest } from '../firebase/rest.server';
import { authenticateReportRequest } from '../services/hardware-auth.server';
import { hardwareReportRepository } from '../services/hardware-issues.server';
import { ApiError } from '../services/api-error.server';
import { createReportSchema, patchReportSchema, reportFilterSchema, firebaseKey } from '../types/hardware-issues';

async function readBody(request: Request): Promise<unknown> {
  if (!request.headers.get('Content-Type')?.split(';')[0]?.trim().endsWith('application/json')) {
    throw new ApiError(415, 'INVALID_CONTENT_TYPE', 'Use application/json.');
  }
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, 'INVALID_JSON', 'A JSON body is required.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 32_768) {
        await reader.cancel();
        throw new ApiError(413, 'BODY_TOO_LARGE', 'Request body is too large.');
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { return JSON.parse(new TextDecoder().decode(bytes)); }
  catch { throw new ApiError(400, 'INVALID_JSON', 'Request body must be valid JSON.'); }
}

const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });

export async function handleHardwareIssues(request: Request, id?: string, connect: () => Promise<FirebaseRequest> = createFirebaseRequest): Promise<Response> {
  try {
    const method = request.method;
    // Validate first, but never permit a read or write before server authorization.
    const input = method === 'POST' ? createReportSchema.parse(await readBody(request))
      : method === 'PATCH' ? patchReportSchema.parse(await readBody(request)) : undefined;
    const url = new URL(request.url);
    const filterInput: Record<string, string> = {};
    for (const [key, value] of url.searchParams) {
      if (key in filterInput) throw new ApiError(400, 'INVALID_QUERY', 'Duplicate query parameters are not supported.');
      filterInput[key] = value;
    }
    const filters = reportFilterSchema.parse(filterInput);
    if (method === 'PATCH') firebaseKey.parse(id);
    if (!['GET', 'POST', 'PATCH'].includes(method)) throw new ApiError(405, 'METHOD_NOT_ALLOWED', 'Method not allowed.');
    const db = await connect();
    const principal = await authenticateReportRequest(request, db);
    const repository = hardwareReportRepository(db);
    if (method === 'GET') return json({ reports: await repository.list(filters, principal) });
    if (method === 'POST') return json({ report: await repository.create(createReportSchema.parse(input), principal) }, 201);
    return json({ report: await repository.patch(firebaseKey.parse(id), patchReportSchema.parse(input), principal) });
  } catch (error) {
    if (error instanceof z.ZodError) return json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid report input.', fields: error.issues.map((issue) => issue.path.join('.')) } }, 400);
    if (error instanceof ApiError) return json({ error: { code: error.code, message: error.message } }, error.status);
    return json({ error: { code: 'INTERNAL_ERROR', message: 'Unable to process the hardware report request.' } }, 500);
  }
}