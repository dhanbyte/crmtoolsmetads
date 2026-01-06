"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { LogIn, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const { signIn } = useAuth();

  // Detect if input is phone number
  const isPhone = /^[\d\s+\-()]+$/.test(emailOrPhone.trim());
  const isAdmin = emailOrPhone.includes('@');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      if (isPhone) {
        // Team member login - no password needed
        await signIn(emailOrPhone);
      } else {
        // Admin login - password required
        await signIn(emailOrPhone, password);
      }
      // Auth context will handle redirection
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Invalid credentials. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] p-4">
      <div className="w-full max-w-sm space-y-8 rounded-2xl bg-white p-8 shadow-xl shadow-slate-200/50 animate-in">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200">
            <LogIn className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">CRM Pro Login</h2>
          <p className="mt-2 text-sm text-slate-500">
            {isPhone ? 'Team member login with phone' : isAdmin ? 'Admin login with email' : 'Enter your credentials'}
          </p>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="emailOrPhone">
                {isPhone ? 'Phone Number' : 'Email Address'}
              </label>
              <input
                id="emailOrPhone"
                type="text"
                required
                className="input-field mt-1"
                placeholder={isPhone ? '1234567890' : 'admin@crmpro.com'}
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
              />
              <p className="mt-1 text-xs text-slate-500">
                {isPhone ? 'Team members: Enter your phone number' : 'Admins: Enter your email address'}
              </p>
            </div>
            {isAdmin && (
              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  className="input-field mt-1"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="mt-1 text-xs text-slate-500">Admin password: 704331</p>
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full h-11"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
