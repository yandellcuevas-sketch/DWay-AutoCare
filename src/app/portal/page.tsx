import React from "react";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ClientPortal } from "@/components/portal/ClientPortal";

export const dynamic = "force-dynamic";

export default async function PortalPage({
  searchParams,
}: {
  searchParams: { tab?: string; plan?: string; cycle?: string };
}) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=%2Fportal");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#FAFAFA] text-[#1E2127]">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="flex-1 py-8 sm:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ClientPortal
            initialTab={searchParams.tab}
            preselectedPlanId={searchParams.plan}
            preselectedCycle={searchParams.cycle}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
