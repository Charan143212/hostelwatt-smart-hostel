import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { setAuthModalOpen, useAuthState } from "@/lib/auth/session-store";
import { Leaf, Mail, MapPin, Phone, ShieldCheck, Wrench, Zap } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "./Logo";
import { HardwareIssueDialog } from "./HardwareIssueDialog";
import { Button } from "@/components/ui/button";

const quickLinks = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About Us" },
  { to: "/learn-more", label: "Learn More" },
] as const;

const portalLinks = [
  { to: "/student", label: "Student Dashboard", role: "STUDENT", tab: "student" },
  { to: "/admin", label: "Admin Portal", role: "ADMIN", tab: "admin" },
] as const;

export function SiteFooter() {
  const [reportOpen, setReportOpen] = useState(false);
  const { session } = useAuthState();
  const navigate = useNavigate();
  const openPortal = (portal: (typeof portalLinks)[number]) => {
    if (!session) return setAuthModalOpen(true, portal.tab);
    if (session.role !== portal.role) {
      toast.error(portal.role === "STUDENT" ? "Student portal access is restricted to assigned residents." : "Administrator access required.");
    }
    void navigate({ to: session.role === "STUDENT" ? "/student" : "/admin" });
  };

  return (
    <footer className="border-t border-border bg-background-2">
      <div className="mx-auto max-w-7xl px-4 pb-6 pt-14 sm:pt-16">
        <div className="grid gap-12 lg:grid-cols-[1.25fr_0.75fr_1.25fr_1fr] lg:gap-8">
          <section aria-labelledby="footer-brand">
            <h2 id="footer-brand" className="sr-only">HostelWatt</h2>
            <Link to="/" aria-label="HostelWatt home" className="inline-flex"><Logo /></Link>
            <p className="mt-5 max-w-sm text-sm leading-6 text-muted-foreground">
              Smart Energy Management &amp; Automated Occupancy Sensing powered by ESP32 edge intelligence for modern sustainable hostels.
            </p>
            <div className="glass mt-5 inline-flex max-w-full items-center gap-2 rounded-md px-3 py-2 font-mono text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 shrink-0 text-online" />
              <span><span className="text-online">All IoT Nodes Operational</span> <span aria-hidden="true">|</span> Latency: 12ms</span>
            </div>
          </section>

          <nav aria-labelledby="footer-navigation">
            <h2 id="footer-navigation" className="text-sm font-semibold">Quick Navigation</h2>
            <ul className="mt-5 space-y-3">
              {quickLinks.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="text-sm text-muted-foreground transition-colors duration-200 hover:text-primary-bright">
                    {item.label}
                  </Link>
                </li>
              ))}
              {portalLinks.map((item) => (
                <li key={item.to}>
                  <button type="button" onClick={() => openPortal(item)} className="text-sm text-muted-foreground transition-colors duration-200 hover:text-primary-bright">
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <section aria-labelledby="footer-contact">
            <h2 id="footer-contact" className="text-sm font-semibold">Contact Us &amp; Support</h2>
            <address className="mt-5 space-y-4 not-italic text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary-bright" />
                <span>Building B, Central Hostel Complex, Room 001</span>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary-bright" />
                <div className="min-w-0 space-y-1">
                  <a href="mailto:support@hostelwatt.edu" className="block break-all transition-colors hover:text-primary-bright">support@hostelwatt.edu</a>
                  <a href="mailto:warden@hostelwatt.edu" className="block break-all transition-colors hover:text-primary-bright">warden@hostelwatt.edu</a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary-bright" />
                <div>
                  <a href="tel:+918024567890" className="transition-colors hover:text-primary-bright">+91 (080) 2456-7890</a>
                  <p className="mt-1 text-xs">24/7 Energy &amp; Facilities Hotline</p>
                </div>
              </div>
            </address>
            <Button type="button" variant="outline" className="glass mt-5" onClick={() => setReportOpen(true)}>
              <Wrench /> Report Hardware Issue
            </Button>
          </section>

          <section aria-labelledby="footer-impact">
            <h2 id="footer-impact" className="text-sm font-semibold">Energy Impact</h2>
            <dl className="mt-5 space-y-3">
              <div className="glass flex items-center gap-3 rounded-md p-3">
                <ShieldCheck className="h-5 w-5 shrink-0 text-primary-bright" />
                <div><dt className="text-xs text-muted-foreground">Active Rooms Monitored</dt><dd className="mt-0.5 font-mono text-sm font-semibold">120+ Hostel Rooms</dd></div>
              </div>
              <div className="glass flex items-center gap-3 rounded-md p-3">
                <Zap className="h-5 w-5 shrink-0 text-primary-bright" />
                <div><dt className="text-xs text-muted-foreground">Total Energy Saved</dt><dd className="mt-0.5 font-mono text-sm font-semibold">1,480 kWh Saved This Month</dd></div>
              </div>
              <div className="glass flex items-center gap-3 rounded-md p-3">
                <Leaf className="h-5 w-5 shrink-0 text-primary-bright" />
                <div><dt className="text-xs text-muted-foreground">Carbon Footprint Reduction</dt><dd className="mt-0.5 font-mono text-sm font-semibold">1.2 Tons CO₂ Offset</dd></div>
              </div>
            </dl>
          </section>
        </div>

        <div className="mt-12 grid gap-5 border-t border-border pt-6 text-xs text-muted-foreground md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <p>© 2026 HostelWatt. All rights reserved. Built for Smart Campus Sustainability.</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-5">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Hardware Safety Guidelines</span>
          </div>
        </div>
      </div>

      <HardwareIssueDialog open={reportOpen} onOpenChange={setReportOpen} />
    </footer>
  );
}