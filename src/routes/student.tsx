import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Leaf, IndianRupee, Power, PowerOff } from "lucide-react";
import { PageFade } from "@/components/PageFade";
import { dailyConsumption } from "@/lib/data";
import { formatEventTime, subscribeRoom, type LiveRoom } from "@/lib/firebase";
import { PortalGuard } from "@/components/PortalGuard";
import type { StudentSession } from "@/lib/auth/demo-auth";

export const Route = createFileRoute("/student")({
  head: () => ({
    meta: [
      { title: "Student Dashboard — HostelWatt" },
      { name: "description", content: "Live occupancy, power draw and energy savings for your hostel room." },
      { property: "og:title", content: "Student Dashboard — HostelWatt" },
      { property: "og:description", content: "Your room's live energy telemetry and savings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Student,
});

export const chartTooltip = {
  contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--foreground)" },
};

function Student() {
  return <PortalGuard role="STUDENT">{(session) => <StudentView session={session} />}</PortalGuard>;
}

function persons(n: number) {
  return `${String(n).padStart(2, "0")} ${n === 1 ? "Person" : "Persons"}`;
}

function StudentView({ session }: { session: StudentSession }) {
  const room = { block: session.hostelBlock, number: session.assignedRoom, hardwareNodeId: session.hardwareNodeId };
  const [live, setLive] = useState<LiveRoom | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLive(null);
    setError(null);
    let unsub: (() => void) | undefined;
    try {
      unsub = subscribeRoom(session.hostelBlock, session.assignedRoom, setLive, () => setError("Live data unavailable"));
    } catch {
      setError("Live data unavailable");
    }
    return () => unsub?.();
  }, [session.hostelBlock, session.assignedRoom]);

  const loading = !live && !error;
  const latest = live?.events.at(-1);
  const powerStatus = latest?.status === "POWER_ON" ? "ON" : latest?.status === "POWER_OFF" ? "OFF" : null;
  const placeholder = error ? "Unavailable" : loading ? "Loading…" : "No data";
  const occupancyText = live?.telemetry ? persons(live.telemetry.occupancy) : placeholder;
  const loadText = live?.telemetry ? `${live.telemetry.power_watts.toFixed(1)} W` : placeholder;
  const lastActivity = latest ? formatEventTime(latest.timestamp).relative : placeholder;
  const history = (live?.events ?? []).slice().reverse();
  // Not yet available in the database — kept as the existing static value until a field exists.
  const ENERGY_SAVED_TODAY = "0.84 kWh";

  return (
    <PageFade>
      <div className="mx-auto max-w-7xl px-4 py-12">
        <h1 className="text-3xl font-bold">Student Dashboard</h1>
        <div className="mt-3 flex flex-wrap gap-2 font-mono text-xs">
          <span className="glass rounded-full px-3 py-1 text-primary-bright">{room.block}</span>
          <span className="glass rounded-full px-3 py-1">Room {room.number}</span>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border-4 border-card bg-lcd p-6 lg:col-span-2">
            <p className="mb-4 text-xs uppercase tracking-widest text-muted-foreground">Live Room Telemetry{error ? " · Connection error" : loading ? " · Connecting…" : ""}</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 lcd-text text-xl md:text-3xl">
              <div><p className="text-xs opacity-60">OCCUPANCY</p>{occupancyText}</div>
              <div><p className="text-xs opacity-60">POWER STATUS</p>{powerStatus ? `● POWER ${powerStatus}` : placeholder}</div>
              <div><p className="text-xs opacity-60">ENERGY SAVED TODAY</p>{ENERGY_SAVED_TODAY}</div>
              <div><p className="text-xs opacity-60">LAST ACTIVITY</p>{lastActivity}</div>
              <div><p className="text-xs opacity-60">LOAD</p>{loadText}</div>
            </div>
          </div>
          <div className="glass rounded-2xl p-6">
            <p className="text-sm text-muted-foreground">Energy saved this week</p>
            <p className="mt-2 flex items-center gap-2 font-mono text-4xl font-bold"><Leaf className="h-7 w-7 text-primary-bright" />8.4 kWh</p>
            <p className="mt-6 text-sm text-muted-foreground">Estimated savings</p>
            <p className="mt-1 flex items-center font-mono text-3xl font-bold text-primary-bright"><IndianRupee className="h-6 w-6" />67</p>
            <p className="mt-2 text-xs text-muted-foreground">@ ₹8 per kWh</p>
          </div>
        </div>

        <div className="glass mt-6 rounded-2xl p-6">
          <h2 className="font-semibold">Daily consumption reduction (kWh)</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer>
              <AreaChart data={dailyConsumption}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                <Tooltip {...chartTooltip} />
                <Area dataKey="baseline" stroke="var(--muted-foreground)" strokeDasharray="4 4" fill="none" />
                <Area dataKey="actual" stroke="var(--primary)" strokeWidth={2} fill="url(#g)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass mt-6 rounded-2xl p-6">
          <h2 className="font-semibold">Power state history</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground"><tr><th className="py-2">Time</th><th>Event</th><th>Action</th></tr></thead>
              <tbody>
                {history.length === 0 && (
                  <tr className="border-t border-border"><td colSpan={3} className="py-3 text-muted-foreground">{loading ? "Loading activity…" : error ? "Activity unavailable." : "No activity recorded yet."}</td></tr>
                )}
                {history.map((r) => {
                  const on = r.status === "POWER_ON";
                  const event = r.trigger === "USER_ENTRY" ? "Entry Detected" : r.trigger === "USER_EXIT" ? (r.headcount === 0 ? "Exit Detected — Room Vacant" : "Exit Detected") : r.trigger === "SYSTEM_BOOT" ? "System Started" : r.trigger;
                  return (
                    <tr key={r.id} className="border-t border-border">
                      <td className="py-3 font-mono">{formatEventTime(r.timestamp).clock}</td>
                      <td>{event} · {persons(r.headcount)}</td>
                      <td className={on ? "text-primary-bright" : "text-muted-foreground"}>
                        <span className="inline-flex items-center gap-1.5">{on ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}{on ? "Power ON" : "Power Automatically Switched OFF"}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageFade>
  );
}
