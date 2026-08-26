import { useAuth } from "../contexts/AuthContext";
import { AppLayout } from "../components/layout/AppLayout";
import { Loader2, Plus, Search } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { getCategories, subscribeProducts, initCategories } from "../lib/firestoreService";
import { isFirebaseConfigured } from "../lib/firebase";
import type { FSCategory, FSProduct } from "../types";
import { useLocation } from "wouter";

export default function Home() {
  const { user, role } = useAuth();
  const { addToCart } = useCart();
  const [, setLocation] = useLocation();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<FSCategory[]>([]);
  const [products, setProducts] = useState<FSProduct[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingProds, setLoadingProds] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoadingCats(false);
      return;
    }

    initCategories()
      .then(() => getCategories())
      .then((cats) => {
        setCategories(cats);
        setLoadingCats(false);
      })
      .catch(() => setLoadingCats(false));
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setProducts([]);
      setLoadingProds(false);
      return;
    }

    setLoadingProds(true);
    const unsub = subscribeProducts(
      activeCategory,
      (prods) => {
        setProducts(prods);
        setLoadingProds(false);
      },
      () => {
        setProducts([]);
        setLoadingProds(false);
      },
    );
    const timeout = window.setTimeout(() => setLoadingProds(false), 8500);
    return () => {
      window.clearTimeout(timeout);
      unsub();
    };
  }, [activeCategory]);

  const filtered = products.filter((p) =>
    !search ||
    p.nameAr.includes(search) ||
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddToCart = (product: FSProduct) => {
    addToCart({
      id: product.id,
      name: product.name,
      nameAr: product.nameAr,
      price: product.price,
      originalPrice: product.originalPrice,
      discount: product.discount,
      imageUrl: product.imageUrl,
      category: product.category,
      inStock: product.inStock,
      rating: 0,
      reviewCount: 0,
    } as any);
  };

  return (
    <AppLayout>
      <div className="p-4 space-y-6 pt-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">
              مرحباً، <span className="text-primary" style={{ textShadow: "0 0 12px rgba(0,212,255,0.6)" }}>{user?.displayName?.split(" ")[0]}</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1 font-medium">ماذا تحتاج اليوم؟</p>
          </div>
          <div
            className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary cursor-pointer"
            style={{ boxShadow: "0 0 10px rgba(0,212,255,0.4)" }}
            onClick={() => setLocation("/profile")}
          >
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || ""} loading="lazy" decoding="async" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary font-black text-lg">
                {user?.displayName?.charAt(0) || "U"}
              </div>
            )}
          </div>
        </header>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن منتجات..."
            className="w-full bg-card border border-border rounded-xl py-3 pr-10 pl-4 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground"
          />
        </div>

        {/* Circular Categories */}
        <section>
          <h2 className="text-base font-bold mb-3 text-white">الأقسام</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide snap-x">
            {/* All */}
            <button
              onClick={() => setActiveCategory(null)}
              className="snap-center shrink-0 flex flex-col items-center gap-2 group"
            >
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all overflow-hidden ${
                  activeCategory === null
                    ? "border-primary shadow-[0_0_16px_rgba(0,212,255,0.5)]"
                    : "border-border/50"
                }`}
                style={{ background: "linear-gradient(135deg, #00D4FF22, #39FF1422)" }}
              >
                <span className="text-2xl">🛒</span>
              </div>
              <span className={`text-xs font-bold ${activeCategory === null ? "text-primary" : "text-muted-foreground"}`}>
                الكل
              </span>
            </button>

            {loadingCats ? (
              <div className="flex items-center justify-center w-16">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : (
              categories.map((cat, idx) => {
                const isActive = activeCategory === cat.id;
                return (
                  <motion.button
                    key={cat.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => setActiveCategory(isActive ? null : cat.id)}
                    className="snap-center shrink-0 flex flex-col items-center gap-2 group"
                  >
                    <div
                      className={`w-16 h-16 rounded-full overflow-hidden border-2 transition-all ${
                        isActive
                          ? "border-primary shadow-[0_0_16px_rgba(0,212,255,0.5)] scale-110"
                          : "border-border/50 group-hover:border-primary/40"
                      }`}
                    >
                      <img
                        src={cat.imageUrl}
                        alt={cat.nameAr}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${cat.nameAr}&background=00D4FF&color=000&size=64`;
                        }}
                      />
                    </div>
                    <span className={`text-xs font-bold ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                      {cat.nameAr}
                    </span>
                  </motion.button>
                );
              })
            )}
          </div>
        </section>

        {/* Products Grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">
              {activeCategory ? categories.find((c) => c.id === activeCategory)?.nameAr : "جميع المنتجات"}
            </h2>
            {(role === "ADMIN" || role === "DATA_ENTRY") && (
              <button
                onClick={() => setLocation("/data-entry")}
                className="text-xs text-primary border border-primary/30 rounded-full px-3 py-1 flex items-center gap-1 hover:bg-primary/10 transition-all"
              >
                <Plus className="w-3 h-3" />
                إضافة
              </button>
            )}
          </div>

          {loadingProds ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <div className="text-5xl mb-4">📦</div>
              <p className="text-muted-foreground font-medium">لا توجد منتجات بعد</p>
              {(role === "ADMIN" || role === "DATA_ENTRY") && (
                <button
                  onClick={() => setLocation("/data-entry")}
                  className="mt-4 bg-primary/10 text-primary border border-primary/30 rounded-xl px-6 py-2 font-bold hover:bg-primary/20 transition-all"
                >
                  أضف أول منتج
                </button>
              )}
            </div>
          ) : (
            <AnimatePresence>
              <div className="grid grid-cols-2 gap-4">
                {filtered.slice(0, 60).map((product, idx) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.04 }}
                    className="bg-card rounded-2xl p-3 border border-border flex flex-col relative group hover:border-primary/50 transition-colors"
                  >
                    {product.discount && (
                      <div
                        className="absolute top-2 right-2 z-10 bg-secondary text-secondary-foreground text-[10px] font-bold px-2 py-0.5 rounded"
                        style={{ boxShadow: "0 0 6px rgba(57,255,20,0.5)" }}
                      >
                        -{product.discount}%
                      </div>
                    )}
                    <div className="w-full aspect-square bg-background/50 rounded-xl mb-3 overflow-hidden">
                      <img
                        src={product.imageUrl || "https://via.placeholder.com/200x200?text=منتج"}
                        alt={product.nameAr}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://via.placeholder.com/200x200?text=منتج";
                        }}
                      />
                    </div>
                    <h3 className="font-bold text-sm text-white line-clamp-2 mb-1">{product.nameAr}</h3>
                    <div className="flex items-center justify-between mt-auto pt-1">
                      <div>
                        <span className="text-primary font-black text-sm" style={{ textShadow: "0 0 8px rgba(0,212,255,0.5)" }}>
                          {product.price} ر.س
                        </span>
                        {product.originalPrice && (
                          <span className="text-[10px] text-muted-foreground line-through block">{product.originalPrice} ر.س</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={!product.inStock}
                        className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-40"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    {!product.inStock && (
                      <div className="absolute inset-0 bg-background/60 rounded-2xl flex items-center justify-center">
                        <span className="text-xs font-bold text-muted-foreground border border-border rounded-full px-3 py-1">نفذ المخزون</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
