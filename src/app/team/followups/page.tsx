"use client";

import React, { useState, useEffect } from "react";
import { Clock, Calendar, Phone, MessageSquare, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import type { Lead } from "@/lib/supabase";
import { logActivity } from "@/lib/dashboard-service";

type TabType = 'today' | 'tomorrow' | 'week' | 'overdue';

export default function TeamFollowups() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [followups, setFollowups] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadFollowups(activeTab);
    }
  }, [user, activeTab]);

  const loadFollowups = async (tab: TabType) => {
    if (!user) return;
    setLoading(true);
    
    try {
      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      switch (tab) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          endDate = new Date(now.setHours(23, 59, 59, 999));
          break;
        case 'tomorrow':
          startDate = new Date(now.setDate(now.getDate() + 1));
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'week':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          endDate = new Date(now.setDate(now.getDate() + 7));
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'overdue':
          endDate = new Date(now.setHours(0, 0, 0, 0));
          break;
      }

      let query = supabase
        .from('leads')
        .select('*')
        .eq('assigned_to', user.id)
        .not('follow_up_date', 'is', null)
        .order('follow_up_date', { ascending: true });

      if (tab === 'overdue') {
        query = query.lt('follow_up_date', endDate!.toISOString());
      } else {
        query = query
          .gte('follow_up_date', startDate!.toISOString())
          .lte('follow_up_date', endDate!.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      setFollowups(data || []);
    } catch (error) {
      console.error('Error loading followups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = async (lead: Lead) => {
    window.location.href = `tel:${lead.phone}`;
    if (user) await logActivity(user.id, lead.id, 'call', 'One-click call initiated');
  };

  const handleWhatsApp = async (lead: Lead) => {
    const message = `Hello ${lead.name}, following up on our previous conversation.`;
    window.open(`https://wa.me/${lead.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
    if (user) await logActivity(user.id, lead.id, 'whatsapp', 'WhatsApp opened');
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getOverdueCount = () => {
    // This will be fetched when overdue tab is active
    return followups.length;
  };

  return (
    <div className="space-y-8 animate-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Follow-up Manager</h1>
        <p className="text-slate-500">Track and manage your scheduled interactions</p>
      </div>

      <div className="flex gap-4 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('today')}
          className={`px-4 py-2 text-sm font-bold transition-colors ${activeTab === 'today' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Today
        </button>
        <button 
          onClick={() => setActiveTab('tomorrow')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'tomorrow' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Tomorrow
        </button>
        <button 
          onClick={() => setActiveTab('week')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'week' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          This Week
        </button>
        <button 
          onClick={() => setActiveTab('overdue')}
          className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'overdue' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Overdue
          {activeTab === 'overdue' && followups.length > 0 && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
              {followups.length}
            </span>
          )}
        </button>
        <button 
          onClick={() => loadFollowups(activeTab)}
          className="ml-auto p-2 text-slate-400 hover:text-blue-600 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : followups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
          <Calendar className="h-12 w-12 mb-3 opacity-20" />
          <p className="text-center font-medium">No follow-ups scheduled for {activeTab === 'today' ? 'today' : activeTab === 'tomorrow' ? 'tomorrow' : activeTab === 'week' ? 'this week' : 'overdue'}.</p>
          <p className="text-xs opacity-70 mt-2">Schedule follow-ups from your leads dashboard!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {followups.map((lead) => (
            <div key={lead.id} className="flex items-center justify-between rounded-2xl bg-white p-6 shadow-sm border border-slate-100 hover:border-blue-100 transition-all group">
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-center justify-center min-w-[80px] border-r border-slate-100">
                  <span className="text-sm font-bold text-slate-900 tracking-tight">
                    {lead.follow_up_date ? formatTime(lead.follow_up_date) : '--:--'}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">
                    {lead.follow_up_date ? formatDate(lead.follow_up_date) : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold group-hover:bg-blue-600 group-hover:text-white transition-all">
                    {lead.name[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{lead.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {lead.phone}
                      </span>
                      {activeTab === 'overdue' && (
                        <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600 uppercase tracking-tighter">
                          <AlertCircle className="h-3 w-3" />
                          Overdue
                        </span>
                      )}
                      {lead.follow_up_notes && (
                        <span className="text-xs text-slate-400 italic">
                          {lead.follow_up_notes}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => handleCall(lead)}
                  className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                  title="Call"
                >
                  <Phone className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => handleWhatsApp(lead)}
                  className="h-10 w-10 flex items-center justify-center rounded-xl bg-green-50 text-green-600 hover:bg-green-600 hover:text-white transition-all shadow-sm"
                  title="WhatsApp"
                >
                  <MessageSquare className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}