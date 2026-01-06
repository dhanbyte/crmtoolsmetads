"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  ClipboardList, 
  Clock,
  LogOut,
  ChevronRight,
  User
} from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { clsx } from "clsx";

const menuItems = [
  { name: "My Dashboard", href: "/team/dashboard", icon: LayoutDashboard },
  { name: "My Leads", href: "/team/leads", icon: ClipboardList },
  { name: "Follow-ups", href: "/team/followups", icon: Clock },
];

export default function TeamSidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-200 bg-white shadow-sm">
      <div className="flex h-full flex-col px-4 py-6">
        <div className="mb-10 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600 text-white shadow-lg shadow-green-200">
            <ClipboardList className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">CRM TEAM</span>
        </div>

        <nav className="flex-1 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  "flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-green-50 text-green-700 shadow-sm" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={clsx("h-5 w-5", isActive ? "text-green-600" : "text-slate-400")} />
                  {item.name}
                </div>
                {isActive && <ChevronRight className="h-4 w-4 text-green-400" />}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-slate-100 pt-6">
          <div className="mb-4 flex items-center gap-3 px-2">
            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
              <User className="h-4 w-4" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-semibold text-slate-900 truncate">{user?.email}</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Team Member</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition-all hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}
