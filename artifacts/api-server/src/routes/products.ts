import { Router, type IRouter } from "express";
import { db, productsTable } from "@workspace/db";
import { ListProductsQueryParams } from "@workspace/api-zod";
import { ilike, eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/products", async (req, res) => {
  try {
    const query = ListProductsQueryParams.parse(req.query);
    let products = await db.select().from(productsTable);

    if (query.category) {
      products = products.filter((p) => p.category === query.category);
    }
    if (query.search) {
      const search = query.search.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.nameAr.toLowerCase().includes(search),
      );
    }
    if (query.limit) {
      products = products.slice(0, Number(query.limit));
    }

    const mapped = products.map((p) => ({
      id: String(p.id),
      name: p.name,
      nameAr: p.nameAr,
      description: p.description ?? undefined,
      price: Number(p.price),
      originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
      imageUrl: p.imageUrl,
      category: p.category,
      inStock: p.inStock,
      discount: p.discount ?? 0,
      rating: p.rating ? Number(p.rating) : 4.5,
      reviewCount: p.reviewCount ?? 0,
    }));

    res.json(mapped);
  } catch (err) {
    req.log.error({ err }, "Failed to list products");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/products/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [product] = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, id));

    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    res.json({
      id: String(product.id),
      name: product.name,
      nameAr: product.nameAr,
      description: product.description ?? undefined,
      price: Number(product.price),
      originalPrice: product.originalPrice
        ? Number(product.originalPrice)
        : undefined,
      imageUrl: product.imageUrl,
      category: product.category,
      inStock: product.inStock,
      discount: product.discount ?? 0,
      rating: product.rating ? Number(product.rating) : 4.5,
      reviewCount: product.reviewCount ?? 0,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get product");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
