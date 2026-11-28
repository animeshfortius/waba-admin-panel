import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const JWT_SECRET =
  process.env.JWT_SECRET || "fortius-super-secret-waba-key-2026";
const GRAPH_VERSION = "v21.0";

type ActorRole =
  | "SUPER_ADMIN"
  | "WHITE_LABEL_RESELLER"
  | "RESELLER"
  | "USER";

function normalizeRole(rawRole?: string | null): ActorRole {
  const upper = String(rawRole || "USER").trim().toUpperCase();
  if (
    upper === "WHITE_LABEL_RESELLER" ||
    upper === "WHITE_LABEL" ||
    upper === "WHITELABEL"
  ) {
    return "WHITE_LABEL_RESELLER";
  }
  if (upper === "RESELLER") return "RESELLER";
  if (upper === "SUPER_ADMIN" || upper === "ADMIN") return "SUPER_ADMIN";
  return "USER";
}

function resolveUserBalance(u: any): number {
  const actual = Number(u?.actualBalance ?? 0);
  const wallet = Number(u?.walletBalance ?? 0);
  const virtualBal = Number(u?.virtualBalance ?? 0);

  if (Number.isFinite(actual) && actual !== 0) return actual;
  if (Number.isFinite(wallet) && wallet !== 0) return wallet;
  if (Number.isFinite(virtualBal) && virtualBal !== 0) return virtualBal;
  return Number.isFinite(actual) ? actual : 0;
}

async function verifyReportActor() {
  const cookieStore = await cookies();
  const token =
    cookieStore.get("token")?.value ||
    cookieStore.get("waba_token")?.value ||
    cookieStore.get("auth_token")?.value;

  if (!token) return null;

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded?.userId || decoded?.id || decoded?.sub;
    if (!userId) return null;

    if (userId === "emergency-admin-id") {
      return { id: "emergency-admin-id", role: "SUPER_ADMIN" as ActorRole };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) return null;

    const role = normalizeRole(user.role);
    if (!["SUPER_ADMIN", "WHITE_LABEL_RESELLER", "RESELLER"].includes(role)) {
      return null;
    }

    return { id: user.id, role };
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    const actor = await verifyReportActor();
    if (!actor) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin or Reseller access only" },
        { status: 401 }
      );
    }

    const isSuperAdmin = actor.role === "SUPER_ADMIN";
    const { searchParams } = new URL(req.url);
    const days = Number(searchParams.get("days") || 7);
    const selectedUserId = searchParams.get("userId") || "ALL";
    const liveFetch = searchParams.get("live") !== "false";
    const startParam = searchParams.get("startDate");
    const endParam = searchParams.get("endDate");

    let sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    let untilDate = new Date();

    if (startParam && endParam) {
      const parsedStart = new Date(`${startParam}T00:00:00.000Z`);
      const parsedEnd = new Date(`${endParam}T23:59:59.999Z`);
      if (!isNaN(parsedStart.getTime()) && !isNaN(parsedEnd.getTime())) {
        sinceDate = parsedStart;
        untilDate = parsedEnd;
      }
    }

    const unixStart = Math.floor(sinceDate.getTime() / 1000);
    const unixEnd = Math.floor(untilDate.getTime() / 1000);

    const allowedScopeWhere: Prisma.UserWhereInput = isSuperAdmin
      ? { role: { not: Role.SUPER_ADMIN } }
      : {
          AND: [
            { role: { not: Role.SUPER_ADMIN } },
            {
              OR: [{ id: actor.id }, { createdById: actor.id }],
            },
          ],
        };

    if (selectedUserId !== "ALL" && !isSuperAdmin) {
      const targetAllowed = await prisma.user.findFirst({
        where: {
          AND: [{ id: selectedUserId }, allowedScopeWhere],
        },
        select: { id: true },
      });
      if (!targetAllowed) {
        return NextResponse.json(
          { success: false, error: "Forbidden: User outside your account scope" },
          { status: 403 }
        );
      }
    }

    const rawUsers = await prisma.user.findMany({
      where:
        selectedUserId !== "ALL"
          ? {
              AND: [{ id: selectedUserId }, allowedScopeWhere],
            }
          : allowedScopeWhere,
      include: {
        wabaAccounts: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const scopedUsers = rawUsers.filter(
      (u: any) => String(u?.role || "").trim().toUpperCase() !== "SUPER_ADMIN"
    );

    const users = scopedUsers.map((u: any) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      email: u.email,
      role: u.role,
      apiKey:
        u.apiKey ||
        u.api_key ||
        u.panelApiKey ||
        (Array.isArray(u.apiKeys)
          ? u.apiKeys[0]?.key || u.apiKeys[0]?.token || ""
          : "") ||
        "",
      actualBalance: u.actualBalance,
      walletBalance: u.walletBalance,
      virtualBalance: u.virtualBalance,
      wabaAccounts: u.wabaAccounts || [],
    }));

    const scopedUserIds = users.map((u) => u.id);

    const logs =
      scopedUserIds.length > 0
        ? await prisma.campaignLog.findMany({
            where: {
              createdAt: { gte: sinceDate, lte: untilDate },
              userId: { in: scopedUserIds },
            },
            select: {
              userId: true,
              channel: true,
              status: true,
              cost: true,
            },
          })
        : [];

    const userReports = await Promise.all(
      users.map(async (u) => {
        const userLogs = logs.filter((l) => l.userId === u.id);

        const localSent = userLogs.length;
        const localDelivered = userLogs.filter((l) =>
          ["DELIVERED", "READ"].includes(String(l.status).toUpperCase())
        ).length;
        const localRead = userLogs.filter(
          (l) => String(l.status).toUpperCase() === "READ"
        ).length;
        const localFailed = userLogs.filter((l) =>
          ["FAILED", "UNDELIVERED", "ERROR"].includes(
            String(l.status).toUpperCase()
          )
        ).length;
        const totalSpend = userLogs.reduce(
          (acc, item) => acc + Number(item.cost || 0),
          0
        );

        let metaSent = 0;
        let metaDelivered = 0;
        let metaRead = 0;
        const wabaDetails: any[] = [];

        for (const waba of u.wabaAccounts) {
          let phoneStatus = waba.status || "UNKNOWN";
          let qualityRating = waba.qualityRating || "UNKNOWN";
          let messagingLimit = waba.messagingLimit || "TIER_NOT_FOUND";
          let verifiedName = waba.displayName || waba.displayPhone;
          let metaSyncError: string | null = null;

          if (liveFetch && waba.accessToken && waba.phoneNumberId) {
            try {
              const phoneRes = await fetch(
                `https://graph.facebook.com/${GRAPH_VERSION}/${waba.phoneNumberId}?fields=display_phone_number,verified_name,quality_rating,messaging_limit_tier,status&access_token=${waba.accessToken}`,
                { cache: "no-store" }
              );
              const phoneData = await phoneRes.json();

              if (phoneRes.ok && !phoneData.error) {
                phoneStatus = phoneData.status || phoneStatus;
                qualityRating = phoneData.quality_rating || qualityRating;
                messagingLimit =
                  phoneData.messaging_limit_tier || messagingLimit;
                verifiedName = phoneData.verified_name || verifiedName;

                await prisma.wabaAccount.update({
                  where: { id: waba.id },
                  data: {
                    status: phoneStatus,
                    qualityRating,
                    messagingLimit,
                    displayName: verifiedName,
                  },
                });
              } else if (phoneData.error) {
                metaSyncError = phoneData.error.message || "Meta API Error";
              }

              if (waba.wabaId) {
                const analyticsUrl = `https://graph.facebook.com/${GRAPH_VERSION}/${waba.wabaId}?fields=analytics.start(${unixStart}).end(${unixEnd}).granularity(DAY).phone_numbers([${waba.phoneNumberId}])&access_token=${waba.accessToken}`;
                const analyticsRes = await fetch(analyticsUrl, {
                  cache: "no-store",
                });
                const analyticsJson = await analyticsRes.json();

                const dataPoints =
                  analyticsJson?.analytics?.data_points || [];
                for (const pt of dataPoints) {
                  metaSent += Number(pt.sent || 0);
                  metaDelivered += Number(pt.delivered || 0);
                  metaRead += Number(pt.read || 0);
                }
              }
            } catch (err: any) {
              metaSyncError = err?.message || "Network error fetching Meta";
            }
          }

          wabaDetails.push({
            id: waba.id,
            wabaId: waba.wabaId,
            phoneNumberId: waba.phoneNumberId,
            displayPhone: waba.displayPhone,
            verifiedName,
            status: phoneStatus,
            qualityRating,
            messagingLimit,
            metaSyncError,
          });
        }

        const effectiveSent = metaSent > 0 ? metaSent : localSent;
        const effectiveDelivered =
          metaDelivered > 0 ? metaDelivered : localDelivered;
        const effectiveRead = metaRead > 0 ? metaRead : localRead;

        const resolvedBalance = Number(resolveUserBalance(u).toFixed(2));

        return {
          userId: u.id,
          name: u.name || u.username || "User",
          username: u.username || "-",
          email: u.email,
          role: u.role,
          apiKey: u.apiKey,
          actualBalance: resolvedBalance,
          walletBalance: resolvedBalance,
          virtualBalance: Number(Number(u.virtualBalance ?? 0).toFixed(2)),
          wabaCount: wabaDetails.length,
          wabas: wabaDetails,
          metrics: {
            sent: effectiveSent,
            delivered: effectiveDelivered,
            read: effectiveRead,
            failed: localFailed,
            metaSent,
            metaDelivered,
            localSent,
            spend: Number(totalSpend.toFixed(2)),
          },
        };
      })
    );

    const totals = userReports.reduce(
      (acc, item) => {
        acc.totalUsers += 1;
        acc.totalWabas += item.wabaCount;
        acc.sent += item.metrics.sent;
        acc.delivered += item.metrics.delivered;
        acc.read += item.metrics.read;
        acc.failed += item.metrics.failed;
        acc.spend += item.metrics.spend;
        return acc;
      },
      {
        totalUsers: 0,
        totalWabas: 0,
        sent: 0,
        delivered: 0,
        read: 0,
        failed: 0,
        spend: 0,
      }
    );

    return NextResponse.json({
      success: true,
      days,
      totals,
      reports: userReports,
    });
  } catch (error: any) {
    console.error("Admin Meta Reports API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}