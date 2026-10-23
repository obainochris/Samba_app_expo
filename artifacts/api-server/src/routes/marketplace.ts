import { clerkClient, getAuth } from "@clerk/express";
import { and, desc, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CancelBookingResponse,
  CreateBookingBody,
  CreateBookingResponse,
  CreateIssueBody,
  CreateIssueResponse,
  ListMarketplaceProvidersResponse,
  ListMyBookingsResponse,
} from "@workspace/api-zod";
import {
  db,
  sambaBookingsTable,
  sambaIssuesTable,
  sambaProvidersTable,
} from "@workspace/db";
import { requireSignedIn } from "../lib/auth";

const router: IRouter = Router();

function parseNaira(value: string): number {
  const amount = Number(value.replace(/[^\d]/g, ""));
  return Number.isFinite(amount) ? amount : 0;
}

function formatNaira(value: number): string {
  return `₦${Math.round(value).toLocaleString("en-NG")}`;
}

async function getCurrentUserProfile(userId: string) {
  const user = await clerkClient.users.getUser(userId);
  const primaryEmail = user.emailAddresses.find(
    (email) => email.id === user.primaryEmailAddressId,
  );
  return {
    clientName: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || "Samba client",
    clientEmail: primaryEmail?.emailAddress ?? "",
  };
}

router.get("/providers", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(sambaProvidersTable)
    .where(and(eq(sambaProvidersTable.isLive, true), eq(sambaProvidersTable.approvalStatus, "approved")))
    .orderBy(sambaProvidersTable.name);
  res.json(ListMarketplaceProvidersResponse.parse(rows));
});

router.get("/bookings", requireSignedIn, async (req, res): Promise<void> => {
  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: "Sign in to view bookings." });
    return;
  }
  const rows = await db
    .select()
    .from(sambaBookingsTable)
    .where(eq(sambaBookingsTable.clientUserId, userId))
    .orderBy(desc(sambaBookingsTable.createdAt));
  res.json(ListMyBookingsResponse.parse(rows));
});

router.post("/bookings", requireSignedIn, async (req, res): Promise<void> => {
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: "Sign in to create a booking." });
    return;
  }

  const [provider] = await db
    .select()
    .from(sambaProvidersTable)
    .where(eq(sambaProvidersTable.id, parsed.data.providerId));
  if (!provider || !provider.isLive || provider.approvalStatus !== "approved") {
    res.status(409).json({ error: "This provider is not currently accepting bookings." });
    return;
  }
  const selectedService = provider.services.find((service) => service.name === parsed.data.serviceName);
  if (!selectedService) {
    res.status(400).json({ error: "That service is not listed for this provider." });
    return;
  }
  const distanceKm = parsed.data.mode === "home" ? parsed.data.distanceKm ?? null : null;
  if (parsed.data.mode === "home" && (
    distanceKm === null ||
    distanceKm < 0 ||
    distanceKm > provider.serviceRadiusKm ||
    !parsed.data.clientAddress?.trim()
  )) {
    res.status(400).json({ error: "A valid in-range service address is required for a house call." });
    return;
  }

  const client = await getCurrentUserProfile(userId);
  const servicePriceNaira = parseNaira(selectedService.price);
  const travelFee = distanceKm === null
    ? 0
    : Math.round((provider.baseTravelFee + Math.max(0, distanceKm - 2) * provider.travelFeePerKm) / 100) * 100;
  const totalAmountNaira = servicePriceNaira + travelFee;
  const [booking] = await db
    .insert(sambaBookingsTable)
    .values({
      clientUserId: userId,
      ...client,
      providerId: provider.id,
      providerName: provider.name,
      serviceName: parsed.data.serviceName,
      date: parsed.data.date,
      time: parsed.data.time,
      mode: parsed.data.mode,
      price: formatNaira(totalAmountNaira),
      servicePrice: selectedService.price,
      totalAmountNaira,
      location: parsed.data.location,
      clientAddress: parsed.data.clientAddress ?? null,
      gateInstructions: parsed.data.gateInstructions ?? null,
      distanceKm,
      travelFee,
      etaMinutes: distanceKm === null ? null : Math.max(15, Math.round(distanceKm * 5 + 10)),
      trackingStatus: parsed.data.mode === "home" ? "confirmed" : null,
      status: "upcoming",
    })
    .returning();

  res.status(201).json(CreateBookingResponse.parse(booking));
});

router.patch("/bookings/:bookingId/cancel", requireSignedIn, async (req, res): Promise<void> => {
  const userId = getAuth(req).userId;
  const bookingId = Array.isArray(req.params.bookingId) ? req.params.bookingId[0] : req.params.bookingId;
  if (!userId) {
    res.status(401).json({ error: "Sign in to cancel a booking." });
    return;
  }
  const [booking] = await db
    .update(sambaBookingsTable)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(and(eq(sambaBookingsTable.id, bookingId), eq(sambaBookingsTable.clientUserId, userId)))
    .returning();
  if (!booking) {
    res.status(404).json({ error: "Booking not found." });
    return;
  }
  res.json(CancelBookingResponse.parse(booking));
});

router.post("/issues", requireSignedIn, async (req, res): Promise<void> => {
  const parsed = CreateIssueBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: "Sign in to report an issue." });
    return;
  }

  if (parsed.data.bookingId) {
    const [booking] = await db
      .select({ id: sambaBookingsTable.id })
      .from(sambaBookingsTable)
      .where(and(eq(sambaBookingsTable.id, parsed.data.bookingId), eq(sambaBookingsTable.clientUserId, userId)));
    if (!booking) {
      res.status(404).json({ error: "Booking not found." });
      return;
    }
  }

  const client = await getCurrentUserProfile(userId);
  const [issue] = await db
    .insert(sambaIssuesTable)
    .values({
      clientUserId: userId,
      clientEmail: client.clientEmail,
      bookingId: parsed.data.bookingId ?? null,
      category: parsed.data.category,
      description: parsed.data.description,
      status: "open",
    })
    .returning();
  res.status(201).json(CreateIssueResponse.parse(issue));
});

export default router;
