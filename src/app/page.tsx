"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else {
        if (role === "admin") {
          router.push("/admin/dashboard");
        } else if (role === "team") {
          router.push("/team/dashboard");
        } else {
          // If role is not set, maybe show an error or redirect to login
          router.push("/login");
        }
      }
    }
  }, [user, role, loading, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-slate-500 font-medium animate-pulse">Initializing CRM Pro...</p>
      </div>
    </div>
  );
}
