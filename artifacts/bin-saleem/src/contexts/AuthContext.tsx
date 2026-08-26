import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "../lib/firebase";
import { upsertUser, getUser, updateUserPhone } from "../lib/firestoreService";
import type { UserRole } from "../types";

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  fsUser: { phone?: string; displayName?: string } | null;
  loading: boolean;
  isConfigured: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
  savePhone: (phone: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = "zzam8160@gmail.com";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [fsUser, setFsUser] = useState<{ phone?: string; displayName?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  async function loadUserRole(firebaseUser: User) {
    try {
      let userData = await getUser(firebaseUser.uid);
      if (!userData) {
        // First login — create user doc
        const defaultRole: UserRole = firebaseUser.email === ADMIN_EMAIL ? "ADMIN" : "CUSTOMER";
        await upsertUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName: firebaseUser.displayName || "",
          photoURL: firebaseUser.photoURL || "",
          role: defaultRole,
        });
        userData = await getUser(firebaseUser.uid);
      }
      const r = userData?.role || "CUSTOMER";
      // Always enforce ADMIN for the admin email
      const finalRole: UserRole = firebaseUser.email === ADMIN_EMAIL ? "ADMIN" : r;
      setRole(finalRole);
      setFsUser({ phone: userData?.phone, displayName: userData?.displayName });
    } catch (err) {
      console.error("Failed to load user role:", err);
      setRole(firebaseUser.email === ADMIN_EMAIL ? "ADMIN" : "CUSTOMER");
    }
  }

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    // Firebase can be slow on some mobile networks. Never block the first
    // screen while the session is being checked.
    const timeout = setTimeout(() => setLoading(false), 1200);

    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          setUser(result.user);
          await loadUserRole(result.user);
        }
      })
      .catch(() => {});

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false); // unblock UI immediately
      clearTimeout(timeout);
      if (currentUser) {
        // Give the user a route immediately. Firestore can fill in the real
        // role in the background without blocking the whole application.
        setRole(currentUser.email === ADMIN_EMAIL ? "ADMIN" : "CUSTOMER");
        // Load role in background — non-blocking
        loadUserRole(currentUser).catch(() => {
          setRole(currentUser.email === ADMIN_EMAIL ? "ADMIN" : "CUSTOMER");
        });
      } else {
        setRole(null);
        setFsUser(null);
      }
    });

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  const refreshRole = async () => {
    if (user) await loadUserRole(user);
  };

  const savePhone = async (phone: string) => {
    if (!user) return;
    await updateUserPhone(user.uid, phone);
    setFsUser((prev) => ({ ...prev, phone }));
  };

  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error("Firebase غير مُعدّ.");
    }
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      if (
        err?.code === "auth/popup-blocked" ||
        err?.code === "auth/cancelled-popup-request" ||
        err?.code === "auth/popup-closed-by-user"
      ) {
        try {
          await signInWithRedirect(auth, provider);
        } catch (rErr: any) {
          setAuthError("فشل تسجيل الدخول.");
          throw rErr;
        }
      } else {
        const msg =
          err?.code === "auth/unauthorized-domain"
            ? "النطاق غير مصرح به في Firebase Console."
            : err?.message || "فشل تسجيل الدخول.";
        setAuthError(msg);
        throw err;
      }
    }
  };

  const signOut = async () => {
    if (!isFirebaseConfigured || !auth) return;
    await firebaseSignOut(auth);
    setUser(null);
    setRole(null);
    setFsUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        fsUser,
        loading,
        isConfigured: isFirebaseConfigured,
        authError,
        signInWithGoogle,
        signOut,
        refreshRole,
        savePhone,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
