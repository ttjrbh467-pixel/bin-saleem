import { Router, type IRouter } from "express";
import { db, categoriesTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/categories", async (req, res) => {
  try {
    const categories = await db.select().from(categoriesTable);
    const mapped = categories.map((c) => ({
      id: String(c.id),
      name: c.name,
      nameAr: c.nameAr,
      icon: c.icon,
      productCount: c.productCount ?? 0,
    }));
    res.json(mapped);
  } catch (err) {
    req.log.error({ err }, "Failed to list categories");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
