import { AppLayout } from "../components/layout/AppLayout";
import { useAuth } from "../contexts/AuthContext";
import { getUserOrders } from "../lib/firestoreService";
import { LogOut, Package, Shield, ScanLine, Truck, User, ChevronLeft, Loader2, Phone } from "lucide-react";
import { useState, useEffect } from "react";
import type { FSOrder } from "../types";
import type { UserRole } from "../types";

const STATUS_COLORS: Record<string, string> = {
  pending: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  accepted: "text-primary border-primary/30 bg-primary/10",
  delivering: "text-purple-400 border-purple-400/30 bg-purple-400/10",
  delivered: "text-secondary border-secondary/30 bg-secondary/10",
  cancelled: "text-destructive border-destructive/30 bg-destructive/10",
};

const STATUS_TEXT: Record<string, string> = {
  pending: "بانتظار المندوب",
  accepted: "تم القبول",
  delivering: "جاري التوصيل",
  delivered: "تم التوصيل",
  cancelled: "ملغي",
};

const ROLE_INFO: Record<UserRole, { label: string; icon: React.ElementType; color: string }> = {
  ADMIN: { label: "مدير النظام", icon: Shield, color: "text-red-400 border-red-400/30 bg-red-400/10" },
  DATA_ENTRY: { label: "مدخل بيانات", icon: ScanLine, color: "text-primary border-primary/30 bg-primary/10" },
  REPRESENTATIVE: { label: "مندوب توصيل", icon: Truck, color: "text-purple-400 border-purple-400/30 bg-purple-400/10" },
  CUSTOMER: { label: "عميل", icon: User, color: "text-muted-foreground border-border bg-card" },
};

export default function Profile() {
  const { user, role, fsUser, signOut } = useAuth();
  const [orders, setOrders] = useState<FSOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (!user) return;
    getUserOrders(user.uid)
      .then(setOrders)
      .catch(() => {})
      .finally(() => setLoadingOrders(false));
  }, [user]);

  const roleInfo = role ? ROLE_INFO[role] : ROLE_INFO["CUSTOMER"];
  const RoleIcon = roleInfo.icon;

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" });
    } catch { return dateStr; }
  };

  return (
    <AppLayout>
      <div className="p-4 pt-8 space-y-6">
        <h1 className="text-2xl font-black text-white">الملف الشخصي</h1>

        {/* Profile Card */}
        <div
          className="bg-card border border-border rounded-3xl p-6 flex flex-col items-center text-center relative overflow-hidden"
          style={{ boxShadow: "inset 0 1px 0 rgba(0,212,255,0.1)" }}
        >
          <div className="absolute top-0 w-full h-1/2 bg-gradient-to-b from-primary/8 to-transparent pointer-events-none" />

          {/* Avatar */}
          <div
            className="w-24 h-24 rounded-full overflow-hidden border-4 border-card mb-4 relative z-10"
            style={{ boxShadow: "0 0 0 2px hsl(190,100%,50%), 0 0 20px rgba(0,212,255,0.3)" }}
          >
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-black text-3xl">
                {user?.displayName?.charAt(0) || "U"}
              </div>
            )}
          </div>

          <h2 className="text-xl font-bold text-white relative z-10">{user?.displayName}</h2>
          <p className="text-sm text-muted-foreground mb-3 relative z-10">{user?.email}</p>

          {/* Phone */}
          {fsUser?.phone && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
              <Phone className="w-3.5 h-3.5" />
              <span className="font-mono">{fsUser.phone}</span>
            </div>
          )}

          {/* Role Badge */}
          <div className={`px-4 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${roleInfo.color}`}>
            <RoleIcon className="w-3.5 h-3.5" />
            {roleInfo.label}
          </div>
        </div>

        {/* Orders — only for customers */}
        {role === "CUSTOMER" && (
          <div>
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              طلباتي
            </h3>

            {loadingOrders ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground bg-card rounded-2xl border border-border">
                لا توجد طلبات سابقة
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-card border border-border rounded-xl p-4 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">{formatDate(order.createdAt)}</div>
                      <div className="font-bold text-white mb-2">{order.total.toFixed(2)} ر.س</div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[order.status] || STATUS_COLORS["pending"]}`}>
                          {STATUS_TEXT[order.status] || order.status}
                        </span>
                        {order.representativeName && (
                          <span className="text-[10px] text-muted-foreground">المندوب: {order.representativeName}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-muted-foreground">{order.items.length} منتج</p>
                      <ChevronLeft className="w-5 h-5 text-muted-foreground mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sign Out */}
        <button
          onClick={signOut}
          className="w-full bg-destructive/10 text-destructive border border-destructive/20 font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-destructive hover:text-white transition-all"
        >
          <LogOut className="w-5 h-5" />
          تسجيل الخروج
        </button>
      </div>
    </AppLayout>
  );
}
