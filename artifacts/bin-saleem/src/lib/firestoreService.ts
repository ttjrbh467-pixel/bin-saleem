import {
  collection, doc, getDocs, getDoc, setDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, onSnapshot, Unsubscribe, limit,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./firebase";
import type { FSUser, FSCategory, FSProduct, FSOrder, OrderStatus, UserRole } from "../types";

// helper: sort by createdAt desc client-side
function sortByDate<T extends { createdAt: string }>(arr: T[]): T[] {
  return [...arr].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

const FIRESTORE_TIMEOUT_MS = 8000;

function withFirestoreTimeout<T>(request: Promise<T>, label: string): Promise<T> {
  return Promise.race([
    request,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`انتهت مهلة الاتصال أثناء ${label}`)), FIRESTORE_TIMEOUT_MS);
    }),
  ]);
}

// ─── USERS ───────────────────────────────────────────────────────────────
export async function upsertUser(user: Omit<FSUser, "createdAt">) {
  const docRef = doc(db, "users", user.uid);
  const snap = await withFirestoreTimeout(getDoc(docRef), "تحميل الحساب");
  if (!snap.exists()) {
    await withFirestoreTimeout(
      setDoc(docRef, { ...user, createdAt: new Date().toISOString() }),
      "حفظ الحساب",
    );
  }
}

export async function getUser(uid: string): Promise<FSUser | null> {
  const snap = await withFirestoreTimeout(getDoc(doc(db, "users", uid)), "تحميل الحساب");
  return snap.exists() ? (snap.data() as FSUser) : null;
}

export async function getAllUsers(): Promise<FSUser[]> {
  const snap = await withFirestoreTimeout(getDocs(collection(db, "users")), "تحميل المستخدمين");
  return snap.docs.map((d) => d.data() as FSUser);
}

export async function updateUserRole(uid: string, role: UserRole) {
  await updateDoc(doc(db, "users", uid), { role });
}

export async function updateUserPhone(uid: string, phone: string) {
  await updateDoc(doc(db, "users", uid), { phone });
}

// ─── CATEGORIES ──────────────────────────────────────────────────────────
const DEFAULT_CATEGORIES: Omit<FSCategory, "id">[] = [
  {
    nameAr: "غذائية",
    name: "Food",
    imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=80",
    order: 1,
    productCount: 0,
  },
  {
    nameAr: "منزلية",
    name: "Household",
    imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&q=80",
    order: 2,
    productCount: 0,
  },
  {
    nameAr: "كوزمتك",
    name: "Cosmetics",
    imageUrl: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=300&q=80",
    order: 3,
    productCount: 0,
  },
  {
    nameAr: "ميزان",
    name: "Scale Items",
    imageUrl: "https://images.unsplash.com/photo-1579113800032-c38bd7635818?w=300&q=80",
    order: 4,
    productCount: 0,
  },
  {
    nameAr: "ألبان",
    name: "Dairy",
    imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&q=80",
    order: 5,
    productCount: 0,
  },
];

export async function initCategories() {
  const snap = await withFirestoreTimeout(getDocs(collection(db, "categories")), "تحميل الأقسام");
  if (snap.empty) {
    for (const cat of DEFAULT_CATEGORIES) {
      await withFirestoreTimeout(addDoc(collection(db, "categories"), cat), "إنشاء الأقسام");
    }
  }
}

export async function getCategories(): Promise<FSCategory[]> {
  // order by "order" field — single field, no composite index needed
  const q = query(collection(db, "categories"), orderBy("order"));
  const snap = await withFirestoreTimeout(getDocs(q), "تحميل الأقسام");
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FSCategory));
}

export async function addCategory(cat: Omit<FSCategory, "id">) {
  const docRef = await addDoc(collection(db, "categories"), cat);
  return docRef.id;
}

export async function updateCategory(id: string, data: Partial<FSCategory>) {
  await updateDoc(doc(db, "categories", id), data);
}

export async function deleteCategory(id: string) {
  await deleteDoc(doc(db, "categories", id));
}

// ─── PRODUCTS ────────────────────────────────────────────────────────────
export async function getProducts(categoryId?: string): Promise<FSProduct[]> {
  let snap;
  if (categoryId) {
    // Simple single-field where — no composite index needed; sort client-side
    const q = query(collection(db, "products"), where("category", "==", categoryId));
    snap = await withFirestoreTimeout(getDocs(q), "تحميل المنتجات");
  } else {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    snap = await withFirestoreTimeout(getDocs(q), "تحميل المنتجات");
  }
  const products = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FSProduct));
  return categoryId ? sortByDate(products) : products;
}

export async function getProductByBarcode(barcode: string): Promise<FSProduct | null> {
  const q = query(collection(db, "products"), where("barcode", "==", barcode), limit(1));
  const snap = await withFirestoreTimeout(getDocs(q), "البحث عن المنتج");
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as FSProduct;
}

export async function addProduct(product: Omit<FSProduct, "id" | "createdAt">) {
  const docRef = await addDoc(collection(db, "products"), {
    ...product,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
}

export async function updateProduct(id: string, data: Partial<FSProduct>) {
  await updateDoc(doc(db, "products", id), data);
}

export async function deleteProduct(id: string) {
  await deleteDoc(doc(db, "products", id));
}

export function subscribeProducts(
  categoryId: string | null,
  callback: (products: FSProduct[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  let q;
  if (categoryId) {
    // Single where, sort client-side
    q = query(collection(db, "products"), where("category", "==", categoryId), limit(80));
  } else {
    q = query(collection(db, "products"), orderBy("createdAt", "desc"), limit(80));
  }
  return onSnapshot(
    q,
    (snap) => {
      const products = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FSProduct));
      callback(categoryId ? sortByDate(products) : products);
    },
    (error) => onError?.(error),
  );
}

// ─── ORDERS ──────────────────────────────────────────────────────────────
export async function createOrder(order: Omit<FSOrder, "id" | "createdAt">) {
  const docRef = await addDoc(collection(db, "orders"), {
    ...order,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
}

export async function getOrders(): Promise<FSOrder[]> {
  const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
  const snap = await withFirestoreTimeout(getDocs(q), "تحميل الطلبات");
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FSOrder));
}

export async function getUserOrders(userId: string): Promise<FSOrder[]> {
  // Single where, sort client-side
  const q = query(collection(db, "orders"), where("userId", "==", userId));
  const snap = await withFirestoreTimeout(getDocs(q), "تحميل طلباتك");
  return sortByDate(snap.docs.map((d) => ({ id: d.id, ...d.data() } as FSOrder)));
}

export async function acceptOrder(orderId: string, repId: string, repName: string) {
  await updateDoc(doc(db, "orders", orderId), {
    status: "accepted",
    representativeId: repId,
    representativeName: repName,
  });
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  await updateDoc(doc(db, "orders", orderId), { status });
}

// Subscribe to orders — avoid compound queries to skip needing Firestore indexes
export function subscribeOrders(
  callback: (orders: FSOrder[]) => void,
  filter?: { status?: OrderStatus; repId?: string }
): Unsubscribe {
  let q;
  if (filter?.repId) {
    // Single where on representativeId
    q = query(collection(db, "orders"), where("representativeId", "==", filter.repId));
  } else if (filter?.status) {
    // Single where on status
    q = query(collection(db, "orders"), where("status", "==", filter.status));
  } else {
    q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
  }

  return onSnapshot(q, (snap) => {
    const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FSOrder));
    // Sort client-side
    callback(sortByDate(orders));
  });
}

// ─── STORAGE ─────────────────────────────────────────────────────────────
export async function uploadProductImage(file: File, productId: string): Promise<string> {
  const storageRef = ref(storage, `products/${productId}_${Date.now()}`);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
}

export async function uploadCategoryImage(file: File, categoryId: string): Promise<string> {
  const storageRef = ref(storage, `categories/${categoryId}_${Date.now()}`);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
}

// ─── OPEN FOOD FACTS Barcode Lookup ──────────────────────────────────────
export async function lookupBarcode(barcode: string): Promise<{ name: string; nameAr?: string } | null> {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    const json = await res.json();
    if (json.status === 1 && json.product?.product_name) {
      return {
        name: json.product.product_name,
        nameAr: json.product.product_name_ar || undefined,
      };
    }
    return null;
  } catch {
    return null;
  }
}
