import { AppLayout } from "../components/layout/AppLayout";
import { Loader2, Tag } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getProducts } from "../lib/firestoreService";
import { useCart } from "../contexts/CartContext";
import type { FSProduct } from "../types";

export default function Offers() {
  const [offers, setOffers] = useState<FSProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    getProducts()
      .then((prods) => setOffers(prods.filter((p) => p.discount && p.discount > 0)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = (product: FSProduct) => {
    addToCart({
      id: product.id,
      nameAr: product.nameAr,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      discount: product.discount,
      imageUrl: product.imageUrl,
      category: product.category,
      inStock: product.inStock,
    });
  };

  return (
    <AppLayout>
      <div className="p-4 pt-8">
        <h1 className="text-2xl font-black text-white mb-6">العروض الحصرية</h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : offers.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="text-5xl mb-4">🏷️</div>
            <p className="text-muted-foreground font-medium">لا توجد عروض حالياً</p>
            <p className="text-sm text-muted-foreground mt-1 opacity-60">ترقّب العروض القادمة!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {offers.map((product, index) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                key={product.id}
                className="relative rounded-2xl overflow-hidden border border-border group"
                style={{ boxShadow: "0 0 16px rgba(57,255,20,0.08)" }}
              >
                {/* Image background */}
                <div className="h-44 relative overflow-hidden">
                  <img
                    src={product.imageUrl || "https://via.placeholder.com/400x200?text=عرض"}
                    alt={product.nameAr}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover opacity-50 transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x200?text=عرض"; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />

                  {/* Discount badge */}
                  <div className="absolute top-3 right-3">
                    <div
                      className="bg-secondary text-secondary-foreground font-black px-3 py-1 rounded-xl text-lg flex items-center gap-1"
                      style={{ boxShadow: "0 0 12px rgba(57,255,20,0.6)" }}
                    >
                      <Tag className="w-4 h-4" />
                      خصم {product.discount}%
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 bg-card">
                  <h3 className="text-lg font-black text-white mb-1">{product.nameAr}</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className="text-xl font-black text-secondary"
                        style={{ textShadow: "0 0 8px rgba(57,255,20,0.5)" }}
                      >
                        {product.price} ر.س
                      </span>
                      {product.originalPrice && (
                        <span className="text-sm text-muted-foreground line-through">
                          {product.originalPrice} ر.س
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleAdd(product)}
                      disabled={!product.inStock}
                      className="px-4 py-2 rounded-xl font-bold text-sm transition-all disabled:opacity-40"
                      style={{
                        background: "linear-gradient(135deg, hsl(190,100%,40%), hsl(190,100%,50%))",
                        color: "#000",
                        boxShadow: "0 0 12px rgba(0,212,255,0.3)",
                      }}
                    >
                      أضف للسلة
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
