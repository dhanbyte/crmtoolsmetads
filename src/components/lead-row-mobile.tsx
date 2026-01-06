"use client";

import React from "react";
import { Phone, MessageSquare, Clock, MoreVertical } from "lucide-react";
import type { Lead } from "@/lib/supabase";

interface LeadRowMobileProps {
  lead: Lead;
  onCall: (lead: Lead) => void;
  onWhatsApp: (lead: Lead) => void;
  onStatusChange: (leadId: string, newStatus: string) => void;
  onScheduleFollowUp: (lead: Lead) => void;
}

export default function LeadRowMobile({
  lead,
  onCall,
  onWhatsApp,
  onStatusChange,
  onScheduleFollowUp,
}: LeadRowMobileProps) {
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'new': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'contacted': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'qualified': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'converted': return 'bg-green-100 text-green-700 border-green-200';
      case 'lost': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const nextFollowUp = lead.next_follow_up 
    ? new Date(lead.next_follow_up).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-3 active:bg-slate-50 transition-colors">
      {/* Header: Name and Status */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg flex-shrink-0">
            {lead.name[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 text-base truncate">{lead.name}</h3>
            {lead.interest && (
              <p className="text-xs text-slate-500 truncate">{lead.interest}</p>
            )}
          </div>
        </div>
        <select
          value={lead.status}
          onChange={(e) => onStatusChange(lead.id, e.target.value)}
          className={`px-2 py-1 rounded-lg text-xs font-bold uppercase border-2 transition-all ${getStatusColor(lead.status)}`}
          style={{ minWidth: '100px' }}
        >
          <option value="new">🆕 New</option>
          <option value="contacted">📞 Contacted</option>
          <option value="qualified">👍 Interested</option>
          <option value="converted">✅ Done</option>
          <option value="lost">❌ Rejected</option>
        </select>
      </div>

      {/* Phone */}
      <a 
        href={`tel:${lead.phone}`}
        className="flex items-center gap-2 mb-3 text-blue-600 font-bold text-base active:underline"
      >
        <Phone className="h-4 w-4" />
        {lead.phone}
      </a>

      {/* Follow-up info */}
      {nextFollowUp && (
        <div className="flex items-center gap-2 mb-3 text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
          <Clock className="h-3.5 w-3.5" />
          <span className="font-semibold">Follow-up:</span>
          <span>{nextFollowUp}</span>
        </div>
      )}

      {/* Notes */}
      {lead.follow_up_notes && (
        <p className="text-xs text-slate-600 italic mb-3 bg-slate-50 px-3 py-2 rounded-lg">
          "{lead.follow_up_notes}"
        </p>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => onCall(lead)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
        >
          <Phone className="h-4 w-4" />
          Call
        </button>
        <button
          onClick={() => onWhatsApp(lead)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold hover:brightness-110 active:scale-95 transition-all shadow-sm"
          style={{ backgroundColor: '#25D366', color: 'white' }}
        >
          <MessageSquare className="h-4 w-4" />
          WhatsApp
        </button>
        <button
          onClick={() => onScheduleFollowUp(lead)}
          className="flex items-center justify-center p-3 rounded-xl bg-orange-100 text-orange-600 hover:bg-orange-200 active:scale-95 transition-colors"
        >
          <Clock className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}