"use client";

import React from "react";
import AdminSidebar from "@/components/admin-sidebar";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Loader2, LayoutDashboard, Users, ClipboardList, Settings, MessageSquare, RefreshCw, Upload, Menu, Phone, Bell, Plus } from "lucide-react";
import { clsx } from "clsx";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role, loading, userData } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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

  // Get current page title for the header
  const getPageTitle = () => {
    if (pathname.includes('/leads')) return 'Leads';
    if (pathname.includes('/users')) return 'Team';
    if (pathname.includes('/dashboard')) return 'Overview';
    if (pathname.includes('/upload')) return 'Import';
    if (pathname.includes('/settings')) return 'Settings';
    return 'Admin';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden md:block">
        <AdminSidebar />
      </div>
      
      {/* Mobile Header - App Feel */}
      <div className="md:hidden sticky top-0 z-50 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
           <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-md shadow-blue-100">
             <LayoutDashboard className="h-5 w-5 text-white" />
           </div>
           <h2 className="font-bold text-slate-800 tracking-tight">{getPageTitle()}</h2>
        </div>
        <div className="flex items-center gap-3">
           <button className="p-2 text-slate-400">
             <Bell className="h-5 w-5" />
           </button>
           <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
             {userData?.name?.[0] || 'A'}
           </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 md:pl-64 pb-24 md:pb-0">
        <div className="p-4 md:p-8 max-w-7xl mx-auto animate-in">
          {children}
        </div>
      </main>
      
      {/* Mobile Bottom Navigation - App-style Floating Feel */}
      <div className="md:hidden fixed bottom-6 left-4 right-4 z-50">
        <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/10 px-2 py-2 flex items-center justify-around">
          <Link href="/admin/dashboard" className={clsx(
            "flex flex-col items-center gap-1.5 px-4 py-2 rounded-xl transition-all",
            pathname === "/admin/dashboard" ? "text-blue-400 bg-white/5" : "text-slate-400"
          )}>
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Home</span>
          </Link>
          
          <Link href="/admin/leads" className={clsx(
            "flex flex-col items-center gap-1.5 px-4 py-2 rounded-xl transition-all",
            pathname === "/admin/leads" ? "text-blue-400 bg-white/5" : "text-slate-400"
          )}>
            <ClipboardList className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Leads</span>
          </Link>

          <Link href="/admin/quick-add" className={clsx(
            "flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl transition-all -mt-8",
            pathname === "/admin/quick-add" ? "bg-blue-500 text-white shadow-lg shadow-blue-300" : "bg-blue-600 text-white shadow-lg shadow-blue-200"
          )}>
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl">
              <Plus className="h-6 w-6" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider">Add</span>
          </Link>

          <Link href="/admin/users" className={clsx(
            "flex flex-col items-center gap-1.5 px-4 py-2 rounded-xl transition-all",
            pathname === "/admin/users" ? "text-blue-400 bg-white/5" : "text-slate-400"
          )}>
            <Users className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Team</span>
          </Link>

          <Link href="/admin/settings" className={clsx(
            "flex flex-col items-center gap-1.5 px-4 py-2 rounded-xl transition-all",
            pathname === "/admin/settings" ? "text-blue-400 bg-white/5" : "text-slate-400"
          )}>
            <Settings className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Menu</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
