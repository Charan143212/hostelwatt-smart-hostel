import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp } from "lucide-react";

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="flex h-16 items-center justify-center px-4">
      <AnimatePresence>
        {visible && (
          <motion.button
            type="button"
            aria-label="Back to top"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25 }}
            className="glass inline-flex items-center gap-2 rounded-full border border-primary/50 px-5 py-2 text-sm text-foreground transition-shadow hover:shadow-[0_0_15px_var(--primary)]"
          >
            <ArrowUp className="h-4 w-4 text-primary-bright" /> Back to Top
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
