import { NextResponse } from "next/server";

// Sonde de santé et de déploiement : renvoie l'identifiant du build
// (SHA git en CI, cf. next.config.ts). Sans dépendance externe.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ buildId: process.env.NEXT_PUBLIC_BUILD_ID ?? "dev" });
}
