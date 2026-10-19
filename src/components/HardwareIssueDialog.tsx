import { useRef, useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Wrench, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { useAuthState, setAuthModalOpen } from '@/lib/auth/session-store';
import { getReportHeaders } from '@/lib/auth/report-access';
import { reportQueryKey, submitStudentReport, type Report } from '@/lib/hardware-reports';
import { issueTypes } from '@/lib/contracts/hardware-issues';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const formSchema = z.object({ issue: z.enum(issueTypes, { message: 'Select the affected hardware.' }),
  details: z.string().trim().min(10, 'Add at least 10 characters of detail.').max(500, 'Keep the report under 500 characters.') });

export function HardwareIssueDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { session } = useAuthState();
  const queryClient = useQueryClient();
  const [issue, setIssue] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState('');
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  const student = session?.role === 'STUDENT' ? session : null;

  const submitReport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting.current || !student) return;
    const form = event.currentTarget;
    const result = formSchema.safeParse({ issue, details: new FormData(form).get('details') });
    if (!result.success) {
      setErrors(Object.fromEntries(result.error.issues.map((entry) => [String(entry.path[0]), entry.message])));
      return;
    }
    submitting.current = true;
    setPending(true); setErrors({}); setFailure('');
    try {
      const report = await submitStudentReport(student, result.data.issue, result.data.details);
      // Seed the confirmed persisted response, then refresh any active lists.
      queryClient.setQueryData<Report[]>(reportQueryKey(student), (old) => [report, ...(old ?? []).filter((item) => item.id !== report.id)]);
      void queryClient.invalidateQueries({ queryKey: ['hardware-reports'] });
      form.reset(); setIssue(''); onOpenChange(false);
      toast.success(`Hardware report submitted for Room ${student.assignedRoom}.`);
    } catch (error) {
      setFailure(error instanceof Error ? error.message : 'Your report could not be submitted. Please try again.');
    } finally { submitting.current = false; setPending(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!submitting.current) { onOpenChange(value); if (!value) { setFailure(''); setErrors({}); } } }}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-border bg-card/95 sm:max-w-lg">
        <DialogHeader>
          <div className="mb-2 grid h-10 w-10 place-items-center rounded-md border border-primary/40 bg-primary/10 text-primary-bright glow"><Wrench className="h-5 w-5" /></div>
          <DialogTitle>Report a hardware issue</DialogTitle>
          <DialogDescription>Tell the facility team which room sensor or relay needs attention.</DialogDescription>
        </DialogHeader>
        {student ? <form className="space-y-4 pt-2" onSubmit={submitReport} noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="report-room">Room number</Label>
            <Input id="report-room" value={student.assignedRoom} readOnly className="bg-background/45 font-mono" />
            <p className="text-xs text-muted-foreground">{student.hostelBlock} · {student.registrationNumber}</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="report-issue">Affected hardware</Label>
            <Select value={issue} onValueChange={setIssue} disabled={pending}>
              <SelectTrigger id="report-issue" className="h-10 bg-background/45"><SelectValue placeholder="Select sensor or relay" /></SelectTrigger>
              <SelectContent>{issueTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
            </Select>
            {errors['issue'] && <p className="text-xs text-destructive">{errors['issue']}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="report-details">What happened?</Label>
            <Textarea id="report-details" name="details" maxLength={500} disabled={pending} placeholder="Describe the fault, when it started, and any status lights you can see." className="min-h-28 resize-none bg-background/45" />
            {errors['details'] && <p className="text-xs text-destructive">{errors['details']}</p>}
          </div>
          {failure && <p role="alert" className="text-sm text-destructive">{failure}</p>}
          {!getReportHeaders(student) && <Button type="button" variant="outline" className="w-full" onClick={() => { onOpenChange(false); setAuthModalOpen(true, 'student'); }}>Verify Student Access</Button>}
          <Button type="submit" disabled={pending || !getReportHeaders(student)} className="h-11 w-full glow">
            {pending ? <LoaderCircle className="animate-spin" /> : <Wrench />} {pending ? 'Submitting…' : 'Submit Hardware Report'}
          </Button>
        </form> : <div className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">Student access is required to submit a room hardware report.</p>
          {!session && <Button className="w-full" onClick={() => { onOpenChange(false); setAuthModalOpen(true, 'student'); }}>Verify Student Access</Button>}
        </div>}
      </DialogContent>
    </Dialog>
  );
}