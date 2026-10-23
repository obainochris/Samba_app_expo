import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, jsonb, pgTable, real, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export type SambaService = { name: string; duration: string; price: string };

export const sambaProvidersTable = pgTable("samba_providers", {
  id: text("id").primaryKey(),
  ownerUserId: text("owner_user_id"),
  name: text("name").notNull(),
  firstName: text("first_name").notNull(),
  category: text("category").notNull(),
  specialty: text("specialty").notNull(),
  rating: real("rating").notNull().default(5),
  reviews: integer("reviews").notNull().default(0),
  location: text("location").notNull(),
  distance: text("distance").notNull().default(""),
  price: text("price").notNull(),
  verified: boolean("verified").notNull().default(false),
  availableToday: boolean("available_today").notNull().default(true),
  bio: text("bio").notNull().default(""),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  serviceRadiusKm: real("service_radius_km").notNull().default(8),
  baseTravelFee: integer("base_travel_fee").notNull().default(0),
  travelFeePerKm: integer("travel_fee_per_km").notNull().default(0),
  services: jsonb("services").$type<SambaService[]>().notNull().default([]),
  isLive: boolean("is_live").notNull().default(true),
  approvalStatus: text("approval_status").notNull().default("approved"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSambaProviderSchema = createInsertSchema(sambaProvidersTable).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertSambaProvider = z.infer<typeof insertSambaProviderSchema>;
export type SambaProvider = typeof sambaProvidersTable.$inferSelect;
