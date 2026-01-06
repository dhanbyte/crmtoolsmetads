"use client";

import { useState } from "react";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function SetupAdminPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const setupAdmin = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/setup-admin", {
        method: "POST",
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || "Setup failed");
      }
    } catch (err: any) {
      setError(err.message || "Failed to setup admin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-8 shadow-xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Setup Default Admin</h1>
          <p className="mt-2 text-sm text-slate-500">
            Create or update admin user with phone login
          </p>
        </div>

        <div className="space-y-4 rounded-xl bg-blue-50 p-4 text-sm">
          <p className="font-bold text-blue-900">Default Admin Credentials:</p>
          <div className="space-y-1 text-blue-700">
            <p>• Email: admin@crmpro.com</p>
            <p>• Phone: 9157499884</p>
            <p>• Login with: 9157499884 (phone only)</p>
          </div>
        </div>

        {!result && !error && (
          <button
            onClick={setupAdmin}
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Setting up...
              </span>
            ) : (
              "Create/Update Admin User"
            )}
          </button>
        )}

        {result && (
          <div className="space-y-4 rounded-xl bg-green-50 p-4">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              <p className="font-bold">Success!</p>
            </div>
            <p className="text-sm text-green-600">{result.message}</p>
            <div className="space-y-1 text-xs text-green-700">
              <p>Email: {result.email}</p>
              <p>Phone: {result.phone}</p>
            </div>
            <a
              href="/login"
              className="mt-4 block w-full rounded-lg bg-green-600 px-4 py-3 text-center font-semibold text-white hover:bg-green-700"
            >
              Go to Login
            </a>
          </div>
        )}

        {error && (
          <div className="space-y-4 rounded-xl bg-red-50 p-4">
            <div className="flex items-center gap-2 text-red-700">
              <XCircle className="h-5 w-5" />
              <p className="font-bold">Error</p>
            </div>
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={setupAdmin}
              className="w-full rounded-lg bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}