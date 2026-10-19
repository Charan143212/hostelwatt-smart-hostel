import type { LucideIcon } from "lucide-react";
import { ArrowDown, ArrowRight } from "lucide-react";
import { Reveal } from "@/components/PageFade";

export function SectionHead({ eyebrow, title, intro }: { eyebrow?: string; title: string; intro?: string }) {
  return (
    <div className="max-w-3xl">
      {eyebrow && <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary-bright">{eyebrow}</p>}
      <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
      {intro && <p className="mt-4 text-muted-foreground">{intro}</p>}
    </div>
  );
}

export type CardItem = { icon: LucideIcon; title: string; text: string; tag?: string };

export function CardGrid({ items, cols = 3 }: { items: CardItem[]; cols?: 2 | 3 | 4 | 5 }) {
  const grid = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4", 5: "sm:grid-cols-2 lg:grid-cols-5" }[cols];
  return (
    <div className={`mt-8 grid gap-5 ${grid}`}>
      {items.map((it, i) => (
        <Reveal key={it.title} delay={i * 0.06}>
          <div className="glass h-full rounded-2xl p-6">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
                <it.icon className="h-5 w-5 text-primary-bright" />
              </span>
              {it.tag && <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{it.tag}</span>}
            </div>
            <h3 className="mt-4 font-semibold">{it.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{it.text}</p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

/** Horizontal step flow on large screens, vertical on small screens. */
export function StepFlow({ steps }: { steps: { title: string; text?: string }[] }) {
  return (
    <div className="mt-8 flex flex-col items-stretch gap-2 lg:flex-row lg:items-stretch">
      {steps.map((s, i) => (
        <div key={s.title} className="flex flex-col items-center gap-2 lg:flex-1 lg:flex-row">
          <Reveal delay={i * 0.06} className="w-full lg:h-full">
            <div className="glass h-full w-full rounded-2xl p-5">
              <p className="font-mono text-xs text-primary-bright">{String(i + 1).padStart(2, "0")}</p>
              <h3 className="mt-1 text-sm font-semibold">{s.title}</h3>
              {s.text && <p className="mt-2 text-xs text-muted-foreground">{s.text}</p>}
            </div>
          </Reveal>
          {i < steps.length - 1 && (
            <>
              <ArrowDown className="h-4 w-4 shrink-0 text-primary-bright lg:hidden" />
              <ArrowRight className="hidden h-4 w-4 shrink-0 text-primary-bright lg:block" />
            </>
          )}
        </div>
      ))}
    </div>
  );
}

/** Compact vertical chain of mono labels. */
export function MiniChain({ items, highlightLast = true, muted = false }: { items: string[]; highlightLast?: boolean; muted?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      {items.map((t, i) => {
        const last = i === items.length - 1;
        const cls = last && highlightLast
          ? muted ? "bg-muted text-muted-foreground border-border" : "bg-primary text-primary-foreground border-transparent"
          : "bg-card text-foreground border-border";
        return (
          <div key={t + i} className="flex flex-col items-center gap-1.5">
            <span className={`rounded-lg border px-4 py-1.5 font-mono text-xs font-semibold ${cls}`}>{t}</span>
            {!last && <ArrowDown className="h-3.5 w-3.5 text-primary-bright" />}
          </div>
        );
      })}
    </div>
  );
}
