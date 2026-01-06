"use client";

import React from "react";
import TeamSidebar from "@/components/team-sidebar";
import MobileNav from "@/components/mobile-nav";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!user || role !== "team") {
    if (typeof window !== "undefined") {
      router.push("/login");
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden md:block">
        <TeamSidebar />
      </div>
      
      {/* Main Content */}
      <main className="md:pl-64 pb-20 md:pb-0">
        <div className="p-4 md:p-8 animate-in">
          {children}
        </div>
      </main>
      
      {/* Mobile Bottom Navigation - Hidden on desktop */}
      <MobileNav />
    </div>
  );
}
