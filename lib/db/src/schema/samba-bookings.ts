import { createInsertSchema } from "drizzle-zod";
import { index, integer, pgTable, real, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const sambaBookingsTable = pgTable("samba_bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientUserId: text("client_user_id").notNull(),
  clientName: text("client_name").notNull().default("Samba client"),
  clientEmail: text("client_email").notNull().default(""),
  providerId: text("provider_id").notNull(),
  providerName: text("provider_name").notNull(),
  serviceName: text("service_name").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  mode: text("mode").notNull(),
  price: text("price").notNull(),
  servicePrice: text("service_price"),
  totalAmountNaira: integer("total_amount_naira").notNull().default(0),
  location: text("location").notNull(),
  clientAddress: text("client_address"),
  gateInstructions: text("gate_instructions"),
  distanceKm: real("distance_km"),
  travelFee: integer("travel_fee"),
  etaMinutes: integer("eta_minutes"),
  trackingStatus: text("tracking_status"),
  status: text("status").notNull().default("upcoming"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [index("samba_bookings_client_user_id_idx").on(table.clientUserId), index("samba_bookings_provider_id_idx").on(table.providerId)]);

export const insertSambaBookingSchema = createInsertSchema(sambaBookingsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSambaBooking = z.infer<typeof insertSambaBookingSchema>;
export type SambaBooking = typeof sambaBookingsTable.$inferSelect;
