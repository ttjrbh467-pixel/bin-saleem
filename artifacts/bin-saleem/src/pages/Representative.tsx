import { useState, useEffect } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { useAuth } from "../contexts/AuthContext";
import {
  subscribeOrders,
  acceptOrder,
  updateOrderStatus,
} from "../lib/firestoreService";
import type { FSOrder } from "../types";
import { motion, AnimatePresence } from "framer-motion";
import {
  Truck, Phone, MapPin, Check, Package, Clock, User,
  ChevronDown, ChevronUp, Loader2, Navigation
} from "lucide-react";

type Tab = "pending" | "my-orders";

const statusColors: Record<string, string> = {
  pending: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  accepted: "text-primary border-primary/30 bg-primary/10",
  delivering: "text-purple-400 border-purple-400/30 bg-purple-400/10",
  delivered: "text-secondary border-secondary/30 bg-secondary/10",
  cancelled: "text-destructive border-destructive/30 bg-destructive/10",
};

const statusText: Record<string, string> = {
  pending: "بانتظار المندوب",
  accepted: "تم القبول",
  delivering: "جاري التوصيل",
  delivered: "تم التوصيل",
  cancelled: "ملغي",
};

export default function Representative() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("pending");
  const [pendingOrders, setPendingOrders] = useState<FSOrder[]>([]);
  const [myOrders, setMyOrders] = useState<FSOrder[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeOrders((orders) => {
      setPendingOrders(orders);
    }, { status: "pending" });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeOrders((orders) => {
      setMyOrders(orders);
    }, { repId: user.uid });
    return unsub;
  }, [user]);

  const handleAccept = async (order: FSOrder) => {
    if (!user) return;
    setAcceptingId(order.id);
    try {
      await acceptOrder(order.id, user.uid, user.displayName || "مندوب");
    } catch (e) {
      console.error("Accept order error:", e);
    } finally {
      setAcceptingId(null);
    }
  };

  const handleStatusUpdate = async (orderId: string, status: FSOrder["status"]) => {
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, status);
    } finally {
      setUpdatingId(null);
    }
  };

  const openMap = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, "_blank");
  };

  const displayed = tab === "pending" ? pendingOrders : myOrders;

  return (
    <AppLayout>
      <div className="p-4 pt-8 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">لوحة المندوب</h1>
            <p className="text-xs text-muted-foreground mt-1">إدارة الطلبات والتوصيل</p>
          </div>
          <div
            className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center"
            style={{ boxShadow: "0 0 12px rgba(0,212,255,0.2)" }}
          >
            <Truck className="w-5 h-5 text-primary" />
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <div className="text-2xl font-black text-yellow-400">{pendingOrders.length}</div>
            <div className="text-xs text-muted-foreground mt-0.5">طلب بانتظار</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <div className="text-2xl font-black text-primary"
              style={{ textShadow: "0 0 10px rgba(0,212,255,0.6)" }}>
              {myOrders.filter((o) => o.status !== "delivered").length}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">طلباتي النشطة</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-card border border-border rounded-xl p-1">
          {[
            { key: "pending" as Tab, label: "الطلبات الجديدة", count: pendingOrders.length },
            { key: "my-orders" as Tab, label: "طلباتي", count: myOrders.length },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-1.5 ${
                tab === key
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              {label}
              {count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                  tab === key ? "bg-primary text-black" : "bg-border text-muted-foreground"
                }`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {displayed.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center py-16 text-center"
              >
                <div className="text-5xl mb-4">📦</div>
                <p className="text-muted-foreground font-medium">
                  {tab === "pending" ? "لا توجد طلبات جديدة" : "لا توجد طلبات محجوزة"}
                </p>
              </motion.div>
            ) : (
              displayed.map((order, idx) => {
                const isExpanded = expandedId === order.id;
                return (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.04 }}
                    className="bg-card border border-border rounded-2xl overflow-hidden"
                  >
                    {/* Order Header */}
                    <div
                      className="p-4 cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : order.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="font-bold text-white text-sm">{order.userName}</span>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                            <a
                              href={`tel:${order.userPhone}`}
                              className="text-primary text-sm font-mono hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {order.userPhone}
                            </a>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColors[order.status]}`}>
                              {statusText[order.status]}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">
                              #{order.id.slice(0, 6).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="text-left shrink-0">
                          <div className="font-black text-white text-lg">{order.total} ر.س</div>
                          <div className="text-xs text-muted-foreground">{order.items.length} منتج</div>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground mt-2 mr-auto" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground mt-2 mr-auto" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-border p-4 space-y-4">
                            {/* Items */}
                            <div>
                              <h4 className="text-xs font-bold text-muted-foreground mb-2">المنتجات</h4>
                              <div className="space-y-2">
                                {order.items.map((item, i) => (
                                  <div key={i} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                      {item.imageUrl && (
                                        <img src={item.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
                                      )}
                                      <span className="text-white">{item.productName}</span>
                                      <span className="text-muted-foreground">×{item.quantity}</span>
                                    </div>
                                    <span className="text-primary font-bold">
                                      {(item.price * item.quantity).toFixed(2)} ر.س
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Notes */}
                            {order.notes && (
                              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
                                <p className="text-xs text-yellow-300">{order.notes}</p>
                              </div>
                            )}

                            {/* Location Map */}
                            {order.location && (
                              <button
                                onClick={() => openMap(order.location!.lat, order.location!.lng)}
                                className="w-full flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl p-3 hover:bg-primary/10 transition-all"
                              >
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Navigation className="w-5 h-5 text-primary" />
                                </div>
                                <div className="text-right flex-1">
                                  <div className="font-bold text-white text-sm">اعرض الموقع على الخريطة</div>
                                  {order.location.address && (
                                    <div className="text-xs text-muted-foreground">{order.location.address}</div>
                                  )}
                                  <div className="text-xs text-muted-foreground font-mono">
                                    {order.location.lat.toFixed(4)}, {order.location.lng.toFixed(4)}
                                  </div>
                                </div>
                                <MapPin className="w-4 h-4 text-primary shrink-0" />
                              </button>
                            )}

                            {/* Action Buttons */}
                            {tab === "pending" && order.status === "pending" && (
                              <button
                                onClick={() => handleAccept(order)}
                                disabled={acceptingId === order.id}
                                className="w-full py-3 rounded-xl font-black text-sm bg-secondary/10 text-secondary border border-secondary/30 hover:bg-secondary/20 transition-all flex items-center justify-center gap-2"
                                style={{ boxShadow: "0 0 12px rgba(57,255,20,0.2)" }}
                              >
                                {acceptingId === order.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Check className="w-4 h-4" />
                                )}
                                قبول هذا الطلب
                              </button>
                            )}

                            {tab === "my-orders" && (
                              <div className="grid grid-cols-2 gap-2">
                                {order.status === "accepted" && (
                                  <button
                                    onClick={() => handleStatusUpdate(order.id, "delivering")}
                                    disabled={updatingId === order.id}
                                    className="py-2.5 rounded-xl font-bold text-sm bg-purple-500/10 text-purple-400 border border-purple-500/30 hover:bg-purple-500/20 transition-all flex items-center justify-center gap-1.5"
                                  >
                                    {updatingId === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                                    جاري التوصيل
                                  </button>
                                )}
                                {(order.status === "accepted" || order.status === "delivering") && (
                                  <button
                                    onClick={() => handleStatusUpdate(order.id, "delivered")}
                                    disabled={updatingId === order.id}
                                    className="py-2.5 rounded-xl font-bold text-sm bg-secondary/10 text-secondary border border-secondary/30 hover:bg-secondary/20 transition-all flex items-center justify-center gap-1.5"
                                  >
                                    {updatingId === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    تم التوصيل
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppLayout>
  );
}
