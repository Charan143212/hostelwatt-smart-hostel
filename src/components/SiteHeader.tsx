import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogIn, LogOut, Menu, ShieldCheck, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { AuthModal } from "./AuthModal";
import { ThemeToggle } from "./ThemeToggle";
import { setAuthModalOpen, signOut, useAuthState } from "@/lib/auth/session-store";

const links = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About Us" },
  { to: "/learn-more", label: "Learn More" },
] as const;


function AccessControls({ onDone }: { onDone?: () => void }) {
  const { session } = useAuthState();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  if (!session) {
    return (
      <Button size="sm" className="glow" onClick={() => { setAuthModalOpen(true); onDone?.(); }}>
        <LogIn /> Login / Access
      </Button>
    );
  }

  const logout = () => {
    queryClient.clear();
    signOut();
    onDone?.();
    void navigate({ to: "/", replace: true });
  };

  return (
    <>
      <Button asChild size="sm" className="glow">
        <Link to={session.role === "STUDENT" ? "/student" : "/admin"} onClick={onDone}>
          <ShieldCheck />
          {session.role === "STUDENT" ? `Student: Room ${session.assignedRoom}` : "Admin Portal"}
        </Link>
      </Button>
      <Button size="sm" variant="outline" className="glass" onClick={logout}><LogOut /> Logout</Button>
    </>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { modalOpen } = useAuthState();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-header backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/"><Logo /></Link>
        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <Link key={l.to} to={l.to} activeOptions={{ exact: true }}
              className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-primary-bright bg-accent" }}>{l.label}</Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <AccessControls />
          <ThemeToggle />
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X /> : <Menu />}</Button>
        </div>
      </div>
      {open && (
        <div className="space-y-1 border-t border-border px-4 py-3 lg:hidden">
          {links.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-muted-foreground">{l.label}</Link>
          ))}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <AccessControls onDone={() => setOpen(false)} />
          </div>
        </div>
      )}
      <AuthModal open={modalOpen} onOpenChange={setAuthModalOpen} />
    </header>
  );
}
