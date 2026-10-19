import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { BadgeCheck, Building, Building2, ChevronDown, Eye, EyeOff, FlaskConical, Home, KeyRound, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { hostelBlocks, type HostelBlock } from "@/lib/data";
import { DEMO_ADMIN, DEMO_STUDENT, verifyAdmin, verifyStudent, verifyStudentDemo, verifyAdminLive, type Session } from "@/lib/auth/demo-auth";
import { setAuthModalTab, signIn, useAuthState, type AuthTab } from "@/lib/auth/session-store";

type AuthModalProps = { open: boolean; onOpenChange: (open: boolean) => void };

const blockSchema = z.enum(hostelBlocks, { message: "Select your hostel block." });

const studentSchema = z.object({
  registration: z.string().trim().toUpperCase().regex(/^\d{2}[A-Z]{3}\d{4,5}$/, "Enter a valid registration number."),
  block: blockSchema,
  room: z.string().trim().regex(/^\d{3}$/, "Enter a three-digit room number."),
  pin: z.string().min(4, "Password / PIN must be at least 4 characters.").max(32, "Password / PIN is too long."),
});

const adminSchema = z.object({
  employeeId: z.string().trim().toUpperCase().regex(/^EMP[-_]\d{4}$/, "Enter a valid employee ID."),
  block: blockSchema,
  password: z.string().min(8, "Master password must be at least 8 characters.").max(64, "Master password is too long."),
});

type FieldErrors = Record<string, string | undefined>;

function schemaErrors(error: z.ZodError): FieldErrors {
  return Object.fromEntries(error.issues.map((issue) => [String(issue.path[0]), issue.message]));
}

function FieldError({ message }: { message: string | undefined }) {
  return message ? <p className="text-xs text-destructive">{message}</p> : null;
}

function BlockSelect({ id, value, onChange }: { id: string; value: HostelBlock | ""; onChange: (b: HostelBlock) => void }) {
  return (
    <div className="relative">
      <Building className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Select value={value} onValueChange={(v) => onChange(v as HostelBlock)}>
        <SelectTrigger id={id} className="border-border bg-background/45 pl-10"><SelectValue placeholder="Select hostel block" /></SelectTrigger>
        <SelectContent>
          {hostelBlocks.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const navigate = useNavigate();
  const { modalTab: tab } = useAuthState();
  const [studentErrors, setStudentErrors] = useState<FieldErrors>({});
  const [adminErrors, setAdminErrors] = useState<FieldErrors>({});
  const [showStudentSecret, setShowStudentSecret] = useState(false);
  const [showAdminSecret, setShowAdminSecret] = useState(false);
  const [firstTime, setFirstTime] = useState(false);
  const [studentBlock, setStudentBlock] = useState<HostelBlock | "">("");
  const [adminBlock, setAdminBlock] = useState<HostelBlock | "">("");
  const [showCreds, setShowCreds] = useState(false);

  const close = () => {
    onOpenChange(false);
    setStudentErrors({});
    setAdminErrors({});
    setFirstTime(false);
  };

  const complete = (session: Session, reportPassword?: string) => {
    signIn(session, reportPassword);
    close();
    if (session.role === "STUDENT") {
      toast.success(`Identity verified. ${session.hostelBlock} · Room ${session.assignedRoom} linked to ${session.hardwareNodeId}.`);
      void navigate({ to: "/student" });
    } else {
      toast.success(`Administrator verified. Monitoring Hostel ${session.hostelBlock}.`);
      void navigate({ to: "/admin" });
    }
  };

  const submitStudent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = studentSchema.safeParse({ registration: form.get("registration"), block: studentBlock || undefined, room: form.get("room"), pin: form.get("pin") });
    if (!result.success) return setStudentErrors(schemaErrors(result.error));
    setStudentErrors({});
    const r = await verifyStudent({ registrationNumber: result.data.registration, hostelBlock: result.data.block, room: result.data.room, password: result.data.pin });
    if (!r.ok) return void toast.error(r.error);
    complete(r.session, result.data.pin);
  };

  const submitAdmin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = adminSchema.safeParse({ employeeId: form.get("employeeId"), block: adminBlock || undefined, password: form.get("adminPassword") });
    if (!result.success) return setAdminErrors(schemaErrors(result.error));
    setAdminErrors({});
    const r = await verifyAdminLive({ employeeId: result.data.employeeId, hostelBlock: result.data.block, password: result.data.password });
    if (!r.ok) return void toast.error(r.error);
    complete(r.session, result.data.password);
  };

  const tryStudentDemo = () => {
    const r = verifyStudentDemo({ registrationNumber: DEMO_STUDENT.registrationNumber, hostelBlock: DEMO_STUDENT.hostelBlock, room: DEMO_STUDENT.room, password: DEMO_STUDENT.password });
    if (r.ok) complete(r.session);
  };
  const tryAdminDemo = () => {
    const r = verifyAdmin(DEMO_ADMIN);
    if (r.ok) complete(r.session);
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (nextOpen ? onOpenChange(true) : close())}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-border bg-card/90 p-0 shadow-2xl backdrop-blur-md sm:max-w-xl">
        <div className="border-b border-border px-5 pb-5 pt-6 sm:px-7">
          <DialogHeader className="text-left">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md border border-primary/40 bg-primary/10 text-primary-bright glow">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <DialogTitle className="text-2xl">Institutional Access Verification</DialogTitle>
            <DialogDescription>Authenticate against HostelWatt allocation and facility records.</DialogDescription>
          </DialogHeader>
        </div>

        <Tabs value={tab} onValueChange={(v) => setAuthModalTab(v as AuthTab)} className="px-5 pb-6 sm:px-7">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-background/60 p-1">
            <TabsTrigger value="student" className="min-h-12 whitespace-normal px-2 text-xs leading-tight data-[state=active]:bg-card sm:text-sm">
              <UserRound /> Student Access<br className="hidden sm:block" /> (Reg No &amp; Room)
            </TabsTrigger>
            <TabsTrigger value="admin" className="min-h-12 whitespace-normal px-2 text-xs leading-tight data-[state=active]:bg-card sm:text-sm">
              <BadgeCheck /> Administrator Portal<br className="hidden sm:block" /> (Employee ID)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="student" className="pt-4">
            <form className="space-y-4" onSubmit={submitStudent} noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="student-registration">Student Registration Number</Label>
                <div className="relative">
                  <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="student-registration" name="registration" autoComplete="username" maxLength={9} placeholder="22BCE1024" className="border-border bg-background/45 pl-10 font-mono uppercase" />
                </div>
                <FieldError message={studentErrors["registration"]} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="student-block">Hostel Block</Label>
                  <BlockSelect id="student-block" value={studentBlock} onChange={setStudentBlock} />
                  <FieldError message={studentErrors["block"]} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="student-room">Assigned Room Number</Label>
                  <div className="relative">
                    <Home className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="student-room" name="room" inputMode="numeric" maxLength={3} placeholder="304" className="border-border bg-background/45 pl-10 font-mono" />
                  </div>
                  <FieldError message={studentErrors["room"]} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="student-pin">Password / PIN</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="student-pin" name="pin" type={showStudentSecret ? "text" : "password"} autoComplete="current-password" maxLength={32} className="border-border bg-background/45 px-10" />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0" onClick={() => setShowStudentSecret((v) => !v)} aria-label={showStudentSecret ? "Hide password or PIN" : "Show password or PIN"}>
                    {showStudentSecret ? <EyeOff /> : <Eye />}
                  </Button>
                </div>
                <FieldError message={studentErrors["pin"]} />
              </div>
              {firstTime && (
                <div className="rounded-md border border-primary/30 bg-primary/10 p-3 text-sm text-muted-foreground">
                  Enter your allocated registration number, block and room, then choose the initial PIN issued by your hostel office.
                </div>
              )}
              <Button type="submit" className="h-11 w-full glow">
                <ShieldCheck /> {firstTime ? "Verify & Set Up Account" : "Verify Student Access"}
              </Button>
              <Button type="button" variant="link" className="h-auto w-full whitespace-normal px-1 text-xs text-muted-foreground" onClick={() => setFirstTime((v) => !v)}>
                {firstTime ? "Return to student login" : "First time logging in? Click here to verify Reg No & set up your account."}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="admin" className="pt-4">
            <form className="space-y-4" onSubmit={submitAdmin} noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="employee-id">Institutional Employee ID</Label>
                <div className="relative">
                  <BadgeCheck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="employee-id" name="employeeId" autoComplete="username" maxLength={12} placeholder="EMP_1001" className="border-border bg-background/45 pl-10 font-mono uppercase" />
                </div>
                <FieldError message={adminErrors["employeeId"]} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-block">Hostel Block</Label>
                <BlockSelect id="admin-block" value={adminBlock} onChange={setAdminBlock} />
                <FieldError message={adminErrors["block"]} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-password">Security Master Password</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="admin-password" name="adminPassword" type={showAdminSecret ? "text" : "password"} autoComplete="current-password" maxLength={64} className="border-border bg-background/45 px-10" />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0" onClick={() => setShowAdminSecret((v) => !v)} aria-label={showAdminSecret ? "Hide master password" : "Show master password"}>
                    {showAdminSecret ? <EyeOff /> : <Eye />}
                  </Button>
                </div>
                <FieldError message={adminErrors["password"]} />
              </div>
              <Button type="submit" className="h-11 w-full glow">
                <Building2 /> Unlock Administrator Portal
              </Button>
              <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-primary-bright" /> Authorized Hostel Warden &amp; Facility Personnel Only
              </p>
            </form>
          </TabsContent>

          <div className="mt-6 rounded-xl border border-border bg-background/40 p-4">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm font-semibold"><FlaskConical className="h-4 w-4 text-primary-bright" />Demo Access</p>
              <span className="rounded-full border border-primary/40 px-2 py-0.5 font-mono text-[10px] tracking-widest text-primary-bright">DEMO ONLY</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" size="sm" className="glass" onClick={tryStudentDemo}><UserRound /> Try Student Demo</Button>
              <Button type="button" variant="outline" size="sm" className="glass" onClick={tryAdminDemo}><BadgeCheck /> Try Admin Demo</Button>
            </div>
            <button type="button" onClick={() => setShowCreds((v) => !v)} className="mt-3 flex w-full items-center justify-between text-xs text-muted-foreground">
              Demo Credentials <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showCreds ? "rotate-180" : ""}`} />
            </button>
            {showCreds && (
              <div className="mt-2 grid gap-3 font-mono text-[11px] text-muted-foreground sm:grid-cols-2">
                <div><p className="text-foreground">Student</p>Reg No: 22BCE1024<br />Hostel: MH1<br />Room: 304<br />Password: student123</div>
                <div><p className="text-foreground">Administrator</p>Employee ID: EMP-9082<br />Hostel: MH1<br />Password: admin123</div>
              </div>
            )}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
