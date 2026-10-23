import { clerkClient, getAuth } from "@clerk/express";
import { and, count, desc, eq, sum } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  GetAdminAccessResponse,
  GetAdminOverviewResponse,
  ListAdminBookingsResponse,
  ListAdminClientsResponse,
  ListAdminIssuesResponse,
  ListAdminProvidersResponse,
  UpdateAdminBookingBody,
  UpdateAdminBookingResponse,
  UpdateAdminClientBody,
  UpdateAdminClientResponse,
  UpdateAdminIssueBody,
  UpdateAdminIssueResponse,
  UpdateAdminProviderBody,
  UpdateAdminProviderResponse,
} from "@workspace/api-zod";
import {
  db,
  sambaBookingsTable,
  sambaIssuesTable,
  sambaProvidersTable,
} from "@workspace/db";
import {
  getConfiguredAdminEmails,
  getVerifiedPrimaryEmail,
  isConfiguredAdminUser,
  requireSignedIn,
  requireSambaAdmin,
} from "../lib/auth";

const router: IRouter = Router();

function clientResponse(user: Awaited<ReturnType<typeof clerkClient.users.getUser>>) {
  const email = user.emailAddresses.find((item) => item.id === user.primaryEmailAddressId);
  return {
    id: user.id,
    email: email?.emailAddress ?? "",
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    imageUrl: user.imageUrl ?? "",
    banned: user.banned,
    createdAt: new Date(user.createdAt).toISOString(),
  };
}

router.get("/admin/me", requireSignedIn, async (req, res): Promise<void> => {
  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: "Sign in to continue." });
    return;
  }
  const email = await getVerifiedPrimaryEmail(userId);
  res.json(GetAdminAccessResponse.parse({
    isAdmin: await isConfiguredAdminUser(userId),
    email: email ?? "",
  }));
});

router.get("/admin/overview", requireSambaAdmin, async (_req, res): Promise<void> => {
  const [clientResult, providerResult, pendingProviderResult, upcomingResult, completedResult, issueResult, revenueResult] = await Promise.all([
    clerkClient.users.getUserList({ limit: 1 }),
    db.select({ value: count() }).from(sambaProvidersTable),
    db.select({ value: count() }).from(sambaProvidersTable).where(eq(sambaProvidersTable.approvalStatus, "pending")),
    db.select({ value: count() }).from(sambaBookingsTable).where(eq(sambaBookingsTable.status, "upcoming")),
    db.select({ value: count() }).from(sambaBookingsTable).where(eq(sambaBookingsTable.status, "completed")),
    db.select({ value: count() }).from(sambaIssuesTable).where(eq(sambaIssuesTable.status, "open")),
    db.select({ value: sum(sambaBookingsTable.totalAmountNaira) }).from(sambaBookingsTable).where(eq(sambaBookingsTable.status, "completed")),
  ]);
  res.json(GetAdminOverviewResponse.parse({
    clientCount: clientResult.totalCount,
    providerCount: providerResult[0]?.value ?? 0,
    pendingProviderCount: pendingProviderResult[0]?.value ?? 0,
    upcomingBookingCount: upcomingResult[0]?.value ?? 0,
    completedBookingCount: completedResult[0]?.value ?? 0,
    openIssueCount: issueResult[0]?.value ?? 0,
    grossRevenueNaira: Number(revenueResult[0]?.value ?? 0),
  }));
});

router.get("/admin/providers", requireSambaAdmin, async (_req, res): Promise<void> => {
  const rows = await db.select().from(sambaProvidersTable).orderBy(sambaProvidersTable.name);
  res.json(ListAdminProvidersResponse.parse(rows));
});

router.patch("/admin/providers/:providerId", requireSambaAdmin, async (req, res): Promise<void> => {
  const parsed = UpdateAdminProviderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const providerId = Array.isArray(req.params.providerId) ? req.params.providerId[0] : req.params.providerId;
  const [provider] = await db
    .update(sambaProvidersTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(sambaProvidersTable.id, providerId))
    .returning();
  if (!provider) {
    res.status(404).json({ error: "Provider profile not found." });
    return;
  }
  res.json(UpdateAdminProviderResponse.parse(provider));
});

router.get("/admin/clients", requireSambaAdmin, async (_req, res): Promise<void> => {
  const result = await clerkClient.users.getUserList({ limit: 100, orderBy: "-created_at" });
  res.json(ListAdminClientsResponse.parse(result.data.map(clientResponse)));
});

router.patch("/admin/clients/:userId", requireSambaAdmin, async (req, res): Promise<void> => {
  const parsed = UpdateAdminClientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  const currentAdminId = getAuth(req).userId;
  if (userId === currentAdminId || (await isConfiguredAdminUser(userId))) {
    res.status(403).json({ error: "Administrator accounts cannot be suspended here." });
    return;
  }
  const updated = parsed.data.banned
    ? await clerkClient.users.banUser(userId)
    : await clerkClient.users.unbanUser(userId);
  res.json(UpdateAdminClientResponse.parse(clientResponse(updated)));
});

router.get("/admin/bookings", requireSambaAdmin, async (_req, res): Promise<void> => {
  const rows = await db.select().from(sambaBookingsTable).orderBy(desc(sambaBookingsTable.createdAt)).limit(200);
  res.json(ListAdminBookingsResponse.parse(rows));
});

router.patch("/admin/bookings/:bookingId", requireSambaAdmin, async (req, res): Promise<void> => {
  const parsed = UpdateAdminBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const bookingId = Array.isArray(req.params.bookingId) ? req.params.bookingId[0] : req.params.bookingId;
  const changes = parsed.data;
  const [booking] = await db
    .update(sambaBookingsTable)
    .set({
      ...changes,
      ...(changes.trackingStatus === "completed" ? { status: "completed" } : {}),
      updatedAt: new Date(),
    })
    .where(eq(sambaBookingsTable.id, bookingId))
    .returning();
  if (!booking) {
    res.status(404).json({ error: "Booking not found." });
    return;
  }
  res.json(UpdateAdminBookingResponse.parse(booking));
});

router.get("/admin/issues", requireSambaAdmin, async (_req, res): Promise<void> => {
  const rows = await db.select().from(sambaIssuesTable).orderBy(desc(sambaIssuesTable.createdAt)).limit(200);
  res.json(ListAdminIssuesResponse.parse(rows));
});

router.patch("/admin/issues/:issueId", requireSambaAdmin, async (req, res): Promise<void> => {
  const parsed = UpdateAdminIssueBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const issueId = Array.isArray(req.params.issueId) ? req.params.issueId[0] : req.params.issueId;
  const [issue] = await db
    .update(sambaIssuesTable)
    .set({ status: parsed.data.status, updatedAt: new Date() })
    .where(eq(sambaIssuesTable.id, issueId))
    .returning();
  if (!issue) {
    res.status(404).json({ error: "Issue report not found." });
    return;
  }
  res.json(UpdateAdminIssueResponse.parse(issue));
});

export default router;
