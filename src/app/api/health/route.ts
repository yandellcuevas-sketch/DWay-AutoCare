import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isPostgresEnv } from "@/lib/db-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const servicesCount = await prisma.service.count();
    return NextResponse.json({
      status: "ok",
      engine: isPostgresEnv() ? "postgresql" : "sqlite",
      servicesCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ status: "error", error: String(error) }, { status: 500 });
  }
}
