import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ScanLine, Gauge, Power, Users, Zap, ArrowRight } from "lucide-react";
import hero from "@/assets/hostel-room.png.asset.json";
import { Button } from "@/components/ui/button";
import { PageFade, Reveal } from "@/components/PageFade";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HostelWatt — Smart Hostel Energy & Occupancy System" },
      { name: "description", content: "Real-time dual laser occupancy tracking and automated load shedding for hostels, powered by ESP32 edge processing." },
      { property: "og:title", content: "HostelWatt — Smart Hostel Energy & Occupancy System" },
      { property: "og:description", content: "Automated occupancy sensing and energy savings for modern hostels." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const features = [
  { icon: ScanLine, title: "Dual VL53L0X Laser Tracking", text: "Two time-of-flight sensors at the doorway detect direction of movement to keep an exact headcount." },
  { icon: Gauge, title: "SCT-013 Power Analytics", text: "Non-invasive current transformers stream RMS current and wattage every second." },
  { icon: Power, title: "Automated Relay Cutoff", text: "When a room goes empty, the ESP32 cuts lights, fans and sockets instantly — no human needed." },
];

function Index() {
  return (
    <PageFade>
      <section className="relative isolate overflow-hidden">
        <img src={hero.url} alt="Hostel dormitory room with bunk beds" className="absolute inset-0 -z-20 h-full w-full object-cover" />
        <div className="hero-overlay absolute inset-0 -z-10" />
        <div className="mx-auto flex min-h-[88vh] max-w-7xl flex-col justify-center px-4 py-24">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-5 font-mono text-xs uppercase tracking-[0.3em] text-primary-bright">Occupancy · Energy · Automation</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="max-w-4xl text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
            Smart Energy Management & <span className="text-primary-bright">Automated Occupancy Sensing</span> for Modern Hostels
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="mt-6 max-w-2xl text-lg text-muted-foreground">
            Real-time dual laser occupancy tracking and automated load shedding powered by ESP32 edge processing.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-10 flex flex-wrap gap-4">
            <Button asChild size="lg" className="glow"><Link to="/student">Explore Student Portal <ArrowRight /></Link></Button>
            <Button asChild size="lg" variant="outline" className="glass hover:bg-card"><Link to="/admin">Facility Admin Login</Link></Button>
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
          className="glass absolute bottom-8 right-4 hidden rounded-xl px-5 py-3 font-mono text-sm md:flex md:items-center md:gap-4">
          <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-primary-bright" /> Occupancy: 02</span>
          <span className="h-4 w-px bg-border" />
          <span className="flex items-center gap-1.5"><Zap className="h-4 w-4 text-primary-bright" /> Load: 48.5 W</span>
          <span className="h-4 w-px bg-border" />
          <span className="flex items-center gap-1.5"><Power className="h-4 w-4 text-primary-bright" /> Power: <span className="text-primary-bright">ON</span></span>
        </motion.div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-24">
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.1}>
              <div className="glass h-full rounded-2xl p-7 transition-transform hover:-translate-y-1">
                <span className="grid h-11 w-11 place-items-center rounded-xl border border-primary/50 bg-primary/10 glow"><f.icon className="h-5 w-5 text-primary-bright" /></span>
                <h3 className="mt-5 text-xl font-semibold">{f.title}</h3>
                <p className="mt-2 text-muted-foreground">{f.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-16 grid gap-6 rounded-2xl border border-border p-8 md:grid-cols-4 grid-bg">
          {[["38%", "Avg. energy reduction"], ["1.2 t", "CO₂ avoided / year"], ["<200 ms", "Relay response"], ["24/7", "Edge monitoring"]].map(([v, l]) => (
            <div key={l}><p className="font-mono text-3xl font-bold text-primary-bright">{v}</p><p className="mt-1 text-sm text-muted-foreground">{l}</p></div>
          ))}
        </Reveal>
      </section>
    </PageFade>
  );
}
