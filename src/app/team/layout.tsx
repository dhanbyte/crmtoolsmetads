"use client";

import React from "react";
import TeamSidebar from "@/components/team-sidebar";
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
      <TeamSidebar />
      <main className="pl-64">
        <div className="p-8 animate-in">
          {children}
        </div>
      </main>
    </div>
  );
}
