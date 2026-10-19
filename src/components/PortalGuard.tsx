import { useEffect, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setAuthModalOpen, useAuthState } from "@/lib/auth/session-store";
import type { AdminSession, StudentSession } from "@/lib/auth/demo-auth";

type Props =
  | { role: "STUDENT"; children: (session: StudentSession) => ReactNode }
  | { role: "ADMIN"; children: (session: AdminSession) => ReactNode };

export function PortalGuard(props: Props) {
  const { session, hydrated } = useAuthState();
  const navigate = useNavigate();
  const wrongRole = !!session && session.role !== props.role;

  useEffect(() => {
    if (!hydrated) return;
    if (!session) {
      setAuthModalOpen(true, props.role === "ADMIN" ? "admin" : "student");
      void navigate({ to: "/", replace: true });
      return;
    }
    if (wrongRole) {
      const t = setTimeout(() => void navigate({ to: session.role === "ADMIN" ? "/admin" : "/student", replace: true }), 3500);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [hydrated, session, wrongRole, navigate, props.role]);

  if (!hydrated || !session) {
    return <div className="flex min-h-[60vh] items-center justify-center font-mono text-sm text-muted-foreground">Verifying institutional access…</div>;
  }

  if (wrongRole) {
    const isStudent = session.role === "STUDENT";
    return (
      <div className="grid-bg flex min-h-[70vh] items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass w-full max-w-md rounded-2xl p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-primary/40 bg-primary/10 text-primary-bright glow">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <p className="mt-5 font-mono text-xs uppercase tracking-[0.3em] text-primary-bright">Access Restricted</p>
          <h1 className="mt-2 text-xl font-semibold">
            {isStudent ? "Administrator access required." : "Student portal access is restricted to assigned residents."}
          </h1>
          <div className="mt-5 grid grid-cols-2 gap-3 text-left text-xs">
            <div className="rounded-lg border border-border p-3"><p className="text-muted-foreground">Your current role</p><p className="mt-1 font-mono">{isStudent ? "STUDENT" : "ADMINISTRATOR"}</p></div>
            <div className="rounded-lg border border-border p-3"><p className="text-muted-foreground">Required role</p><p className="mt-1 font-mono">{props.role === "ADMIN" ? "ADMINISTRATOR" : "STUDENT"}</p></div>
          </div>
          <Button asChild className="mt-6 w-full glow">
            <Link to={isStudent ? "/student" : "/admin"} replace>Return to {isStudent ? "Student" : "Admin"} Dashboard</Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  return props.role === "STUDENT" ? props.children(session as StudentSession) : props.children(session as AdminSession);
}
