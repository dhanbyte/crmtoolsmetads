"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Clock, User, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

export default function MobileNav() {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const router = useRouter();

  const navItems = [
    { name: "Dashboard", href: "/team/dashboard", icon: LayoutDashboard },
    { name: "My Leads", href: "/team/leads", icon: Users },
    { name: "Follow-ups", href: "/team/followups", icon: Clock },
    { name: "Profile", href: "/team/profile", icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 safe-bottom shadow-lg">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all rounded-xl ${
                isActive
                  ? "text-green-600 bg-green-50"
                  : "text-slate-500 active:text-green-600"
              }`}
            >
              <item.icon className={`h-5 w-5 mb-1 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[10px] font-bold">{item.name}</span>
            </Link>
          );
        })}
        
        {/* Logout Button */}
        <button
          onClick={async () => {
            if (confirm("Are you sure you want to logout?")) {
              try {
                await signOut();
                router.push('/login');
              } catch (error) {
                console.error('Logout error:', error);
                router.push('/login');
              }
            }
          }}
          className="flex flex-col items-center justify-center flex-1 h-full transition-all rounded-xl text-red-500 active:text-red-600 active:bg-red-50"
        >
          <LogOut className="h-5 w-5 mb-1 stroke-2" />
          <span className="text-[10px] font-bold">Logout</span>
        </button>
      </div>
    </nav>
  );
}