import { createInsertSchema } from "drizzle-zod";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const sambaIssuesTable = pgTable("samba_issues", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientUserId: text("client_user_id").notNull(),
  clientEmail: text("client_email").notNull().default(""),
  bookingId: uuid("booking_id"),
  category: text("category").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [index("samba_issues_status_idx").on(table.status), index("samba_issues_client_user_id_idx").on(table.clientUserId)]);

export const insertSambaIssueSchema = createInsertSchema(sambaIssuesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSambaIssue = z.infer<typeof insertSambaIssueSchema>;
export type SambaIssue = typeof sambaIssuesTable.$inferSelect;
