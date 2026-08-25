import { useState, useRef, useEffect, useCallback } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { useAuth } from "../contexts/AuthContext";
import {
  addProduct, getCategories, uploadProductImage,
  lookupBarcode, getProductByBarcode, updateProduct
} from "../lib/firestoreService";
import type { FSCategory, FSProduct } from "../types";
import { motion, AnimatePresence } from "framer-motion";
import {
  ScanLine, Camera, X, Check, Loader2, Plus,
  Image as ImageIcon, Package, ChevronDown
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

const INITIAL_FORM = {
  nameAr: "",
  name: "",
  price: "",
  originalPrice: "",
  discount: "",
  category: "",
  barcode: "",
  inStock: true,
};

export default function DataEntry() {
  const { user } = useAuth();
  const [form, setForm] = useState(INITIAL_FORM);
  const [categories, setCategories] = useState<FSCategory[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [editingProduct, setEditingProduct] = useState<FSProduct | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerDivId = "barcode-scanner-container";

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  const stopScanner = useCallback(async () => {
    try {
      if (scannerRef.current) {
        const state = scannerRef.current.getState();
        if (state === 2) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch (e) {
      console.warn("Scanner stop error:", e);
    }
  }, []);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  const handleBarcodeDetected = async (barcode: string) => {
    await stopScanner();
    setScanning(false);
    setForm((f) => ({ ...f, barcode }));
    setLookingUp(true);

    try {
      // 1. Check Firestore first
      const existing = await getProductByBarcode(barcode);
      if (existing) {
        setEditingProduct(existing);
        setForm({
          nameAr: existing.nameAr,
          name: existing.name,
          price: String(existing.price),
          originalPrice: String(existing.originalPrice || ""),
          discount: String(existing.discount || ""),
          category: existing.category,
          barcode: existing.barcode || barcode,
          inStock: existing.inStock,
        });
        if (existing.imageUrl) setImagePreview(existing.imageUrl);
        setLookingUp(false);
        return;
      }

      // 2. Open Food Facts API fallback
      const info = await lookupBarcode(barcode);
      if (info) {
        setForm((f) => ({
          ...f,
          nameAr: info.nameAr || info.name,
          name: info.name,
        }));
      }
    } catch (e) {
      console.error("Barcode lookup error:", e);
    } finally {
      setLookingUp(false);
    }
  };

  const startScanner = async () => {
    await stopScanner();
    setScanning(true);
    setError("");

    setTimeout(async () => {
      try {
        const html5Qrcode = new Html5Qrcode(scannerDivId);
        scannerRef.current = html5Qrcode;

        await html5Qrcode.start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: { width: 280, height: 140 },
            aspectRatio: 1.5,
          },
          (decodedText) => {
            handleBarcodeDetected(decodedText);
          },
          () => {}
        );
      } catch (e) {
        console.error("Scanner start error:", e);
        setScanning(false);
        setError("تعذّر تشغيل الكاميرا. تحقق من الصلاحيات.");
      }
    }, 300);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nameAr || !form.price || !form.category) {
      setError("يرجى تعبئة الاسم والسعر والقسم");
      return;
    }

    setSaving(true);
    setError("");

    try {
      let imageUrl = imagePreview;

      if (imageFile) {
        const tempId = Date.now().toString();
        imageUrl = await uploadProductImage(imageFile, tempId);
      }

      const productData = {
        nameAr: form.nameAr,
        name: form.name || form.nameAr,
        price: parseFloat(form.price),
        originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : undefined,
        discount: form.discount ? parseInt(form.discount) : undefined,
        category: form.category,
        imageUrl: imageUrl || "",
        barcode: form.barcode || undefined,
        inStock: form.inStock,
        createdBy: user?.uid || "",
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
      } else {
        await addProduct(productData);
      }

      setSuccess(true);
      setForm(INITIAL_FORM);
      setImageFile(null);
      setImagePreview("");
      setEditingProduct(null);

      setTimeout(() => setSuccess(false), 2500);
    } catch (err: any) {
      setError("فشل حفظ المنتج: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setForm(INITIAL_FORM);
    setImageFile(null);
    setImagePreview("");
    setEditingProduct(null);
    setError("");
  };

  return (
    <AppLayout>
      <div className="p-4 pt-8 max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">إضافة منتج</h1>
            <p className="text-xs text-muted-foreground mt-1">مدخل البيانات</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Package className="w-5 h-5 text-primary" />
          </div>
        </div>

        {/* Success message */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 bg-secondary/10 border border-secondary/30 rounded-xl p-4"
              style={{ boxShadow: "0 0 12px rgba(57,255,20,0.2)" }}
            >
              <Check className="w-5 h-5 text-secondary" />
              <span className="text-secondary font-bold">
                {editingProduct ? "تم تحديث المنتج!" : "تم إضافة المنتج بنجاح!"}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scanner */}
        <div className="space-y-3">
          {!scanning ? (
            <button
              onClick={startScanner}
              className="w-full py-4 rounded-2xl border-2 border-dashed border-primary/50 bg-primary/5 text-primary font-bold flex items-center justify-center gap-3 hover:bg-primary/10 transition-all"
              style={{ boxShadow: "0 0 16px rgba(0,212,255,0.1)" }}
            >
              <ScanLine className="w-6 h-6" />
              مسح الباركود
            </button>
          ) : (
            <div className="relative">
              <div
                id={scannerDivId}
                className="w-full rounded-2xl overflow-hidden border border-primary/50"
                style={{ minHeight: 200 }}
              />
              <button
                onClick={async () => { await stopScanner(); setScanning(false); }}
                className="absolute top-2 left-2 w-8 h-8 bg-card/90 rounded-full flex items-center justify-center border border-border z-20"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-64 h-28 border-2 border-primary rounded opacity-70"
                  style={{ boxShadow: "0 0 16px rgba(0,212,255,0.4)" }} />
              </div>
            </div>
          )}

          {lookingUp && (
            <div className="flex items-center gap-2 text-primary text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              جاري البحث عن المنتج...
            </div>
          )}

          {editingProduct && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 flex items-center justify-between">
              <span className="text-yellow-400 text-sm font-bold">تحديث منتج موجود</span>
              <button onClick={reset} className="text-muted-foreground text-xs underline">إلغاء</button>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Upload */}
          <div
            onClick={() => fileRef.current?.click()}
            className="w-full h-40 rounded-2xl border-2 border-dashed border-border bg-card cursor-pointer hover:border-primary/50 transition-all overflow-hidden relative flex items-center justify-center"
          >
            {imagePreview ? (
              <>
                <img src={imagePreview} alt="معاينة" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-all">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm font-medium">التقط أو اختر صورة المنتج</span>
                <span className="text-xs opacity-60">من الكاميرا أو المعرض</span>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageChange}
            className="hidden"
          />

          {/* Product Name AR */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-muted-foreground">اسم المنتج (عربي) *</label>
            <input
              type="text"
              value={form.nameAr}
              onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))}
              placeholder="مثال: حليب كامل الدسم"
              className="w-full bg-card border border-border rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary transition-all placeholder:text-muted-foreground"
              required
            />
          </div>

          {/* Product Name EN */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-muted-foreground">اسم المنتج (إنجليزي)</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Full Fat Milk"
              dir="ltr"
              className="w-full bg-card border border-border rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary transition-all placeholder:text-muted-foreground"
            />
          </div>

          {/* Price Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-muted-foreground">السعر (ر.س) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="0.00"
                className="w-full bg-card border border-border rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary transition-all placeholder:text-muted-foreground"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-muted-foreground">السعر الأصلي</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.originalPrice}
                onChange={(e) => setForm((f) => ({ ...f, originalPrice: e.target.value }))}
                placeholder="0.00"
                className="w-full bg-card border border-border rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary transition-all placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-muted-foreground">القسم *</label>
            <div className="relative">
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full bg-card border border-border rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary transition-all appearance-none"
                required
              >
                <option value="" disabled>اختر قسماً...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.nameAr}</option>
                ))}
              </select>
              <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Barcode */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-muted-foreground">الباركود</label>
            <input
              type="text"
              value={form.barcode}
              onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))}
              placeholder="أدخل الباركود يدوياً أو امسحه"
              dir="ltr"
              className="w-full bg-card border border-border rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary transition-all placeholder:text-muted-foreground font-mono"
            />
          </div>

          {/* In Stock */}
          <div className="flex items-center justify-between bg-card border border-border rounded-xl p-4">
            <span className="font-bold text-white">متوفر في المخزون</span>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, inStock: !f.inStock }))}
              className={`w-12 h-6 rounded-full transition-all relative ${form.inStock ? "bg-secondary" : "bg-border"}`}
              style={form.inStock ? { boxShadow: "0 0 8px rgba(57,255,20,0.5)" } : {}}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${form.inStock ? "right-0.5" : "left-0.5"}`}
              />
            </button>
          </div>

          {error && (
            <p className="text-destructive text-sm font-medium bg-destructive/10 border border-destructive/30 rounded-xl p-3">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-black text-base flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
            style={{ boxShadow: "0 0 24px rgba(0,212,255,0.4)" }}
          >
            {saving ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> جاري الحفظ...</>
            ) : (
              <><Plus className="w-5 h-5" /> {editingProduct ? "تحديث المنتج" : "إضافة المنتج"}</>
            )}
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
