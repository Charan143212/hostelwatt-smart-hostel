import { Home } from "lucide-react";

export function Logo() {
  return (
    <span className="glass inline-flex items-center gap-2.5 rounded-xl px-2.5 py-1.5">
      <span className="grid h-8 w-8 place-items-center rounded-lg border border-primary/50 bg-primary/10 glow">
        <Home className="h-4 w-4 text-primary-bright" />
      </span>
      <span className="text-lg font-bold tracking-tight">
        Hostel<span className="text-primary-bright">Watt</span>
      </span>
    </span>
  );
}
