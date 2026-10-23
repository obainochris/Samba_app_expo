import { clerkClient, getAuth } from "@clerk/express";
import type { RequestHandler } from "express";

export function getConfiguredAdminEmails(): Set<string> {
  return new Set(
    (process.env.SAMBA_ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export async function getVerifiedPrimaryEmail(userId: string): Promise<string | null> {
  const user = await clerkClient.users.getUser(userId);
  const primaryEmail = user.emailAddresses.find(
    (email) => email.id === user.primaryEmailAddressId,
  );
  if (!primaryEmail || primaryEmail.verification?.status !== "verified") return null;
  return primaryEmail.emailAddress.trim().toLowerCase();
}

export async function isConfiguredAdminUser(userId: string): Promise<boolean> {
  const allowedEmails = getConfiguredAdminEmails();
  if (allowedEmails.size === 0) return false;
  const email = await getVerifiedPrimaryEmail(userId);
  return email !== null && allowedEmails.has(email);
}

export const requireSignedIn: RequestHandler = (req, res, next) => {
  if (!getAuth(req).userId) {
    res.status(401).json({ error: "Sign in to continue." });
    return;
  }
  next();
};

export const requireSambaAdmin: RequestHandler = async (req, res, next) => {
  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: "Sign in to continue." });
    return;
  }

  try {
    if (!(await isConfiguredAdminUser(userId))) {
      res.status(403).json({ error: "Administrator access required." });
      return;
    }
    next();
  } catch (error) {
    req.log.error({ err: error }, "Could not verify Samba administrator access");
    res.status(503).json({ error: "Administrator access could not be verified." });
  }
};
