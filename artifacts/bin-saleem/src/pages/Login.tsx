import { useAuth } from "../contexts/AuthContext";
import { Redirect } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import logoUrl from "@assets/1024_1787703636395.png";
import { FcGoogle } from "react-icons/fc";
import { Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import { useState } from "react";

export default function Login() {
  const { user, signInWithGoogle, role, loading, authError } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Role-based redirect after login
  if (user && role) {
    if (role === "ADMIN") return <Redirect to="/admin" />;
    if (role === "DATA_ENTRY") return <Redirect to="/data-entry" />;
    if (role === "REPRESENTATIVE") return <Redirect to="/representative" />;
    return <Redirect to="/home" />;
  }

  // User is logged in but role hasn't loaded yet from Firestore
  if (user && !role) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background gap-4">
        <div
          className="w-14 h-14 rounded-full border-2 border-t-primary border-r-primary border-b-transparent border-l-transparent animate-spin"
          style={{ boxShadow: "0 0 20px rgba(0,212,255,0.4)" }}
        />
        <p className="text-primary font-bold text-sm" style={{ textShadow: "0 0 8px rgba(0,212,255,0.5)" }}>
          جاري التحقق من الحساب...
        </p>
      </div>
    );
  }

  const handleSignIn = async () => {
    try {
      setLocalError(null);
      setIsSigningIn(true);
      await signInWithGoogle();
    } catch (e: any) {
      setIsSigningIn(false);
      if (e?.code !== "auth/popup-closed-by-user") {
        setLocalError(authError || "حدث خطأ أثناء تسجيل الدخول. حاول مرة أخرى.");
      }
    }
  };

  const displayError = localError || authError;

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-background relative overflow-hidden px-6" dir="rtl">
      {/* Animated background orbs */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <motion.div
          className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full"
          style={{ background: "radial-gradient(circle, hsla(39,96%,51%,0.22) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full"
          style={{ background: "radial-gradient(circle, hsla(164,72%,31%,0.16) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full"
          style={{ background: "radial-gradient(circle, hsla(45,100%,50%,0.05) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="z-10 w-full max-w-sm flex flex-col items-center"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-44 h-44 rounded-[2rem] overflow-hidden mb-6 bg-card p-2"
          style={{
            border: "1px solid hsla(39,96%,51%,0.55)",
            boxShadow: "0 18px 45px hsla(165,48%,19%,0.18)",
          }}
        >
          <img src={logoUrl} alt="Bin Saleem Supermarket" className="w-full h-full object-contain rounded-2xl" />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-black text-white mb-1 text-center"
          style={{ color: "hsl(165,48%,19%)" }}
        >
          سوق بن سليم
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-sm font-medium text-center mb-3"
          style={{ color: "hsl(164,72%,31%)" }}
        >
          BIN SALEEM SUPERMARKET
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="text-muted-foreground text-center mb-10 text-sm"
        >
          تجربة تسوق رقمية فاخرة
        </motion.p>

        {/* Sign in button */}
        <motion.button
          data-testid="button-google-signin"
          onClick={handleSignIn}
          disabled={isSigningIn}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full relative overflow-hidden rounded-2xl p-[1px] mb-4 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
             background: "linear-gradient(135deg, hsl(164,72%,31%), hsl(39,96%,51%), hsl(164,72%,31%))",
            backgroundSize: "200% 200%",
          }}
        >
           <div className="w-full rounded-2xl bg-card px-6 py-4 flex items-center justify-center gap-3">
            {isSigningIn ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: "hsl(190,100%,50%)" }} />
                <span className="font-bold text-base text-white">جارٍ تسجيل الدخول...</span>
              </>
            ) : (
              <>
                <FcGoogle className="w-6 h-6 flex-shrink-0" />
                <span className="font-bold text-base text-white">المتابعة باستخدام جوجل</span>
              </>
            )}
          </div>
        </motion.button>

        {/* Error */}
        <AnimatePresence>
          {displayError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full rounded-xl p-3 flex items-start gap-2 mb-4"
              style={{ background: "hsla(0,100%,50%,0.1)", border: "1px solid hsla(0,100%,50%,0.3)" }}
            >
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-400">{displayError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Security note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-2 mt-2"
        >
          <ShieldCheck className="w-4 h-4 text-muted-foreground" />
          <p className="text-xs text-muted-foreground text-center">تسجيل دخول آمن عبر حساب جوجل</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
