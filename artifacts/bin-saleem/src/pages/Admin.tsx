import { useState, useEffect, useRef } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import {
  getAllUsers, updateUserRole,
  getCategories, addCategory, updateCategory, deleteCategory, uploadCategoryImage,
  getOrders, initCategories,
} from "../lib/firestoreService";
import type { FSUser, FSCategory, FSOrder } from "../types";
import type { UserRole } from "../types";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Package, ShoppingBag, DollarSign, Loader2,
  Shield, ScanLine, Truck, User, Edit2, Trash2,
  Plus, Check, X, Camera, ChevronDown, RefreshCw
} from "lucide-react";

type AdminTab = "stats" | "users" | "categories";

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "مدير",
  DATA_ENTRY: "مدخل بيانات",
  REPRESENTATIVE: "مندوب",
  CUSTOMER: "عميل",
};

const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: "text-red-400 border-red-400/30 bg-red-400/10",
  DATA_ENTRY: "text-primary border-primary/30 bg-primary/10",
  REPRESENTATIVE: "text-purple-400 border-purple-400/30 bg-purple-400/10",
  CUSTOMER: "text-muted-foreground border-border bg-card",
};

const ROLE_ICON: Record<UserRole, React.ElementType> = {
  ADMIN: Shield,
  DATA_ENTRY: ScanLine,
  REPRESENTATIVE: Truck,
  CUSTOMER: User,
};

export default function Admin() {
  const [tab, setTab] = useState<AdminTab>("stats");

  // Stats
  const [orders, setOrders] = useState<FSOrder[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // Users
  const [users, setUsers] = useState<FSUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  // Categories
  const [categories, setCategories] = useState<FSCategory[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [editingCat, setEditingCat] = useState<FSCategory | null>(null);
  const [newCatForm, setNewCatForm] = useState({ nameAr: "", name: "", imageUrl: "" });
  const [showAddCat, setShowAddCat] = useState(false);
  const [catImageFile, setCatImageFile] = useState<File | null>(null);
  const [catImagePreview, setCatImagePreview] = useState<string>("");
  const [savingCat, setSavingCat] = useState(false);
  const catFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const o = await getOrders();
      setOrders(o);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const u = await getAllUsers();
      setUsers(u);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadCategories = async () => {
    setLoadingCats(true);
    try {
      await initCategories();
      const cats = await getCategories();
      setCategories(cats);
    } finally {
      setLoadingCats(false);
    }
  };

  useEffect(() => {
    if (tab === "users" && users.length === 0) loadUsers();
    if (tab === "categories" && categories.length === 0) loadCategories();
  }, [tab]);

  const handleRoleChange = async (uid: string, newRole: UserRole) => {
    setUpdatingRole(uid);
    try {
      await updateUserRole(uid, newRole);
      setUsers((u) => u.map((user) => (user.uid === uid ? { ...user, role: newRole } : user)));
    } finally {
      setUpdatingRole(null);
    }
  };

  const handleCatImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCatImageFile(file);
    setCatImagePreview(URL.createObjectURL(file));
  };

  const handleSaveCategory = async () => {
    if (!newCatForm.nameAr) return;
    setSavingCat(true);
    try {
      let imageUrl = newCatForm.imageUrl || catImagePreview || "";

      if (editingCat) {
        let uploadedUrl = imageUrl;
        if (catImageFile) {
          uploadedUrl = await uploadCategoryImage(catImageFile, editingCat.id);
        }
        await updateCategory(editingCat.id, {
          nameAr: newCatForm.nameAr,
          name: newCatForm.name,
          imageUrl: uploadedUrl || editingCat.imageUrl,
        });
      } else {
        const tempId = Date.now().toString();
        if (catImageFile) {
          imageUrl = await uploadCategoryImage(catImageFile, tempId);
        }
        await addCategory({
          nameAr: newCatForm.nameAr,
          name: newCatForm.name || newCatForm.nameAr,
          imageUrl,
          order: categories.length + 1,
          productCount: 0,
        });
      }
      await loadCategories();
      resetCatForm();
    } finally {
      setSavingCat(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا القسم؟")) return;
    await deleteCategory(id);
    setCategories((cats) => cats.filter((c) => c.id !== id));
  };

  const resetCatForm = () => {
    setEditingCat(null);
    setNewCatForm({ nameAr: "", name: "", imageUrl: "" });
    setCatImageFile(null);
    setCatImagePreview("");
    setShowAddCat(false);
  };

  const startEditCat = (cat: FSCategory) => {
    setEditingCat(cat);
    setNewCatForm({ nameAr: cat.nameAr, name: cat.name, imageUrl: cat.imageUrl });
    setCatImagePreview(cat.imageUrl);
    setShowAddCat(true);
  };

  const totalRevenue = orders
    .filter((o) => o.status === "delivered")
    .reduce((sum, o) => sum + o.total, 0);

  const tabs = [
    { key: "stats" as AdminTab, label: "الإحصائيات" },
    { key: "users" as AdminTab, label: "المستخدمون" },
    { key: "categories" as AdminTab, label: "الأقسام" },
  ];

  return (
    <AppLayout>
      <div className="p-4 pt-8 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">لوحة التحكم</h1>
            <p className="text-xs text-muted-foreground mt-1">مدير النظام</p>
          </div>
          <div
            className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center"
            style={{ boxShadow: "0 0 12px rgba(239,68,68,0.2)" }}
          >
            <Shield className="w-5 h-5 text-red-400" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-card border border-border rounded-xl p-1">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all ${
                tab === key
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── STATS TAB ── */}
        {tab === "stats" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "إجمالي الإيرادات", value: `${totalRevenue.toFixed(2)} ر.س`, icon: DollarSign, color: "text-secondary", bg: "bg-secondary/10 border-secondary/20" },
                { label: "إجمالي الطلبات", value: orders.length, icon: ShoppingBag, color: "text-primary", bg: "bg-primary/10 border-primary/20" },
                { label: "طلبات منتهية", value: orders.filter((o) => o.status === "delivered").length, icon: Check, color: "text-green-400", bg: "bg-green-400/10 border-green-400/20" },
                { label: "طلبات معلقة", value: orders.filter((o) => o.status === "pending").length, icon: Package, color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20" },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div key={i} className={`rounded-2xl p-4 border ${stat.bg} flex flex-col`}>
                    <Icon className={`w-5 h-5 mb-2 ${stat.color}`} />
                    <span className="text-xs text-muted-foreground mb-1">{stat.label}</span>
                    <span className={`text-xl font-black ${stat.color}`}>{loadingStats ? "..." : stat.value}</span>
                  </div>
                );
              })}
            </div>

            {/* Recent Orders */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-white">أحدث الطلبات</h2>
                <button onClick={loadStats} className="text-muted-foreground hover:text-white transition-colors">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="bg-card border border-border rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white text-sm">{order.userName}</p>
                      <p className="text-xs text-muted-foreground font-mono">#{order.id.slice(0, 8)}</p>
                    </div>
                    <div className="text-left">
                      <p className="font-black text-white">{order.total} ر.س</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                        order.status === "delivered" ? "text-secondary border-secondary/30 bg-secondary/10" :
                        order.status === "pending" ? "text-yellow-400 border-yellow-400/30 bg-yellow-400/10" :
                        "text-primary border-primary/30 bg-primary/10"
                      }`}>
                        {order.status === "delivered" ? "تم" : order.status === "pending" ? "معلق" : "نشط"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── USERS TAB ── */}
        {tab === "users" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-white">المستخدمون ({users.length})</h2>
              <button onClick={loadUsers} className="text-muted-foreground hover:text-white transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {loadingUsers ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              users.map((u) => {
                const RoleIcon = ROLE_ICON[u.role] || User;
                return (
                  <motion.div
                    key={u.uid}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-card border border-border rounded-2xl p-4"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      {u.photoURL ? (
                        <img src={u.photoURL} alt={u.displayName} className="w-10 h-10 rounded-full object-cover border border-border" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                          <span className="text-primary font-black">{u.displayName?.charAt(0) || "?"}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white text-sm truncate">{u.displayName || "مستخدم"}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                        {u.phone && <p className="text-xs text-primary font-mono">{u.phone}</p>}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full border flex items-center gap-1 shrink-0 ${ROLE_COLORS[u.role]}`}>
                        <RoleIcon className="w-3 h-3" />
                        {ROLE_LABELS[u.role]}
                      </span>
                    </div>

                    {u.role !== "ADMIN" && (
                      <div className="grid grid-cols-3 gap-1.5">
                        {(["CUSTOMER", "DATA_ENTRY", "REPRESENTATIVE"] as UserRole[]).map((r) => (
                          <button
                            key={r}
                            onClick={() => handleRoleChange(u.uid, r)}
                            disabled={u.role === r || updatingRole === u.uid}
                            className={`py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
                              u.role === r
                                ? ROLE_COLORS[r] + " cursor-default"
                                : "bg-border/50 text-muted-foreground hover:bg-border"
                            }`}
                          >
                            {updatingRole === u.uid ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              ROLE_LABELS[r]
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {/* ── CATEGORIES TAB ── */}
        {tab === "categories" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-white">الأقسام ({categories.length})</h2>
              <button
                onClick={() => { resetCatForm(); setShowAddCat(true); }}
                className="flex items-center gap-1.5 text-xs text-primary border border-primary/30 rounded-full px-3 py-1.5 hover:bg-primary/10 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                قسم جديد
              </button>
            </div>

            {/* Add/Edit Category Form */}
            <AnimatePresence>
              {showAddCat && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-card border border-primary/30 rounded-2xl p-4 space-y-3 overflow-hidden"
                  style={{ boxShadow: "0 0 16px rgba(0,212,255,0.1)" }}
                >
                  <h3 className="font-bold text-white">
                    {editingCat ? "تعديل القسم" : "قسم جديد"}
                  </h3>

                  {/* Image */}
                  <div
                    onClick={() => catFileRef.current?.click()}
                    className="w-24 h-24 rounded-full overflow-hidden border-2 border-dashed border-primary/40 cursor-pointer mx-auto flex items-center justify-center bg-primary/5 hover:bg-primary/10 transition-all"
                  >
                    {catImagePreview ? (
                      <img src={catImagePreview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <input
                    ref={catFileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCatImageChange}
                    className="hidden"
                  />
                  {!catImagePreview && (
                    <input
                      type="url"
                      value={newCatForm.imageUrl}
                      onChange={(e) => setNewCatForm((f) => ({ ...f, imageUrl: e.target.value }))}
                      placeholder="أو أدخل رابط الصورة..."
                      dir="ltr"
                      className="w-full bg-background border border-border rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-primary transition-all placeholder:text-muted-foreground"
                    />
                  )}

                  <input
                    type="text"
                    value={newCatForm.nameAr}
                    onChange={(e) => setNewCatForm((f) => ({ ...f, nameAr: e.target.value }))}
                    placeholder="اسم القسم بالعربية *"
                    className="w-full bg-background border border-border rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-primary transition-all placeholder:text-muted-foreground"
                    required
                  />
                  <input
                    type="text"
                    value={newCatForm.name}
                    onChange={(e) => setNewCatForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Category Name (EN)"
                    dir="ltr"
                    className="w-full bg-background border border-border rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-primary transition-all placeholder:text-muted-foreground"
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveCategory}
                      disabled={savingCat || !newCatForm.nameAr}
                      className="flex-1 py-2.5 rounded-xl bg-primary/20 text-primary border border-primary/30 font-bold text-sm hover:bg-primary/30 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {savingCat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      {editingCat ? "تحديث" : "إضافة"}
                    </button>
                    <button
                      onClick={resetCatForm}
                      className="py-2.5 px-4 rounded-xl bg-border text-muted-foreground hover:text-white transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Categories List */}
            {loadingCats ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-2">
                {categories.map((cat) => (
                  <div key={cat.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-border shrink-0">
                      <img
                        src={cat.imageUrl}
                        alt={cat.nameAr}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${cat.nameAr}&background=00D4FF&color=000`;
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-white">{cat.nameAr}</p>
                      <p className="text-xs text-muted-foreground">{cat.name}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditCat(cat)}
                        className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20 hover:bg-primary/20 transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="w-8 h-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center border border-destructive/20 hover:bg-destructive/20 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
