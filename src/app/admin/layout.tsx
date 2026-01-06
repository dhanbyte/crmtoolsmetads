"use client";

import React from "react";
import AdminSidebar from "@/components/admin-sidebar";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Loader2, LayoutDashboard, Users, ClipboardList, Settings } from "lucide-react";
import { clsx } from "clsx";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user || role !== "admin") {
    if (typeof window !== "undefined") {
      router.push("/login");
    }
    return null;
  }

  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden md:block">
        <AdminSidebar />
      </div>
      
      {/* Main Content */}
      <main className="md:pl-64 pb-20 md:pb-0">
        <div className="p-4 md:p-8 animate-in">
          {children}
        </div>
      </main>
      
      {/* Mobile Bottom Navigation - Hidden on desktop */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-lg">
        <div className="flex justify-around items-center px-4 py-3">
          <Link href="/admin/dashboard" className={clsx(
            "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all",
            pathname === "/admin/dashboard" ? "text-blue-600 bg-blue-50" : "text-slate-600"
          )}>
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-[10px] font-bold">Dashboard</span>
          </Link>
          <Link href="/admin/users" className={clsx(
            "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all",
            pathname === "/admin/users" ? "text-blue-600 bg-blue-50" : "text-slate-600"
          )}>
            <Users className="h-5 w-5" />
            <span className="text-[10px] font-bold">Users</span>
          </Link>
          <Link href="/admin/leads" className={clsx(
            "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all",
            pathname === "/admin/leads" ? "text-blue-600 bg-blue-50" : "text-slate-600"
          )}>
            <ClipboardList className="h-5 w-5" />
            <span className="text-[10px] font-bold">Leads</span>
          </Link>
          <Link href="/admin/settings" className={clsx(
            "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all",
            pathname === "/admin/settings" ? "text-blue-600 bg-blue-50" : "text-slate-600"
          )}>
            <Settings className="h-5 w-5" />
            <span className="text-[10px] font-bold">Settings</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
