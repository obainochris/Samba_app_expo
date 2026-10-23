import { getAuth } from "@clerk/express";
import { and, desc, eq, inArray } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  ListProviderBookingsResponse,
  UpdateProviderBookingTrackingBody,
  UpdateProviderBookingTrackingResponse,
} from "@workspace/api-zod";
import { db, sambaBookingsTable, sambaProvidersTable } from "@workspace/db";
import { isConfiguredAdminUser, requireSignedIn } from "../lib/auth";

const router: IRouter = Router();

router.get("/provider/bookings", requireSignedIn, async (req, res): Promise<void> => {
  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: "Sign in to view provider bookings." });
    return;
  }
  const providers = await db
    .select({ id: sambaProvidersTable.id })
    .from(sambaProvidersTable)
    .where(eq(sambaProvidersTable.ownerUserId, userId));
  const providerIds = providers.map((provider) => provider.id);
  if (providerIds.length === 0) {
    res.json(ListProviderBookingsResponse.parse([]));
    return;
  }
  const bookings = await db
    .select()
    .from(sambaBookingsTable)
    .where(inArray(sambaBookingsTable.providerId, providerIds))
    .orderBy(desc(sambaBookingsTable.createdAt))
    .limit(200);
  res.json(ListProviderBookingsResponse.parse(bookings));
});

router.patch("/provider/bookings/:bookingId/tracking", requireSignedIn, async (req, res): Promise<void> => {
  const parsed = UpdateProviderBookingTrackingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const userId = getAuth(req).userId;
  const bookingId = Array.isArray(req.params.bookingId) ? req.params.bookingId[0] : req.params.bookingId;
  if (!userId) {
    res.status(401).json({ error: "Sign in to update provider bookings." });
    return;
  }
  const [booking] = await db
    .select()
    .from(sambaBookingsTable)
    .where(eq(sambaBookingsTable.id, bookingId));
  if (!booking) {
    res.status(404).json({ error: "Booking not found." });
    return;
  }
  const [provider] = await db
    .select({ ownerUserId: sambaProvidersTable.ownerUserId })
    .from(sambaProvidersTable)
    .where(eq(sambaProvidersTable.id, booking.providerId));
  if (!provider || (provider.ownerUserId !== userId && !(await isConfiguredAdminUser(userId)))) {
    res.status(403).json({ error: "This booking is not assigned to your provider account." });
    return;
  }
  const trackingStatus = parsed.data.trackingStatus;
  const [updated] = await db
    .update(sambaBookingsTable)
    .set({
      trackingStatus,
      ...(trackingStatus === "completed" ? { status: "completed" } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(sambaBookingsTable.id, bookingId), eq(sambaBookingsTable.providerId, booking.providerId)))
    .returning();
  res.json(UpdateProviderBookingTrackingResponse.parse(updated));
});

export default router;
