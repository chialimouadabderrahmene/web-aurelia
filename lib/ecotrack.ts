import { prisma } from "@/lib/prisma";
import { WILAYA_BY_NAME } from "@/lib/geo/wilayas-list";

type OrderForEcotrack = {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  wilaya: string;
  commune: string;
  address: string;
  totalAmount: number;
  discountAmount: number;
  giftCardAmount: number;
  deliveryPrice: number;
  deliveryType: "HOME" | "STOPDESK";
  statusNote: string | null;
  items: { nameEn: string; qty: number }[];
};

export type EcotrackResult =
  | { ok: true; trackingId: string; raw: unknown }
  | { ok: false; error: string; raw?: unknown };

export type EcotrackActionResult = { ok: true; raw: unknown } | { ok: false; error: string; raw?: unknown };

async function getConfig() {
  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  if (!settings?.ecotrackEnabled || !settings.ecotrackBaseUrl || !settings.ecotrackApiToken) {
    return null;
  }
  return { baseUrl: settings.ecotrackBaseUrl.replace(/\/$/, ""), token: settings.ecotrackApiToken };
}

function buildUrl(baseUrl: string, path: string, params: Record<string, string | number | undefined | null>) {
  const url = new URL(baseUrl + path);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }
  return url;
}

async function call(
  path: string,
  method: "GET" | "POST" | "DELETE",
  params: Record<string, string | number | undefined | null>
): Promise<{ ok: boolean; status: number; raw: unknown }> {
  const config = await getConfig();
  if (!config) throw new Error("EcoTrack integration not configured");

  const url = buildUrl(config.baseUrl, path, { ...params, api_token: config.token });
  const res = await fetch(url.toString(), { method });
  const raw = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, raw };
}

function errorMessage(raw: unknown, fallback: string): string {
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (typeof obj.message === "string") return obj.message;
    if (obj.errors && typeof obj.errors === "object") {
      const first = Object.values(obj.errors as Record<string, unknown>)[0];
      if (Array.isArray(first) && typeof first[0] === "string") return first[0];
    }
  }
  return fallback;
}

export async function validateEcotrackToken(): Promise<{ ok: boolean; message: string }> {
  try {
    const { raw } = await call("/api/v1/validate/token", "GET", {});
    const obj = raw as { success?: boolean; message?: string } | null;
    return { ok: !!obj?.success, message: obj?.message ?? "Unknown response" };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Network error" };
  }
}

export async function createEcotrackParcel(order: OrderForEcotrack): Promise<EcotrackResult> {
  const wilayaInfo = WILAYA_BY_NAME[order.wilaya];
  const amountDue = order.totalAmount - order.discountAmount - order.giftCardAmount + order.deliveryPrice;
  const productNames = order.items.map((i) => `${i.nameEn} x${i.qty}`).join(", ");

  try {
    const { ok, raw } = await call("/api/v1/create/order", "POST", {
      reference: order.orderNumber,
      nom_client: order.customerName,
      telephone: order.phone,
      adresse: order.address,
      commune: order.commune,
      code_wilaya: wilayaInfo ? Number(wilayaInfo.code) : undefined,
      montant: amountDue,
      remarque: order.statusNote ?? undefined,
      produit: productNames,
      type: order.deliveryType === "STOPDESK" ? 2 : 1,
    });

    const obj = raw as { success?: boolean; tracking?: string } | null;
    if (!ok || !obj?.success || !obj.tracking) {
      return { ok: false, error: errorMessage(raw, "EcoTrack refused the parcel"), raw };
    }
    return { ok: true, trackingId: obj.tracking, raw };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error calling EcoTrack" };
  }
}

export async function updateEcotrackParcel(
  trackingId: string,
  patch: Partial<{
    reference: string;
    client: string;
    tel: string;
    adresse: string;
    commune: string;
    wilaya: number;
    montant: number;
    remarque: string;
    product: string;
  }>
): Promise<EcotrackActionResult> {
  try {
    const { ok, raw } = await call("/api/v1/update/order", "POST", { tracking: trackingId, ...patch });
    if (!ok) return { ok: false, error: errorMessage(raw, "EcoTrack update failed"), raw };
    return { ok: true, raw };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error calling EcoTrack" };
  }
}

export async function deleteEcotrackParcel(trackingId: string): Promise<EcotrackActionResult> {
  try {
    const { ok, raw } = await call("/api/v1/delete/order", "DELETE", { tracking: trackingId });
    const obj = raw as { success?: boolean } | null;
    if (!ok || obj?.success === false) return { ok: false, error: errorMessage(raw, "EcoTrack delete failed"), raw };
    return { ok: true, raw };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error calling EcoTrack" };
  }
}

export async function shipEcotrackParcel(trackingId: string, askCollection = false): Promise<EcotrackActionResult> {
  try {
    const { ok, raw } = await call("/api/v1/valid/order", "POST", {
      tracking: trackingId,
      ask_collection: askCollection ? 1 : 0,
    });
    const obj = raw as { success?: boolean } | null;
    if (!ok || obj?.success === false) return { ok: false, error: errorMessage(raw, "EcoTrack shipping failed"), raw };
    return { ok: true, raw };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error calling EcoTrack" };
  }
}

export async function requestEcotrackReturn(trackingId: string): Promise<EcotrackActionResult> {
  try {
    const { ok, raw } = await call("/api/v1/ask/for/order/return", "POST", { tracking: trackingId });
    const obj = raw as { success?: boolean } | null;
    if (!ok || obj?.success === false) return { ok: false, error: errorMessage(raw, "EcoTrack return request failed"), raw };
    return { ok: true, raw };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error calling EcoTrack" };
  }
}

export async function addEcotrackRemark(trackingId: string, content: string): Promise<EcotrackActionResult> {
  try {
    const { ok, raw } = await call("/api/v1/add/maj", "POST", { tracking: trackingId, content });
    const obj = raw as { success?: boolean } | null;
    if (!ok || obj?.success === false) return { ok: false, error: errorMessage(raw, "EcoTrack remark failed"), raw };
    return { ok: true, raw };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error calling EcoTrack" };
  }
}

export async function getEcotrackUpdates(trackingId: string): Promise<
  { ok: true; updates: { remarque: string; station: string; livreur: string; createdAt: string }[] } | { ok: false; error: string }
> {
  try {
    const { ok, raw } = await call("/api/v1/get/maj", "GET", { tracking: trackingId });
    if (!ok || !Array.isArray(raw)) return { ok: false, error: errorMessage(raw, "Could not fetch EcoTrack updates") };
    const updates = (raw as Record<string, unknown>[]).map((u) => ({
      remarque: String(u.remarque ?? ""),
      station: String(u.station ?? ""),
      livreur: String(u.livreur ?? ""),
      createdAt: String(u.created_at ?? ""),
    }));
    return { ok: true, updates };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error calling EcoTrack" };
  }
}

export async function getEcotrackTrackingInfo(trackingId: string): Promise<{ ok: boolean; raw: unknown }> {
  const { ok, raw } = await call("/api/v1/get/tracking/info", "GET", { tracking: trackingId });
  return { ok, raw };
}

export async function getEcotrackLabelUrl(trackingId: string): Promise<string | null> {
  const config = await getConfig();
  if (!config) return null;
  return buildUrl(config.baseUrl, "/api/v1/get/order/label", { tracking: trackingId, api_token: config.token }).toString();
}

export async function getEcotrackWilayas(): Promise<{ wilaya_id: number; wilaya_name: string }[]> {
  const { ok, raw } = await call("/api/v1/get/wilayas", "GET", {});
  return ok && Array.isArray(raw) ? (raw as { wilaya_id: number; wilaya_name: string }[]) : [];
}

export async function getEcotrackFees(): Promise<unknown> {
  const { raw } = await call("/api/v1/get/fees", "GET", {});
  return raw;
}
