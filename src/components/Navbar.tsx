"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Menu,
  X,
  User,
  LogOut,
  Shield,
  CalendarPlus,
  LayoutDashboard,
} from "lucide-react";
import { DWayLogo } from "./DWayLogo";
import { isStaffRole } from "@/lib/auth-client";

const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/servicios", label: "Servicios" },
  { href: "/membresias", label: "Membresías" },
  { href: "/empresas", label: "Empresas" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/agendar", label: "Agendar cita" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isStaff = isStaffRole(session?.user?.role);
  const accountHref = isStaff ? "/admin" : "/portal";

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-[#FAFAFA]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center rounded-md focus-visible:outline-[#F50923]"
          onClick={() => setMobileOpen(false)}
        >
          <DWayLogo variant="dark" size="md" />
        </Link>

        {/* Desktop Nav */}
        <nav aria-label="Navegación principal" className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            const isCta = link.href === "/agendar";
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  isCta
                    ? "ml-2 inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-[#F50923] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#CC071D]"
                    : `inline-flex min-h-[42px] items-center rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                        active
                          ? "bg-[#1E2127] text-white"
                          : "text-[#1E2127] hover:bg-gray-100 hover:text-[#F50923]"
                      }`
                }
              >
                {isCta && <CalendarPlus className="h-4 w-4" aria-hidden="true" />}
                {link.label}
              </Link>
            );
          })}

          {status === "authenticated" && session?.user ? (
            <div className="ml-2 flex items-center gap-2 border-l border-gray-200 pl-3">
              <Link
                href={accountHref}
                className={`inline-flex min-h-[42px] items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                  pathname.startsWith("/portal") || pathname.startsWith("/admin")
                    ? "border-[#1E2127] bg-[#1E2127] text-white"
                    : "border-gray-300 bg-white text-[#1E2127] hover:border-[#1E2127]"
                }`}
              >
                {isStaff ? (
                  <Shield className="h-4 w-4 text-[#F50923]" aria-hidden="true" />
                ) : (
                  <User className="h-4 w-4 text-[#F50923]" aria-hidden="true" />
                )}
                <span>
                  {isStaff ? "Panel" : `Hola, ${session.user.firstName || "Mi cuenta"}`}
                </span>
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="inline-flex min-h-[42px] items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-[#424750] transition-colors hover:border-[#F50923] hover:text-[#F50923]"
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only xl:not-sr-only">Salir</span>
              </button>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className={`ml-2 inline-flex min-h-[42px] items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                pathname.startsWith("/auth")
                  ? "border-[#1E2127] bg-[#1E2127] text-white"
                  : "border-[#1E2127] bg-white text-[#1E2127] hover:bg-[#1E2127] hover:text-white"
              }`}
            >
              <User className="h-4 w-4" aria-hidden="true" />
              Mi cuenta
            </Link>
          )}
        </nav>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav-drawer"
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
          className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-lg border border-gray-300 bg-white text-[#1E2127] lg:hidden"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <nav
          id="mobile-nav-drawer"
          aria-label="Menú móvil"
          className="border-t border-gray-200 bg-white px-4 py-4 lg:hidden"
        >
          <div className="flex flex-col gap-2">
            {NAV_LINKS.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              const isCta = link.href === "/agendar";
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={
                    isCta
                      ? "flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-[#F50923] px-4 py-3 text-base font-semibold text-white"
                      : `flex min-h-[48px] items-center rounded-lg px-4 py-3 text-base font-semibold ${
                          active
                            ? "bg-[#1E2127] text-white"
                            : "text-[#1E2127] hover:bg-gray-100"
                        }`
                  }
                >
                  {isCta && <CalendarPlus className="h-5 w-5" aria-hidden="true" />}
                  {link.label}
                </Link>
              );
            })}

            <div className="my-2 border-t border-gray-200 pt-2">
              {status === "authenticated" && session?.user ? (
                <div className="flex flex-col gap-2">
                  <Link
                    href={accountHref}
                    onClick={() => setMobileOpen(false)}
                    className="flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-[#1E2127] px-4 py-3 text-base font-semibold text-white"
                  >
                    <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
                    {isStaff
                      ? "Panel Administrativo"
                      : `Mi cuenta (${session.user.firstName})`}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                    className="flex min-h-[48px] items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 text-base font-semibold text-[#424750]"
                  >
                    <LogOut className="h-5 w-5" aria-hidden="true" />
                    Cerrar sesión
                  </button>
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex min-h-[48px] items-center justify-center gap-2 rounded-lg border border-[#1E2127] px-4 py-3 text-base font-semibold text-[#1E2127]"
                >
                  <User className="h-5 w-5" aria-hidden="true" />
                  Mi cuenta / Iniciar sesión
                </Link>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
