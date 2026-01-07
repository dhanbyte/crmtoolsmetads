"use client";

import React, { useState } from "react";
import { Plus, Check, Loader2, Phone, User } from "lucide-react";
import { useRouter } from "next/navigation";

export default function QuickAddLead() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      alert("Phone number is required");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/quick-add-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || `Lead ${phone.slice(-4)}`,
          phone: phone,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to add lead");

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setName("");
        setPhone("");
      }, 2000);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4 pb-24">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 mb-4 shadow-lg shadow-blue-200">
            <Plus className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Quick Add Lead</h1>
          <p className="text-slate-500 font-medium">Fast entry for new prospects</p>
        </div>

        {success ? (
          <div className="bg-white rounded-[32px] p-12 shadow-2xl border border-green-100 animate-in zoom-in-95 duration-300">
            <div className="text-center">
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-500 mb-6 animate-bounce">
                <Check className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Lead Added!</h2>
              <p className="text-slate-600 font-medium">Successfully saved to database</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[32px] p-8 shadow-2xl border border-slate-100">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
                  Name (Optional)
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 focus:border-blue-500 focus:bg-white rounded-2xl font-bold text-slate-900 transition-all outline-none"
                    placeholder="Rahul Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" />
                  <input
                    required
                    type="text"
                    inputMode="tel"
                    className="w-full pl-12 pr-4 py-5 bg-slate-50 border-2 border-slate-100 focus:border-blue-500 focus:bg-white rounded-2xl font-black text-slate-900 text-xl transition-all outline-none"
                    placeholder="+919988776655"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={loading}
                    autoFocus
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2 ml-1 font-semibold">
                  You can paste numbers with +91 prefix
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !phone}
                className="w-full py-5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-[24px] font-black text-lg shadow-xl shadow-blue-100 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-6 w-6" />
                    Add to Database
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push("/admin/leads")}
            className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
          >
            ← Back to All Leads
          </button>
        </div>
      </div>
    </div>
  );
}
