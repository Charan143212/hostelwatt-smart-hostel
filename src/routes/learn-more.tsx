import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight, ScanLine, Cpu, Power, Users, Zap, Leaf, Clock, Building2, DoorOpen, Activity, LineChart,
  Bot, Eye, Globe2, BarChart3, LayoutDashboard, Sparkles, TrendingUp,
} from "lucide-react";
import { PageFade, Reveal } from "@/components/PageFade";
import { CardGrid, MiniChain, SectionHead, StepFlow } from "@/components/InfoBlocks";

export const Route = createFileRoute("/learn-more")({
  head: () => ({
    meta: [
      { title: "How It Works — HostelWatt System Architecture" },
      { name: "description", content: "Inside HostelWatt: VL53L0X doorway sensing, ESP32 occupancy logic, automatic power control and student/admin dashboards." },
      { property: "og:title", content: "How It Works — HostelWatt" },
      { property: "og:description", content: "System architecture, occupancy detection logic and future scope of HostelWatt." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LearnMore,
});

const pipeline = [
  ["Sense", "Two VL53L0X time-of-flight sensors monitor movement through the doorway. Their sequence of activation determines whether a person is entering or leaving."],
  ["Process", "The ESP32 receives the sensor events and processes them locally."],
  ["Decide", "The occupancy state machine updates the room's occupancy count based on the detected entry or exit sequence."],
  ["Control", "When the room becomes vacant, the system can switch the connected power circuit off through the relay."],
  ["Monitor", "Relevant room status and energy-saving information can be presented through the HostelWatt student and administrator dashboards."],
];

const metrics = [
  ["Average room idle load eliminated", "62 W"],
  ["Daily savings per room", "1.4 kWh"],
  ["Monthly savings (100 rooms)", "≈ ₹33,600"],
  ["Payback period", "≈ 5 months"],
];

const core = [
  { icon: ScanLine, title: "Sensor Processing", text: "Reads both doorway sensors and turns their signals into entry and exit events." },
  { icon: Cpu, title: "Occupancy Logic", text: "Runs the state machine that keeps the room's occupancy count up to date." },
  { icon: Power, title: "Power Control", text: "Keeps the connected circuit on while occupied and switches it off when vacant." },
];

const studentItems = [
  { icon: Users, title: "Occupancy", text: "How many people are currently in the room." },
  { icon: Power, title: "Power Status", text: "Whether room power is currently ON or OFF." },
  { icon: Leaf, title: "Energy Saved Today", text: "Estimated energy avoided in the room today." },
  { icon: Clock, title: "Last Activity", text: "When the room last saw an entry or exit." },
];

const adminItems = [
  { icon: Building2, title: "Hostel Selection", text: "Switch between configured hostel blocks." },
  { icon: DoorOpen, title: "Room Monitoring", text: "See every room in the selected hostel at a glance." },
  { icon: Users, title: "Occupancy Status", text: "Know which rooms are occupied or vacant." },
  { icon: Power, title: "Power Status", text: "See which rooms currently have power ON." },
  { icon: Activity, title: "Energy Information", text: "Room-level energy figures for facility review." },
  { icon: LineChart, title: "Power History", text: "A 24-hour view of each room's power trend." },
];

const benefits = [
  { icon: Zap, title: "Energy Efficiency", text: "Reduce avoidable power consumption in vacant rooms." },
  { icon: Bot, title: "Automation", text: "Reduce dependence on manual power management." },
  { icon: Cpu, title: "Edge Intelligence", text: "Process occupancy events locally using the ESP32." },
  { icon: Eye, title: "Visibility", text: "Give students and administrators a clearer view of room status." },
];

const future = [
  { icon: Globe2, title: "Campus-Wide Scaling", text: "Expand from individual rooms to larger smart-campus deployments.", tag: "Future" },
  { icon: BarChart3, title: "Advanced Analytics", text: "Use historical data to identify energy-saving patterns and opportunities.", tag: "Future" },
  { icon: LayoutDashboard, title: "Centralized Monitoring", text: "Provide broader hostel-level and campus-level operational visibility.", tag: "Future" },
  { icon: Sparkles, title: "Smarter Automation", text: "Introduce more intelligent control strategies based on occupancy patterns and usage behavior.", tag: "Future" },
  { icon: TrendingUp, title: "Predictive Insights", text: "Use historical system data to identify abnormal patterns and potential maintenance needs.", tag: "Future" },
];

const deviceIds = ["ESP32_MH1_ROOM_304", "ESP32_MH2_ROOM_204", "ESP32_LH1_ROOM_301"];

function LearnMore() {
  return (
    <PageFade>
      <section className="mx-auto max-w-6xl px-4 py-24">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary-bright">System Architecture</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">From doorway to dashboard.</h1>

        {/* A — How it works */}
        <h2 className="mt-14 text-2xl font-semibold">How HostelWatt Works</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-5">
          {pipeline.map(([t, d], i) => (
            <Reveal key={t} delay={i * 0.08}>
              <div className="glass relative h-full rounded-2xl p-5">
                <p className="font-mono text-xs text-primary-bright">0{i + 1}</p>
                <h3 className="mt-2 font-semibold">{t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{d}</p>
                {i < 4 && <ArrowRight className="absolute -right-3 top-1/2 hidden h-5 w-5 text-primary-bright md:block" />}
              </div>
            </Reveal>
          ))}
        </div>

        {/* B — Occupancy detection */}
        <div className="mt-24">
          <SectionHead eyebrow="Detection logic" title="How Occupancy Detection Works" intro="Two sensors sit side by side in the doorway. The order in which they are triggered tells the ESP32 which way a person is moving." />
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <Reveal>
              <div className="glass h-full rounded-2xl p-6">
                <p className="text-center text-sm font-semibold">Person enters</p>
                <div className="mt-4"><MiniChain items={["Sensor A", "Sensor B", "ENTRY", "Occupancy +1"]} /></div>
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="glass h-full rounded-2xl p-6">
                <p className="text-center text-sm font-semibold">Person exits</p>
                <div className="mt-4"><MiniChain items={["Sensor B", "Sensor A", "EXIT", "Occupancy -1"]} /></div>
              </div>
            </Reveal>
          </div>
          <p className="mt-5 rounded-xl border border-border bg-accent px-5 py-3 text-sm text-accent-foreground">The occupancy count is bounded at zero so that an exit event cannot produce a negative room occupancy.</p>
        </div>

        {/* C — Edge controller */}
        <div className="mt-24">
          <SectionHead eyebrow="Edge controller" title="The ESP32 at the Core" intro="The ESP32 acts as the local controller of the room. It receives sensor events, executes the occupancy state machine, maintains room state and controls the connected power circuit." />
          <CardGrid items={core} cols={3} />
        </div>

        {/* D — Power automation */}
        <div className="mt-24 grid items-center gap-8 lg:grid-cols-2">
          <SectionHead eyebrow="Automation" title="Occupancy-Based Power Automation" intro="HostelWatt links room occupancy with automatic power management. When occupancy is detected, the room can remain powered. When the occupancy state reaches zero, unnecessary connected power can be switched off." />
          <div className="grid grid-cols-2 gap-4">
            <Reveal><div className="glass rounded-2xl p-6"><MiniChain items={["OCCUPIED", "POWER ON"]} /></div></Reveal>
            <Reveal delay={0.08}><div className="glass rounded-2xl p-6"><MiniChain items={["VACANT", "POWER OFF"]} muted /></div></Reveal>
          </div>
        </div>

        {/* E — Student */}
        <div className="mt-24">
          <SectionHead eyebrow="Student experience" title="Student Dashboard" intro="Students receive a simplified view focused on the information that matters to them. The student interface avoids unnecessary hardware-level information and focuses on understandable room status." />
          <CardGrid items={studentItems} cols={4} />
        </div>

        {/* F — Admin */}
        <div className="mt-24">
          <SectionHead eyebrow="Admin experience" title="Admin Dashboard" intro="Administrators can monitor hostel rooms from a centralized interface and view room-level status across the configured hostel infrastructure. It is intended for facility-level monitoring rather than exposing low-level hardware details." />
          <CardGrid items={adminItems} cols={3} />
        </div>

        {/* G — Hostel-wide */}
        <div className="mt-24">
          <SectionHead eyebrow="Scale" title="From One Room to an Entire Hostel" intro="HostelWatt is structured so that individual room controllers can be associated with specific hostel blocks and rooms." />
          <Reveal>
            <div className="glass mt-8 rounded-2xl p-6">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Example hardware identifiers</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {deviceIds.map((id) => (
                  <code key={id} className="break-all rounded-lg border border-border bg-accent px-3 py-1.5 font-mono text-sm text-accent-foreground">{id}</code>
                ))}
              </div>
              <p className="mt-4 text-xs text-muted-foreground">Format: ESP32_&lt;HOSTEL&gt;_ROOM_&lt;NUMBER&gt;. These are illustrative examples of how controllers are identified.</p>
            </div>
          </Reveal>
        </div>

        {/* H — Data flow */}
        <div className="mt-24">
          <SectionHead eyebrow="Data flow" title="How Data Moves Through the System" />
          <StepFlow steps={[{ title: "ToF Sensors" }, { title: "ESP32" }, { title: "Occupancy State" }, { title: "Power Control" }, { title: "Room Status" }, { title: "HostelWatt Dashboard" }]} />
          <p className="mt-5 text-sm text-muted-foreground">Sensor events are processed at the room controller, converted into an occupancy state and used to drive automated control and monitoring.</p>
        </div>

        {/* I — Benefits */}
        <div className="mt-24">
          <SectionHead eyebrow="Benefits" title="Why HostelWatt?" />
          <CardGrid items={benefits} cols={4} />
        </div>

        <h2 className="mt-24 text-2xl font-semibold">Energy conservation metrics</h2>
        <div className="mt-6 divide-y divide-border rounded-2xl border border-border">
          {metrics.map(([l, v]) => (
            <div key={l} className="flex items-center justify-between gap-4 px-6 py-4">
              <span className="text-muted-foreground">{l}</span>
              <span className="font-mono text-lg font-semibold text-primary-bright">{v}</span>
            </div>
          ))}
        </div>

        {/* J — Future */}
        <div className="mt-24">
          <SectionHead eyebrow="Future scope" title="Future Scope" intro="These directions are planned ideas, not features that exist today." />
          <CardGrid items={future} cols={3} />
        </div>
      </section>
    </PageFade>
  );
}
