import { getProductionConfigError } from "@/lib/fair-config";
import { checkFairStorageHealth } from "@/lib/fair-storage";

export const runtime = "nodejs";

export function GET() {
  try {
    if (getProductionConfigError()) throw new Error("Invalid production configuration");
    checkFairStorageHealth();
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ ok: false }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
