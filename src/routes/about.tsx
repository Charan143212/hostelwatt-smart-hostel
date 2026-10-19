import { createFileRoute } from "@tanstack/react-router";
import {
  Zap, DoorOpen, Hand, EyeOff, Gauge, Cpu, ShieldCheck, CircuitBoard, ScanLine, ToggleRight,
  Monitor, Activity, Building2, Users, LayoutDashboard, Network, Fingerprint, Layers, Target,
} from "lucide-react";
import { PageFade, Reveal } from "@/components/PageFade";
import { CardGrid, SectionHead, StepFlow } from "@/components/InfoBlocks";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — HostelWatt" },
      { name: "description", content: "What HostelWatt is: doorway occupancy sensing, ESP32 edge processing and automatic power control for smart hostels." },
      { property: "og:title", content: "About Us — HostelWatt" },
      { property: "og:description", content: "The problem, solution, hardware and vision behind HostelWatt's smart hostel energy system." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: About,
});

const problems = [
  { icon: Zap, title: "Wasted Energy", text: "Students leave rooms without switching off electrical loads, and the waste adds up across hundreds of rooms." },
  { icon: DoorOpen, title: "Empty Rooms", text: "Lights and other connected loads often stay active in rooms that nobody is using." },
  { icon: Hand, title: "Manual Control", text: "Relying on people to switch power off by hand is inconsistent and easy to forget." },
  { icon: EyeOff, title: "Limited Visibility", text: "Administrators have little insight into which rooms are occupied and which are drawing power." },
];

const solution = [
  { title: "Occupancy Detection", text: "Two doorway ToF sensors detect the direction of movement and determine whether someone enters or leaves the room." },
  { title: "ESP32 Edge Processing", text: "The ESP32 processes sensor events locally and maintains the room occupancy state." },
  { title: "Occupancy Decision", text: "The system updates the room occupancy count using directional entry and exit detection." },
  { title: "Automatic Power Control", text: "When the room becomes vacant, connected power can be switched off automatically." },
  { title: "Energy Saving", text: "Reducing unnecessary operation of electrical loads helps minimize avoidable energy consumption." },
  { title: "Dashboard Monitoring", text: "Students and administrators can view relevant room status and energy information through the HostelWatt interface." },
];

const edge = [
  { icon: Gauge, title: "Fast Response", text: "Occupancy events can be processed locally with minimal delay." },
  { icon: Cpu, title: "Local Intelligence", text: "The ESP32 maintains the room state and performs the core occupancy logic at the edge." },
  { icon: ShieldCheck, title: "Resilient Operation", text: "Core sensing and decision-making do not need to depend entirely on a remote server." },
];

const hardware = [
  { icon: Cpu, title: "ESP32", text: "Main edge controller responsible for sensor processing, occupancy logic and system control." },
  { icon: ScanLine, title: "VL53L0X ToF Sensors", text: "Two time-of-flight distance sensors are positioned at the doorway to detect movement direction." },
  { icon: ToggleRight, title: "Relay Module", text: "Provides electrical switching control for the connected power circuit." },
  { icon: Monitor, title: "16×2 I2C LCD", text: "Provides a local display interface for room/system information." },
  { icon: CircuitBoard, title: "CT Sensor", text: "Used as part of the project's electrical monitoring setup where supported by the implementation." },
];

const designed = [
  { icon: Users, title: "Room-level occupancy" },
  { icon: Zap, title: "Automatic power management" },
  { icon: Activity, title: "Student visibility" },
  { icon: LayoutDashboard, title: "Administrator monitoring" },
  { icon: Building2, title: "Hostel-wise organization" },
  { icon: Fingerprint, title: "Room-level hardware identification" },
  { icon: Layers, title: "Scalable deployment across multiple hostel blocks" },
];

const hostels = ["MH1", "MH2", "MH3", "MH4", "MH5", "MH6", "MH7", "LH1", "LH2", "LH3", "LH4"];

function About() {
  return (
    <PageFade>
      <section className="mx-auto max-w-6xl px-4 py-24">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary-bright">About Us</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">Energy that switches off when you leave.</h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">HostelWatt brings together occupancy sensing, ESP32 edge processing and automated power control so hostel rooms use electricity only when they need it.</p>

        {/* A — What is HostelWatt */}
        <div className="mt-20 grid gap-8 lg:grid-cols-2">
          <SectionHead eyebrow="Overview" title="What is HostelWatt?" />
          <Reveal>
            <div className="space-y-4 text-muted-foreground">
              <p>HostelWatt is a smart hostel energy and occupancy management system designed to reduce unnecessary electricity consumption in hostel rooms. It combines doorway occupancy sensing, ESP32 edge processing and automatic power control to ensure that room power is used intelligently based on whether the room is occupied.</p>
              <p>The system is designed around a simple principle: when a room is occupied, essential electrical loads can remain active; when the room becomes vacant, unnecessary power can be automatically switched off. This helps reduce energy waste without requiring students to manually manage electrical loads.</p>
            </div>
          </Reveal>
        </div>

        {/* B — Problem */}
        <div className="mt-24">
          <SectionHead eyebrow="Why it matters" title="The Problem" intro="Small amounts of wasted power in individual rooms quickly add up across an entire hostel." />
          <CardGrid items={problems} cols={4} />
        </div>

        {/* C — Solution */}
        <div className="mt-24">
          <SectionHead eyebrow="How we fix it" title="Our Solution" intro="HostelWatt connects occupancy sensing, local edge processing and automated power control into one system." />
          <StepFlow steps={solution} />
        </div>

        {/* D — Edge */}
        <div className="mt-24">
          <SectionHead eyebrow="Architecture" title="Why Edge Processing?" intro="HostelWatt performs important occupancy decisions directly on the ESP32. This reduces dependence on continuous cloud processing and allows the system to respond locally to sensor events." />
          <CardGrid items={edge} cols={3} />
        </div>

        {/* E — Hardware */}
        <div className="mt-24">
          <SectionHead eyebrow="Hardware" title="Built Around Practical Hardware" intro="Each room controller is built from affordable, widely available components." />
          <CardGrid items={hardware} cols={5} />
        </div>

        {/* F — Designed for hostels */}
        <div className="mt-24">
          <SectionHead eyebrow="Purpose-built" title="Designed for Smart Hostels" intro="HostelWatt is shaped around the way hostels are actually organised and run." />
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {designed.map((d, i) => (
              <Reveal key={d.title} delay={i * 0.04}>
                <div className="glass flex h-full items-center gap-3 rounded-xl p-4">
                  <d.icon className="h-5 w-5 shrink-0 text-primary-bright" />
                  <span className="text-sm font-medium">{d.title}</span>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <div className="glass mt-6 rounded-2xl p-6">
              <p className="flex items-center gap-2 text-sm font-semibold"><Network className="h-4 w-4 text-primary-bright" /> Supported hostel blocks</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {hostels.map((h) => (
                  <span key={h} className="rounded-lg border border-border bg-accent px-3 py-1 font-mono text-sm text-accent-foreground">{h}</span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        {/* G — Vision */}
        <Reveal>
          <div className="glass mt-24 rounded-3xl p-8 md:p-12">
            <Target className="h-7 w-7 text-primary-bright" />
            <h2 className="mt-4 text-2xl font-bold tracking-tight md:text-3xl">Our Vision</h2>
            <p className="mt-4 max-w-3xl text-lg">HostelWatt aims to make hostel infrastructure smarter, more efficient and easier to manage by connecting physical sensing with intelligent automation.</p>
            <p className="mt-4 max-w-3xl text-muted-foreground">The long-term vision is to create a scalable smart-campus infrastructure where occupancy, energy usage and automated control work together to reduce avoidable energy consumption while improving operational visibility.</p>
          </div>
        </Reveal>
      </section>
    </PageFade>
  );
}
