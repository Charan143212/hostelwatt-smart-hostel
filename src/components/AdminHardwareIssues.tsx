import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { AdminSession } from '@/lib/auth/demo-auth';
import { getReportHeaders } from '@/lib/auth/report-access';
import { setAuthModalOpen } from '@/lib/auth/session-store';
import { listReports, reportQueryKey, reportStatuses, updateReportStatus, type Report, type ReportStatus } from '@/lib/hardware-reports';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function AdminHardwareIssues({ session }: { session: AdminSession }) {
  const client = useQueryClient();
  const access = !!getReportHeaders(session);
  const query = useQuery({ queryKey: reportQueryKey(session), queryFn: () => listReports(session), enabled: access, retry: false });
  const updating = useRef(new Set<string>());
  const [pending, setPending] = useState<string[]>([]);
  const [failure, setFailure] = useState('');
  const update = async (report: Report, status: ReportStatus) => {
    if (updating.current.has(report.id) || report.status === status) return;
    updating.current.add(report.id); setPending([...updating.current]); setFailure('');
    try {
      const saved = await updateReportStatus(session, report, status);
      client.setQueryData<Report[]>(reportQueryKey(session), (old) => old?.map((item) => item.id === saved.id ? saved : item));
      void client.invalidateQueries({ queryKey: reportQueryKey(session) });
      toast.success('Hardware report status updated.');
    } catch (error) { setFailure(error instanceof Error ? error.message : 'The report status could not be updated.'); }
    finally { updating.current.delete(report.id); setPending([...updating.current]); }
  };

  return <section className="mt-10 border-t border-border pt-8" aria-labelledby="hardware-issues-heading">
    <div className="flex items-center justify-between gap-4">
      <h2 id="hardware-issues-heading" className="text-xl font-semibold">Hardware Issues</h2>
      <Button variant="outline" size="icon" aria-label="Refresh hardware issues" title="Refresh hardware issues" disabled={!access || query.isFetching} onClick={() => void query.refetch()}>
        <RefreshCw className={query.isFetching ? 'animate-spin' : ''} />
      </Button>
    </div>
    {!access ? <div className="mt-4 space-y-3">
      <p className="text-sm text-muted-foreground">Verify institutional access to view and manage your hostel’s reports.</p>
      <Button variant="outline" onClick={() => setAuthModalOpen(true, 'admin')}>Verify Administrator Access</Button>
    </div> : query.isPending ? <p className="mt-4 text-sm text-muted-foreground">Loading hardware reports…</p>
      : query.isError ? <p role="alert" className="mt-4 text-sm text-destructive">{query.error instanceof Error ? query.error.message : 'Hardware reports are unavailable.'}</p>
      : <div className="mt-4"><Table>
        <TableHeader><TableRow>{['Report ID', 'Hostel', 'Room', 'Reported By', 'Issue Type', 'Description', 'Status', 'Created At', 'Updated At'].map((label) => <TableHead key={label} className="whitespace-nowrap">{label}</TableHead>)}</TableRow></TableHeader>
        <TableBody>
          {query.data.length === 0 && <TableRow><TableCell colSpan={9} className="py-6 text-muted-foreground">No hardware issues reported for {session.hostelBlock}.</TableCell></TableRow>}
          {query.data.map((report) => <TableRow key={report.id}>
            <TableCell className="max-w-44 break-all font-mono text-xs">{report.id}</TableCell>
            <TableCell>{report.hostel}</TableCell><TableCell>{report.room}</TableCell><TableCell className="font-mono text-xs">{report.reported_by}</TableCell>
            <TableCell className="min-w-36">{report.issue_type}</TableCell><TableCell className="min-w-48 max-w-80 whitespace-pre-wrap break-words">{report.description}</TableCell>
            <TableCell><div className="flex items-center gap-2"><Select value={report.status} disabled={pending.includes(report.id)} onValueChange={(value) => void update(report, value as ReportStatus)}>
              <SelectTrigger className="w-40" aria-label={`Status for report ${report.id}`}><SelectValue /></SelectTrigger>
              <SelectContent>{reportStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
            </Select>{pending.includes(report.id) && <LoaderCircle className="h-4 w-4 animate-spin" />}</div></TableCell>
            <TableCell className="min-w-40 text-xs">{new Date(report.created_at).toLocaleString()}</TableCell>
            <TableCell className="min-w-40 text-xs">{new Date(report.updated_at).toLocaleString()}</TableCell>
          </TableRow>)}
        </TableBody>
      </Table></div>}
    {failure && <p role="alert" className="mt-4 text-sm text-destructive">{failure}</p>}
  </section>;
}