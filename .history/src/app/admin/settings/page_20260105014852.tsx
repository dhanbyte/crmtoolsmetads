"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Loader2, Save, AlertCircle } from "lucide-react";

interface WhatsAppTemplate {
  message: string;
}

export default function AdminSettingsPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const [template, setTemplate] = useState<WhatsAppTemplate>({ message: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Check admin role
  useEffect(() => {
    if (!authLoading && (!user || userData?.role !== "admin")) {
      router.push("/login");
    }
  }, [user, userData, authLoading, router]);

  // Load template
  useEffect(() => {
    const loadTemplate = async () => {
      try {
        const res = await fetch(
          `/api/admin/settings?key=whatsapp_template`
        );
        const { data } = await res.json();
        if (data) {
          setTemplate(data);
        }
      } catch (error) {
        console.error("Failed to load template:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user && userData?.role === "admin") {
      loadTemplate();
    }
  }, [user, userData]);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "whatsapp_template", value: template }),
      });

      if (!res.ok) throw new Error("Failed to save");
      setMessage("✓ Template saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Save error:", error);
      setMessage("✗ Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-600 mt-2">Configure global WhatsApp template</p>
        </div>

        {/* Settings Card */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          {/* WhatsApp Template Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                WhatsApp Message Template
              </label>
              <p className="text-xs text-slate-500 mb-3">
                Use placeholders: <code className="bg-slate-100 px-1.5 py-0.5 rounded">{"{name}"}</code>, <code className="bg-slate-100 px-1.5 py-0.5 rounded">{"{interest}"}</code>
              </p>
              <textarea
                value={template.message}
                onChange={(e) =>
                  setTemplate({ message: e.target.value })
                }
                className="w-full h-32 rounded-lg border border-slate-200 p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter WhatsApp message template..."
              />
            </div>

            {/* Preview */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-xs font-semibold text-slate-600 mb-2">Preview:</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">
                {template.message
                  .replace("{name}", "John")
                  .replace("{interest}", "your service")}
              </p>
            </div>

            {/* Message */}
            {message && (
              <div
                className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                  message.startsWith("✓")
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                <AlertCircle className="h-4 w-4" />
                {message}
              </div>
            )}

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white rounded-lg py-2 font-medium hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Template
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
