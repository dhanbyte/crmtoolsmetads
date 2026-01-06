"use client";

import React, { useState } from "react";
import { UserPlus, Loader2, CheckCircle } from "lucide-react";

export default function SetupPage() {
  const [formData, setFormData] = useState({
    email: "admin@crmpro.com",
    password: "704331",
    name: "Admin User",
    role: "admin"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create user");
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create user. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] p-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl shadow-slate-200/50">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200">
            <UserPlus className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Initial Setup
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Create your first admin account
          </p>
        </div>

        {success ? (
          <div className="rounded-lg bg-green-50 p-6 text-center border border-green-200">
            <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-3" />
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              Account Created Successfully!
            </h3>
            <p className="text-sm text-green-700">
              Redirecting to login page...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="name">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  className="input-field mt-1"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="email">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  className="input-field mt-1"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="text"
                  required
                  className="input-field mt-1"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Default: 704331 (you can change this)
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="role">
                  Role
                </label>
                <select
                  id="role"
                  className="input-field mt-1"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="admin">Admin</option>
                  <option value="team">Team Member</option>
                </select>
              </div>
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
                  Creating Account...
                </>
              ) : (
                "Create Admin Account"
              )}
            </button>
          </form>
        )}

        <div className="mt-6 rounded-lg bg-blue-50 p-4 border border-blue-200">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">
            Default Credentials
          </h4>
          <div className="text-xs text-blue-700 space-y-1">
            <p><strong>Email:</strong> admin@crmpro.com</p>
            <p><strong>Password:</strong> 704331</p>
          </div>
        </div>
      </div>
    </div>
  );
}
