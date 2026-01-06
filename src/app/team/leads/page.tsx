"use client";

import React, { useState, useEffect } from "react";
import LeadCard from "@/components/lead-card";
import { Search, Filter, Plus, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getLeadsByAgent, Lead } from "@/lib/leads-service";

export default function TeamLeads() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (user) {
      const unsubscribe = getLeadsByAgent(user.id, (data) => {
        setLeads(data);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 leading-tight">My Assigned Leads</h1>
        <p className="text-slate-500">Manage and follow up with your personal leads pipeline</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search leads by name, phone or city..." 
          className="input-field pl-10 h-11 w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filteredLeads.length === 0 ? (
              <div className="col-span-full py-20 text-center rounded-3xl bg-white border border-dashed border-slate-200">
                <p className="text-slate-400">No leads assigned to you yet.</p>
              </div>
            ) : (
              filteredLeads.map((lead) => (
                <LeadCard key={lead.id} lead={lead} />
              ))
            )}
          </div>

          {filteredLeads.length > 0 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <p className="text-xs font-medium text-slate-500">Showing {filteredLeads.length} leads</p>
              <div className="flex gap-2">
                <button className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 disabled:opacity-50" disabled>
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button className="h-8 w-8 flex items-center justify-center rounded-lg bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-100">
                  1
                </button>
                <button className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 disabled:opacity-50" disabled>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
