import { Router, type IRouter } from "express";
import { db, offersTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/offers", async (req, res) => {
  try {
    const offers = await db.select().from(offersTable);
    const mapped = offers.map((o) => ({
      id: String(o.id),
      title: o.title,
      titleAr: o.titleAr,
      description: o.description ?? undefined,
      discount: o.discount,
      imageUrl: o.imageUrl,
      validUntil: o.validUntil ? o.validUntil.toISOString() : undefined,
      productId: o.productId ?? undefined,
    }));
    res.json(mapped);
  } catch (err) {
    req.log.error({ err }, "Failed to list offers");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
