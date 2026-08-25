import { Router, type IRouter } from "express";
import { db, ordersTable, productsTable } from "@workspace/db";
import { CreateOrderBody, ListOrdersQueryParams } from "@workspace/api-zod";
import { eq, count, sum } from "drizzle-orm";

const router: IRouter = Router();

router.get("/orders", async (req, res) => {
  try {
    const query = ListOrdersQueryParams.parse(req.query);
    let orders = await db.select().from(ordersTable).orderBy(ordersTable.createdAt);

    if (query.userId) {
      orders = orders.filter((o) => o.userId === query.userId);
    }

    const mapped = orders.map((o) => ({
      id: String(o.id),
      userId: o.userId,
      items: o.items as Array<{ productId: string; quantity: number; price: number }>,
      total: Number(o.total),
      status: o.status,
      createdAt: o.createdAt.toISOString(),
    }));

    res.json(mapped);
  } catch (err) {
    req.log.error({ err }, "Failed to list orders");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/orders", async (req, res) => {
  try {
    const body = CreateOrderBody.parse(req.body);

    const [order] = await db
      .insert(ordersTable)
      .values({
        userId: body.userId,
        items: body.items,
        total: String(body.total),
        status: "pending",
      })
      .returning();

    res.status(201).json({
      id: String(order.id),
      userId: order.userId,
      items: order.items as Array<{ productId: string; quantity: number; price: number }>,
      total: Number(order.total),
      status: order.status,
      createdAt: order.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create order");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboard/summary", async (req, res) => {
  try {
    const orders = await db.select().from(ordersTable);
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
    const [{ count: productCount }] = await db
      .select({ count: count() })
      .from(productsTable);

    const uniqueUsers = new Set(orders.map((o) => o.userId)).size;
    const recentOrders = orders
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5)
      .map((o) => ({
        id: String(o.id),
        userId: o.userId,
        items: o.items as Array<{ productId: string; quantity: number; price: number }>,
        total: Number(o.total),
        status: o.status,
        createdAt: o.createdAt.toISOString(),
      }));

    res.json({
      totalOrders,
      totalRevenue,
      totalProducts: Number(productCount),
      totalUsers: uniqueUsers,
      recentOrders,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get dashboard summary");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
