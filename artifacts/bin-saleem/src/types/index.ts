export type UserRole = "ADMIN" | "DATA_ENTRY" | "REPRESENTATIVE" | "CUSTOMER";

export interface FSUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: UserRole;
  phone?: string;
  createdAt: string;
}

export interface FSCategory {
  id: string;
  nameAr: string;
  name: string;
  imageUrl: string;
  order: number;
  productCount?: number;
}

export interface FSProduct {
  id: string;
  nameAr: string;
  name: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  category: string;
  categoryName?: string;
  imageUrl: string;
  barcode?: string;
  inStock: boolean;
  createdAt: string;
  createdBy?: string;
}

export type OrderStatus = "pending" | "accepted" | "delivering" | "delivered" | "cancelled";

export interface OrderLocation {
  lat: number;
  lng: number;
  address?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export interface FSOrder {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  userEmail: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  location?: OrderLocation;
  representativeId?: string;
  representativeName?: string;
  notes?: string;
  createdAt: string;
}
