"use client";

import React, { useState, useRef, useEffect } from "react";
import { Phone, MessageSquare, Clock, MapPin, MoreVertical, CheckCircle2, History, FileText, UserMinus } from "lucide-react";
import type { Lead } from "@/lib/supabase";

interface LeadCardProps {
  lead: Lead;
  mode?: 'pool' | 'my-leads';
  onAccept?: (leadId: string) => Promise<void>;
  onWhatsApp?: (lead: Lead) => void;
  onViewHistory?: (lead: Lead) => void;
  onAddNote?: (lead: Lead) => void;
  onUpdateStatus?: (lead: Lead) => void;
  onRelease?: (leadId: string) => void;
  userId?: string;
}

export default function LeadCard({ 
  lead, 
  mode = 'my-leads',
  onAccept,
  onWhatsApp,
  onViewHistory,
  onAddNote,
  onUpdateStatus,
  onRelease,
  userId
}: LeadCardProps) {
  const [accepting, setAccepting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    ? new Date(lead.next_follow_up).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
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
    <div className="group relative rounded-2xl bg-white p-5 shadow-sm border border-slate-100 transition-all hover:shadow-md hover:border-blue-100 flex flex-col h-full">
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

      <div className="space-y-2 mb-auto pb-4">
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
          <div className="text-[11px] text-slate-600 line-clamp-1">
            <strong>Interest:</strong> {lead.interest}
          </div>
        )}
        {lead.follow_up_notes && (
          <div className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100 mt-2 line-clamp-2">
            "{lead.follow_up_notes}"
          </div>
        )}
      </div>

      <div className="flex gap-2 relative">
        {mode === 'pool' ? (
          <>
            <button 
              onClick={handleAccept}
              disabled={accepting}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-green-600 px-3 py-2 text-xs font-bold text-white shadow-sm shadow-green-200 hover:bg-green-700 transition-all active:scale-95 disabled:opacity-50"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {accepting ? 'Accepting...' : 'Accept Lead'}
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
        
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center justify-center rounded-xl bg-slate-100 p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          
          {showMenu && (
            <div className="absolute bottom-full right-0 mb-2 w-48 rounded-2xl bg-white shadow-2xl border border-slate-100 p-1.5 z-20 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <button 
                onClick={() => { setShowMenu(false); onViewHistory?.(lead); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
              >
                <History className="h-4 w-4 text-blue-500" />
                View History
              </button>
              <button 
                onClick={() => { setShowMenu(false); onUpdateStatus?.(lead); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
              >
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Update Status
              </button>
              <button 
                onClick={() => { setShowMenu(false); onAddNote?.(lead); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
              >
                <FileText className="h-4 w-4 text-orange-500" />
                Add Quick Note
              </button>
              {mode === 'my-leads' && (
                <button 
                  onClick={() => { setShowMenu(false); onRelease?.(lead.id); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <UserMinus className="h-4 w-4" />
                  Release to Pool
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
