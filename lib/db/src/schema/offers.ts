import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const offersTable = pgTable("offers", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  titleAr: text("title_ar").notNull(),
  description: text("description"),
  discount: integer("discount").notNull(),
  imageUrl: text("image_url").notNull(),
  validUntil: timestamp("valid_until", { withTimezone: true }),
  productId: text("product_id"),
});

export const insertOfferSchema = createInsertSchema(offersTable).omit({ id: true });
export type InsertOffer = z.infer<typeof insertOfferSchema>;
export type Offer = typeof offersTable.$inferSelect;
