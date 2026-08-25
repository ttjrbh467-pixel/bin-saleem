import { AppLayout } from "../components/layout/AppLayout";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { createOrder } from "../lib/firestoreService";
import { Minus, Plus, Trash2, Loader2, CheckCircle2, Phone, MapPin, Navigation, ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

type Step = "cart" | "checkout" | "success";

export default function Cart() {
  const { items, updateQuantity, removeFromCart, totalPrice, clearCart } = useCart();
  const { user, fsUser, savePhone } = useAuth();
  const [step, setStep] = useState<Step>("cart");
  const [phone, setPhone] = useState(fsUser?.phone || "");
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState("");

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("المتصفح لا يدعم تحديد الموقع");
      return;
    }
    setGettingLocation(true);
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        let address = "";
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ar`
          );
          const data = await res.json();
          address = data.display_name || "";
        } catch {}
        setLocation({ lat, lng, address });
        setGettingLocation(false);
      },
      (err) => {
        setLocationError("تعذّر تحديد الموقع. تأكد من منح الصلاحية.");
        setGettingLocation(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handlePlaceOrder = async () => {
    if (!user) return;
    if (!phone.trim()) {
      setPlaceError("يرجى إدخال رقم الهاتف");
      return;
    }
    setPlacing(true);
    setPlaceError("");
    try {
      // Save phone for future
      if (phone !== fsUser?.phone) {
        await savePhone(phone.trim());
      }
      await createOrder({
        userId: user.uid,
        userName: user.displayName || "عميل",
        userPhone: phone.trim(),
        userEmail: user.email || "",
        items: items.map((i) => ({
          productId: i.id,
          productName: i.nameAr,
          price: i.price,
          quantity: i.quantity,
          imageUrl: i.imageUrl,
        })),
        total: totalPrice,
        status: "pending",
        location: location || undefined,
        notes: notes.trim() || undefined,
        representativeId: undefined,
        representativeName: undefined,
      });
      clearCart();
      setStep("success");
    } catch (e: any) {
      setPlaceError("حدث خطأ أثناء إرسال الطلب. حاول مرة أخرى.");
    } finally {
      setPlacing(false);
    }
  };

  // ── SUCCESS ──
  if (step === "success") {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="w-24 h-24 rounded-full bg-secondary/20 flex items-center justify-center mb-6 border border-secondary"
            style={{ boxShadow: "0 0 30px rgba(57,255,20,0.4)" }}
          >
            <CheckCircle2 className="w-12 h-12 text-secondary" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-black text-white mb-2"
          >
            تم استلام طلبك! 🎉
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground mb-2"
          >
            سيتواصل معك المندوب قريباً.
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-sm text-muted-foreground mb-8 font-mono"
          >
            📞 {phone}
          </motion.p>
          <button
            onClick={() => setStep("cart")}
            className="bg-card border border-border text-white px-8 py-3 rounded-xl font-bold hover:border-primary/50 transition-colors"
          >
            العودة للتسوق
          </button>
        </div>
      </AppLayout>
    );
  }

  // ── CHECKOUT STEP ──
  if (step === "checkout") {
    return (
      <AppLayout>
        <div className="p-4 pt-8 space-y-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setStep("cart")}
              className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-white transition-colors"
            >
              ‹
            </button>
            <h1 className="text-xl font-black text-white">تفاصيل التوصيل</h1>
          </div>

          {/* Order Summary */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
            <h3 className="text-sm font-bold text-muted-foreground mb-3">ملخص الطلب</h3>
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
                  )}
                  <span className="text-white">{item.nameAr}</span>
                  <span className="text-muted-foreground">×{item.quantity}</span>
                </div>
                <span className="text-primary font-bold">{(item.price * item.quantity).toFixed(2)} ر.س</span>
              </div>
            ))}
            <div className="border-t border-border pt-2 flex items-center justify-between">
              <span className="font-bold text-white">الإجمالي</span>
              <span className="text-xl font-black text-primary" style={{ textShadow: "0 0 8px rgba(0,212,255,0.5)" }}>
                {totalPrice.toFixed(2)} ر.س
              </span>
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-muted-foreground flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              رقم الهاتف *
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05XXXXXXXX"
              dir="ltr"
              className="w-full bg-card border border-border rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary transition-all placeholder:text-muted-foreground font-mono text-lg"
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-muted-foreground flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              موقع التوصيل
            </label>
            {location ? (
              <div
                className="bg-primary/5 border border-primary/30 rounded-xl p-4 flex items-center gap-3"
                style={{ boxShadow: "0 0 12px rgba(0,212,255,0.1)" }}
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Navigation className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-primary mb-0.5">تم تحديد الموقع ✓</p>
                  {location.address && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{location.address}</p>
                  )}
                  <p className="text-xs text-muted-foreground font-mono">{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</p>
                </div>
                <button
                  onClick={() => setLocation(null)}
                  className="text-muted-foreground hover:text-destructive transition-colors text-xs"
                >
                  حذف
                </button>
              </div>
            ) : (
              <button
                onClick={handleGetLocation}
                disabled={gettingLocation}
                className="w-full py-3 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 text-primary font-bold flex items-center justify-center gap-2 hover:bg-primary/10 transition-all disabled:opacity-60"
              >
                {gettingLocation ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> جاري تحديد الموقع...</>
                ) : (
                  <><Navigation className="w-4 h-4" /> تحديد موقعي الحالي</>
                )}
              </button>
            )}
            {locationError && <p className="text-xs text-destructive">{locationError}</p>}
            <p className="text-xs text-muted-foreground">اختياري — يساعد المندوب في الوصول إليك</p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-muted-foreground">ملاحظات</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أي تعليمات خاصة للمندوب..."
              rows={3}
              className="w-full bg-card border border-border rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary transition-all placeholder:text-muted-foreground resize-none"
            />
          </div>

          {placeError && (
            <p className="text-destructive text-sm font-medium bg-destructive/10 border border-destructive/30 rounded-xl p-3">
              {placeError}
            </p>
          )}

          {/* Submit */}
          <button
            onClick={handlePlaceOrder}
            disabled={placing}
            className="w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, hsl(110,100%,34%), hsl(110,100%,44%))",
              boxShadow: "0 0 24px rgba(57,255,20,0.35)",
              color: "#000",
            }}
          >
            {placing ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> جاري إرسال الطلب...</>
            ) : (
              <><CheckCircle2 className="w-5 h-5" /> تأكيد وإرسال الطلب</>
            )}
          </button>
        </div>
      </AppLayout>
    );
  }

  // ── CART STEP ──
  return (
    <AppLayout>
      <div className="p-4 pt-8 h-full flex flex-col">
        <h1 className="text-2xl font-black text-white mb-6">سلة المشتريات</h1>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 rounded-full bg-card border border-border flex items-center justify-center mb-4">
              <ShoppingCart className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold text-white mb-1">السلة فارغة</h2>
            <p className="text-muted-foreground text-sm">أضف بعض المنتجات لتبدأ التسوق</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto -mx-4 px-4 pb-36">
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex gap-4 bg-card border border-border rounded-2xl p-3 mb-3"
                  >
                    <div className="w-20 h-20 rounded-xl bg-background overflow-hidden shrink-0">
                      <img
                        src={item.imageUrl || "https://via.placeholder.com/80"}
                        alt={item.nameAr}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/80"; }}
                      />
                    </div>
                    <div className="flex-1 flex flex-col py-1">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-white text-sm line-clamp-2 flex-1">{item.nameAr}</h3>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-destructive p-1 bg-destructive/10 rounded-md shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="mt-auto flex items-center justify-between">
                        <span className="font-black text-primary" style={{ textShadow: "0 0 6px rgba(0,212,255,0.4)" }}>
                          {(item.price * item.quantity).toFixed(2)} ر.س
                        </span>
                        <div className="flex items-center gap-3 bg-background rounded-full px-2 py-1 border border-border">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-6 h-6 rounded-full bg-card flex items-center justify-center text-white"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Bottom Bar */}
            <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto bg-card/90 backdrop-blur-xl border-t border-border p-4 pb-4 z-40">
              <div className="flex items-center justify-between mb-3">
                <span className="text-muted-foreground font-medium text-sm">
                  الإجمالي ({items.length} منتج)
                </span>
                <span className="text-2xl font-black text-primary" style={{ textShadow: "0 0 10px rgba(0,212,255,0.5)" }}>
                  {totalPrice.toFixed(2)} ر.س
                </span>
              </div>
              <button
                onClick={() => setStep("checkout")}
                className="w-full font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
                style={{
                  background: "linear-gradient(135deg, hsl(190,100%,40%), hsl(190,100%,50%))",
                  boxShadow: "0 0 20px rgba(0,212,255,0.4)",
                  color: "#000",
                }}
              >
                المتابعة للدفع
              </button>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
