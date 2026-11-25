import React from "react";
import { redirect } from "next/navigation";
import { getAuthSession, isStaffRole } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AdminPanel } from "@/components/admin/AdminPanel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=%2Fadmin");
  }
  if (!isStaffRole(session.user.role)) {
    redirect("/portal");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#FAFAFA] text-[#1E2127]">
      <Navbar />
      <main id="main-content" tabIndex={-1} className="flex-1 py-8">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <AdminPanel />
        </div>
      </main>
      <Footer />
    </div>
  );
}
