import { db, productsTable, categoriesTable, offersTable } from "@workspace/db";

async function seed() {
  console.log("Seeding Bin Saleem data...");

  await db.insert(categoriesTable).values([
    { name: "Fruits & Vegetables", nameAr: "خضروات وفواكه", icon: "Leaf", productCount: 12 },
    { name: "Dairy & Eggs", nameAr: "ألبان وبيض", icon: "Milk", productCount: 8 },
    { name: "Meat & Poultry", nameAr: "لحوم ودواجن", icon: "Beef", productCount: 10 },
    { name: "Bakery", nameAr: "مخبوزات", icon: "Wheat", productCount: 6 },
    { name: "Beverages", nameAr: "مشروبات", icon: "Coffee", productCount: 15 },
    { name: "Snacks", nameAr: "وجبات خفيفة", icon: "Cookie", productCount: 20 },
  ]).onConflictDoNothing();

  await db.insert(productsTable).values([
    {
      name: "Fresh Tomatoes",
      nameAr: "طماطم طازجة",
      description: "Fresh red tomatoes from local farms",
      price: "2.50",
      originalPrice: "3.00",
      imageUrl: "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400",
      category: "Fruits & Vegetables",
      inStock: true,
      discount: 15,
      rating: "4.5",
      reviewCount: 128,
    },
    {
      name: "Organic Bananas",
      nameAr: "موز عضوي",
      description: "Fresh organic bananas",
      price: "3.00",
      originalPrice: null,
      imageUrl: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400",
      category: "Fruits & Vegetables",
      inStock: true,
      discount: 0,
      rating: "4.7",
      reviewCount: 89,
    },
    {
      name: "Full Fat Milk 1L",
      nameAr: "حليب كامل الدسم 1 لتر",
      description: "Fresh full fat milk",
      price: "4.50",
      originalPrice: "5.00",
      imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400",
      category: "Dairy & Eggs",
      inStock: true,
      discount: 10,
      rating: "4.8",
      reviewCount: 200,
    },
    {
      name: "Free Range Eggs (12)",
      nameAr: "بيض حر (12 بيضة)",
      description: "Farm fresh free range eggs",
      price: "8.00",
      originalPrice: null,
      imageUrl: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400",
      category: "Dairy & Eggs",
      inStock: true,
      discount: 0,
      rating: "4.9",
      reviewCount: 150,
    },
    {
      name: "Chicken Breast 1kg",
      nameAr: "صدر دجاج 1 كيلو",
      description: "Fresh boneless chicken breast",
      price: "18.00",
      originalPrice: "22.00",
      imageUrl: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400",
      category: "Meat & Poultry",
      inStock: true,
      discount: 18,
      rating: "4.6",
      reviewCount: 95,
    },
    {
      name: "Whole Wheat Bread",
      nameAr: "خبز القمح الكامل",
      description: "Freshly baked whole wheat bread",
      price: "3.50",
      originalPrice: null,
      imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400",
      category: "Bakery",
      inStock: true,
      discount: 0,
      rating: "4.4",
      reviewCount: 67,
    },
    {
      name: "Arabic Coffee",
      nameAr: "قهوة عربية",
      description: "Premium Arabic coffee blend",
      price: "12.00",
      originalPrice: "15.00",
      imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400",
      category: "Beverages",
      inStock: true,
      discount: 20,
      rating: "4.9",
      reviewCount: 310,
    },
    {
      name: "Mixed Nuts 500g",
      nameAr: "مكسرات مشكلة 500 جرام",
      description: "Premium mixed nuts selection",
      price: "25.00",
      originalPrice: "30.00",
      imageUrl: "https://images.unsplash.com/photo-1599599811726-a9c2c1b55ec3?w=400",
      category: "Snacks",
      inStock: true,
      discount: 17,
      rating: "4.7",
      reviewCount: 180,
    },
  ]).onConflictDoNothing();

  await db.insert(offersTable).values([
    {
      title: "Ramadan Special Offer",
      titleAr: "عرض رمضان الخاص",
      description: "Get 25% off on all beverages this Ramadan",
      discount: 25,
      imageUrl: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800",
      validUntil: new Date("2026-04-30"),
      productId: null,
    },
    {
      title: "Weekend Fresh Deals",
      titleAr: "عروض الويكند الطازجة",
      description: "Fresh fruits and vegetables at special weekend prices",
      discount: 30,
      imageUrl: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800",
      validUntil: new Date("2026-04-10"),
      productId: null,
    },
    {
      title: "Buy 2 Get 1 Free",
      titleAr: "اشتري 2 واحصل على 1 مجاناً",
      description: "On selected dairy products",
      discount: 33,
      imageUrl: "https://images.unsplash.com/photo-1559598467-f8b76c8155d0?w=800",
      validUntil: new Date("2026-04-15"),
      productId: null,
    },
  ]).onConflictDoNothing();

  console.log("Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
