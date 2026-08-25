import { motion } from "framer-motion";
import { BottomNav } from "./BottomNav";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] w-full bg-background flex flex-col relative overflow-hidden">
      {/* Abstract background elements */}
      <div className="fixed top-0 left-0 w-full h-[300px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[300px] h-[300px] bg-secondary/5 rounded-full blur-[120px] translate-y-1/4 pointer-events-none" />
      
      <main className="flex-1 w-full max-w-md mx-auto relative pb-20">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="h-full"
        >
          {children}
        </motion.div>
      </main>
      <BottomNav />
    </div>
  );
}
