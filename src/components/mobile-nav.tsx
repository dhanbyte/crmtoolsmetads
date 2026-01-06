"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Clock, User } from "lucide-react";

export default function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/team/dashboard", icon: LayoutDashboard },
    { name: "My Leads", href: "/team/dashboard?tab=my-leads", icon: Users },
    { name: "Follow-ups", href: "/team/followups", icon: Clock },
    { name: "Profile", href: "/team/dashboard", icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 safe-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href.includes('?tab=my-leads') && pathname === '/team/dashboard');
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive
                  ? "text-blue-600"
                  : "text-slate-500 active:text-blue-600"
              }`}
            >
              <item.icon className={`h-6 w-6 mb-1 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-xs font-semibold">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}