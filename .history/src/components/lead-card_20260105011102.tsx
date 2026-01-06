"use client";

import React, { useState } from "react";
import { Phone, MessageSquare, Clock, MapPin, MoreVertical, CheckCircle2 } from "lucide-react";
import type { Lead } from "@/lib/supabase";

interface LeadCardProps {
  lead: Lead;
  mode?: 'pool' | 'my-leads'; // 'pool' = available leads, 'my-leads' = assigned leads
  onAccept?: (leadId: string) => Promise<void>;
  onWhatsApp?: (lead: Lead) => void;
  userId?: string;
}

export default function LeadCard({ 
  lead, 
  mode = 'my-leads',
  onAccept,
  onWhatsApp,
  userId
}: LeadCardProps) {
  const [accepting, setAccepting] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'new': return 'bg-blue-100 text-blue-700';
      case 'contacted': return 'bg-orange-100 text-orange-700';
      case 'qualified': return 'bg-yellow-100 text-yellow-700';
      case 'converted': return 'bg-green-100 text-green-700';
      case 'lost': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const nextFollowUp = lead.next_follow_up 
    ? new Date(lead.next_follow_up).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : 'No Followup';

  const handleAccept = async () => {
    if (!onAccept || !userId) return;
    setAccepting(true);
    try {
      await onAccept(lead.id);
    } catch (error) {
      console.error('Failed to accept lead:', error);
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="group relative rounded-2xl bg-white p-5 shadow-sm border border-slate-100 transition-all hover:shadow-md hover:border-blue-100">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            {lead.name[0]?.toUpperCase() || 'L'}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 leading-none">{lead.name}</h3>
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold mt-1.5 uppercase tracking-wider">
              <MapPin className="h-3 w-3" />
              {lead.source || 'Direct'}
            </div>
          </div>
        </div>
        <div className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${getStatusColor(lead.status)}`}>
          {lead.status}
        </div>
      </div>

      <div className="space-y-2 mb-6">
        <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
          <span className="flex items-center gap-1.5">
            <Phone className="h-3 w-3 text-slate-400" />
            {lead.phone}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-slate-400" />
            {nextFollowUp}
          </span>
        </div>
        {lead.interest && (
          <div className="text-[11px] text-slate-600">
            <strong>Interest:</strong> {lead.interest}
          </div>
        )}
        {lead.follow_up_notes && (
          <div className="text-[11px] text-slate-600">
            <strong>Notes:</strong> {lead.follow_up_notes}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {mode === 'pool' ? (
          <>
            <button 
              onClick={handleAccept}
              disabled={accepting}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-green-600 px-3 py-2 text-xs font-bold text-white shadow-sm shadow-green-200 hover:bg-green-700 transition-all active:scale-95 disabled:opacity-50"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {accepting ? 'Accepting...' : 'Accept'}
            </button>
          </>
        ) : (
          <>
            <button 
              onClick={() => window.location.href = `tel:${lead.phone}`}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white shadow-sm shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
            >
              <Phone className="h-3.5 w-3.5" />
              Call
            </button>
            <button 
              onClick={() => onWhatsApp?.(lead)}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-green-500 px-3 py-2 text-xs font-bold text-white shadow-sm shadow-green-200 hover:bg-green-600 transition-all active:scale-95"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              WhatsApp
            </button>
          </>
        )}
        <button className="flex items-center justify-center rounded-xl bg-slate-50 p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
