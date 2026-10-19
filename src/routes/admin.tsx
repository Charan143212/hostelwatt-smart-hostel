import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Building2, Power, PowerOff, Search, Users } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageFade } from "@/components/PageFade";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { formatEventTime, subscribeHostelRooms, type LiveHostelRoom } from "@/lib/firebase";
import { PortalGuard } from "@/components/PortalGuard";
import type { AdminSession } from "@/lib/auth/demo-auth";
import { chartTooltip } from "./student";
import { AdminHardwareIssues } from '@/components/AdminHardwareIssues';

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — HostelWatt Facility Control" },
      { name: "description", content: "Monitor every hostel room's power and occupancy, from one read-only view." },
      { property: "og:title", content: "Admin Dashboard — HostelWatt" },
      { property: "og:description", content: "Facility-wide energy control for hostel administrators." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Admin,
});

type Sort = "high" | "low" | "room" | "vacancy";

function Admin() {
  return <PortalGuard role="ADMIN">{(session) => <AdminView session={session} />}</PortalGuard>;
}

function AdminView({ session }: { session: AdminSession }) {
  const [live, setLive] = useState<LiveHostelRoom[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  useEffect(() => {
    setLive(null);
    setLoadError(null);
    // Only the Firebase-assigned block from the verified session is ever read.
    return subscribeHostelRooms(session.hostelBlock, setLive, () => setLoadError("Live hostel data is unavailable right now. Please try again shortly."));
  }, [session.hostelBlock]);
  const rooms = useMemo(
    () =>
      (live ?? []).map((r) => {
        const latest = r.events.at(-1);
        const status = [...r.events].reverse().find((e) => e.status === "POWER_ON" || e.status === "POWER_OFF")?.status;
        const power = r.telemetry?.power_watts ?? 0;
        return {
          id: r.number,
          block: session.hostelBlock,
          number: r.number,
          power,
          occupancy: r.telemetry?.occupancy ?? 0,
          hasTelemetry: !!r.telemetry,
          on: status ? status === "POWER_ON" : power > 0,
          lastActivity: latest ? formatEventTime(latest.timestamp).relative : "—",
          events: r.events.slice().reverse(),
        };
      }),
    [live, session.hostelBlock],
  );
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("high");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = rooms.find((r) => r.id === selectedId) ?? null;

  const list = useMemo(() => {
    const f = rooms.filter((r) => `${r.block} ${r.number}`.toLowerCase().includes(q.toLowerCase()));
    const s = [...f];
    if (sort === "high") s.sort((a, b) => b.power - a.power);
    if (sort === "low") s.sort((a, b) => a.power - b.power);
    if (sort === "room") s.sort((a, b) => a.number.localeCompare(b.number));
    if (sort === "vacancy") s.sort((a, b) => a.occupancy - b.occupancy);
    return s;
  }, [rooms, q, sort]);

  const active = rooms.filter((r) => r.on).length;

  return (
    <PageFade>
      <div className="mx-auto max-w-7xl px-4 py-12">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary-bright">{session.hostelBlock}</p>
        <h1 className="mt-2 text-3xl font-bold">Admin Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Monitoring Hostel {session.hostelBlock} · <span className="text-online">●</span> {rooms.length} Rooms Monitored</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { icon: Building2, label: "Monitored Rooms", value: rooms.length },
            { icon: Power, label: "Power ON", value: active },
            { icon: PowerOff, label: "Vacant / Power OFF", value: rooms.length - active },
          ].map((s) => (
            <div key={s.label} className="glass flex items-center gap-4 rounded-2xl p-5">
              <s.icon className="h-6 w-6 text-primary-bright" />
              <div><p className="font-mono text-3xl font-bold">{String(s.value).padStart(2, "0")}</p><p className="text-sm text-muted-foreground">{s.label}</p></div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search room (e.g. 304)" className="glass pl-9" />
          </div>
          <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
            <SelectTrigger className="glass sm:w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="high">Highest Usage</SelectItem>
              <SelectItem value="low">Lowest Usage</SelectItem>
              <SelectItem value="room">Room #</SelectItem>
              <SelectItem value="vacancy">Vacancy Status</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loadError ? (
          <p className="glass mt-6 rounded-2xl p-6 text-center text-muted-foreground">{loadError}</p>
        ) : live === null ? (
          <p className="glass mt-6 rounded-2xl p-6 text-center text-muted-foreground">Loading live room data…</p>
        ) : rooms.length === 0 ? (
          <p className="glass mt-6 rounded-2xl p-6 text-center text-muted-foreground">No rooms found for Hostel {session.hostelBlock}.</p>
        ) : null}
        <motion.div layout className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {list.map((r) => {
            const on = r.on;
            return (
              <motion.button layout key={r.id} onClick={() => setSelectedId(r.id)}
                className={`glass rounded-2xl p-5 text-left transition-colors hover:border-primary/60 ${on ? "glow" : ""}`}>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">{r.block} · {r.number}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${on ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{on ? "Power ON" : "Power OFF"}</span>
                </div>
                <p className="mt-4 font-mono text-3xl font-bold">{r.power.toFixed(1)}<span className="ml-1 text-sm text-muted-foreground">W</span></p>
                {r.hasTelemetry ? (
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><Users className="h-4 w-4" />{r.occupancy} occupant{r.occupancy === 1 ? "" : "s"}</p>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">Telemetry unavailable</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">Last activity: {r.lastActivity}</p>
                <span className="mt-4 inline-block text-sm text-primary-bright">View Details →</span>
              </motion.button>
            );
          })}
        </motion.div>
        <AdminHardwareIssues session={session} />
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelectedId(null)}>
        <SheetContent className="w-full overflow-y-auto border-border bg-background sm:max-w-md">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.block} • Room {selected.number}</SheetTitle>
                <SheetDescription>Live room telemetry</SheetDescription>
              </SheetHeader>
              <div className="space-y-6 px-4 pb-8">
                <div className="grid grid-cols-2 gap-3">
                  <div className="glass rounded-xl p-3">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Occupancy</p>
                    <p className="font-mono text-lg">{selected.hasTelemetry ? `${String(selected.occupancy).padStart(2, "0")} ${selected.occupancy === 1 ? "Person" : "Persons"}` : "Unavailable"}</p>
                  </div>
                  <div className="glass rounded-xl p-3">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Power Status</p>
                    <p className={`font-mono text-lg ${selected.on ? "text-primary-bright" : "text-muted-foreground"}`}>● POWER {selected.on ? "ON" : "OFF"}</p>
                  </div>
                  <div className="glass rounded-xl p-3">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Energy Saved Today</p>
                    <p className="font-mono text-lg">0.84 kWh</p>
                    <p className="text-[10px] text-muted-foreground">Sample estimate</p>
                  </div>
                  <div className="glass rounded-xl p-3">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Last Activity</p>
                    <p className="font-mono text-lg">{selected.lastActivity}</p>
                  </div>
                </div>
                <div>
                  <p className="mb-2 font-semibold">Occupancy Event History</p>
                  <div className="h-40">
                    <ResponsiveContainer>
                      <AreaChart data={selected.events.slice().reverse().map((e) => ({ hour: formatEventTime(e.timestamp).clock, headcount: e.headcount }))} margin={{ top: 5, right: 8, bottom: 16, left: 4 }}>
                        <XAxis dataKey="hour" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} label={{ value: "Event Time", position: "insideBottom", offset: -12, fill: "var(--muted-foreground)", fontSize: 10 }} />
                        <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} width={46} allowDecimals={false} label={{ value: "Occupancy (People)", angle: -90, position: "insideLeft", fill: "var(--muted-foreground)", fontSize: 10, style: { textAnchor: "middle" } }} />
                        <Tooltip {...chartTooltip} />
                        <Area type="stepAfter" dataKey="headcount" name="Occupancy (People)" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.25} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  {selected.events.length === 0 ? (
                    <p className="mt-3 text-sm text-muted-foreground">No events recorded yet.</p>
                  ) : (
                    <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto">
                      {selected.events.map((e) => (
                        <li key={e.id} className="glass flex items-center justify-between rounded-xl px-3 py-2 text-sm">
                          <span className="font-mono text-muted-foreground">{formatEventTime(e.timestamp).clock}</span>
                          <span className={e.status === "POWER_ON" ? "text-primary-bright" : "text-muted-foreground"}>{e.status === "POWER_ON" ? "Power ON" : e.status === "POWER_OFF" ? "Power OFF" : e.status}</span>
                          <span className="text-muted-foreground">{e.headcount} · {e.trigger}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <Button variant="outline" className="w-full" onClick={() => setSelectedId(null)}>Close</Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </PageFade>
  );
}
