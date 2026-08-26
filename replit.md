# سوق بن سليم — Bin Saleem Supermarket

## Overview

Full-stack Arabic e-commerce grocery app with Firebase Auth, Firestore product database, role-based access control, barcode scanning for data entry, and representative order management with map-based delivery.

## Stack

- **Monorepo**: pnpm workspaces
- **Frontend**: React + Vite (Tailwind CSS, Framer Motion, shadcn/ui)
- **Backend DB for REST API**: PostgreSQL + Drizzle ORM (legacy, kept for compatibility)
- **Primary Database**: Firebase Firestore (products, categories, users, orders)
- **Storage**: Firebase Storage (product images, category images)
- **Auth**: Firebase Auth — Google Sign-In (popup → redirect fallback)
- **Barcode**: html5-qrcode + Open Food Facts API fallback
- **Maps**: Browser Geolocation + Google Maps deep-link

## User Roles

| Role | Arabic | Access |
|------|--------|--------|
| ADMIN | مدير | Full access — admin dashboard, user management, categories, orders |
| DATA_ENTRY | مدخل بيانات | Add/edit products via barcode scanner + image upload |
| REPRESENTATIVE | مندوب | View & accept delivery orders, update status, view customer location |
| CUSTOMER | عميل | Browse, add to cart, checkout with phone + GPS location |

**Admin email**: `zzam8160@gmail.com` (auto-promoted)

## Firebase Config (set via Replit secrets)

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID` → `market-bin-saleem-1`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

## Firestore Collections

| Collection | Description |
|-----------|-------------|
| `users/{uid}` | email, displayName, role, phone, photoURL |
| `categories/{id}` | nameAr, name, imageUrl, order |
| `products/{id}` | nameAr, name, price, originalPrice, discount, category, imageUrl, barcode, inStock, createdAt, createdBy |
| `orders/{id}` | userId, userName, userPhone, items[], total, status, location{lat,lng,address}, representativeId, representativeName, notes, createdAt |

## App Routes

| Route | Component | Roles |
|-------|-----------|-------|
| `/` | Login | All (unauthenticated) |
| `/home` | Home | All authenticated |
| `/offers` | Offers | CUSTOMER |
| `/cart` | Cart | CUSTOMER |
| `/profile` | Profile | All |
| `/admin` | Admin | ADMIN |
| `/data-entry` | DataEntry | ADMIN, DATA_ENTRY |
| `/representative` | Representative | ADMIN, REPRESENTATIVE |

## Key Features

### Home Page
- Horizontal circular category scroll (5 categories: غذائية/منزلية/كوزمتك/ميزان/ألبان)
- Real-time products from Firestore (subscribeProducts)
- Category filtering — client-side sort (no composite indexes needed)
- Search by product name
- Add to cart, role-aware quick-add button

### Admin Panel (3 tabs)
- **إحصائيات**: Orders summary, revenue, recent orders list
- **المستخدمون**: View all users, change roles (CUSTOMER/DATA_ENTRY/REPRESENTATIVE)
- **الأقسام**: Add/edit/delete categories with circular image, upload from camera or URL

### Data Entry Page
- Camera barcode scanner (html5-qrcode)
- Auto-fill product name from Firestore or Open Food Facts API
- Camera/gallery product photo upload → Firebase Storage
- Product form: nameAr, name, price, originalPrice, category, barcode, inStock toggle
- Detects existing product by barcode → switches to update mode

### Representative Page
- Real-time order stream from Firestore
- Two tabs: "الطلبات الجديدة" (pending) / "طلباتي" (accepted by me)
- Expandable order cards: customer name, phone (tappable call link), items list
- Location button → opens Google Maps with customer's GPS coordinates
- Accept order button → locks order to this representative (no conflict)
- Status updates: accepted → جاري التوصيل → تم التوصيل

### Cart / Checkout (2-step)
1. Cart view: items, quantities, totals
2. Checkout: phone number, GPS location capture (Nominatim reverse geocoding for address), notes, submit to Firestore

### Profile Page
- Shows user avatar, name, email, phone, role badge
- CUSTOMER: shows order history with status tracking + representative name

## Design System
- **Mode**: Forced dark (`class="dark"` on `<html>`)
- **Direction**: RTL (`dir="rtl"`)
- **Font**: Tajawal (Arabic) from Google Fonts
- **Neon Blue**: `hsl(190,100%,50%)` = `#00D4FF`
- **Neon Green**: `hsl(110,100%,54%)` = `#39FF14`
- **Background**: `#0A0A0A`

## Firestore Notes
- No composite indexes needed — compound queries avoided; sorting done client-side
- Categories auto-seeded with 5 defaults on first access (initCategories)
- `subscribeProducts` / `subscribeOrders` use real-time listeners for live updates
