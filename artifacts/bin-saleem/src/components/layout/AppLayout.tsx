import { motion } from "framer-motion";
import { BottomNav } from "./BottomNav";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] w-full bg-background flex flex-col relative overflow-hidden">
      <div className="fixed top-0 left-0 w-72 h-72 rounded-full bg-secondary/10 blur-3xl -translate-x-1/3 -translate-y-1/3 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-80 h-80 rounded-full bg-primary/10 blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />
      
      <main className="flex-1 w-full max-w-lg mx-auto relative pb-[calc(7rem+env(safe-area-inset-bottom))]">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="min-h-full"
        >
          {children}
        </motion.div>
      </main>
      <BottomNav />
    </div>
  );
}
