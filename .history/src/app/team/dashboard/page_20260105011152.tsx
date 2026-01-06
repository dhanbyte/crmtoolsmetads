"use client";

import React, { useEffect, useState } from "react";
import { 
  ClipboardList, 
  PhoneCall, 
  CheckCircle2, 
  Clock,
  Calendar,
  PhoneForwarded,
  MessageSquare,
  AlertCircle,
  Loader2,
  RefreshCw,
  LogOut,
  Gift,
  CheckSquare
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getTeamDashboardStats, getUrgentFollowUps, DashboardStats, logActivity, updateLeadStatus, getAvailablePoolLeads, acceptLead, getGlobalSettings, updateLeadFollowUp } from "@/lib/dashboard-service";
import { Lead } from "@/lib/supabase";
import LeadCard from "@/components/lead-card";
import { useRouter } from "next/navigation";

export default function TeamDashboard() {
  const { user, userData, signOut, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<'pool' | 'my-leads'>('pool'); // New tab state
  const [stats, setStats] = useState<DashboardStats>({
    myLeads: 0,
    todaysTasks: 0,
    callsMade: 0,
    converted: 0
  });
  const [urgentLeads, setUrgentLeads] = useState<Lead[]>([]);
  const [poolLeads, setPoolLeads] = useState<Lead[]>([]); // New state for pool leads
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [whatsappTemplate, setWhatsappTemplate] = useState(''); // New state for WhatsApp template
  const [followUpModal, setFollowUpModal] = useState<{ lead: Lead; open: boolean }>({ lead: null as any, open: false });
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');
  const router = useRouter();

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [newStats, urgency, pool, template] = await Promise.all([
        getTeamDashboardStats(user.id),
        getUrgentFollowUps(user.id),
        getAvailablePoolLeads(),
        getGlobalSettings('whatsapp_template')
      ]);
      setStats(newStats);
      setUrgentLeads(urgency);
      setPoolLeads(pool);
      if (template?.message) {
        setWhatsappTemplate(template.message);
      }
    } catch (error) {
      console.error("Failed to load dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      loadData();
    }
  }, [user, authLoading]);

  // Handle accept lead
  const handleAcceptLead = async (leadId: string) => {
    if (!user) return;
    try {
      await acceptLead(user.id, leadId);
      // Remove from pool
      setPoolLeads(prev => prev.filter(l => l.id !== leadId));
      // Refresh urgent leads
      loadData();
    } catch (error) {
      console.error('Failed to accept lead:', error);
      alert('Failed to accept lead');
    }
  };

  // Handle one-click call
  const handleCall = async (lead: Lead) => {
    window.location.href = `tel:${lead.phone}`;
    if (user) await logActivity(user.id, lead.id, 'call', 'One-click call initiated');
  };

  // Handle WhatsApp
  const handleWhatsApp = async (lead: Lead) => {
    let message = whatsappTemplate || "Hello {name}, calling from CRM regarding your inquiry.";
    message = message.replace('{name}', lead.name);
    message = message.replace('{interest}', lead.interest || 'our services');
    
    window.open(`https://wa.me/${lead.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
    if (user) await logActivity(user.id, lead.id, 'whatsapp', 'WhatsApp opened');
  };

  // Handle follow-up save
  const handleSaveFollowUp = async () => {
    if (!user || !followUpModal.lead) return;
    try {
      await updateLeadFollowUp(user.id, followUpModal.lead.id, followUpDate, followUpNotes);
      alert('Follow-up scheduled!');
      setFollowUpModal({ lead: null as any, open: false });
      setFollowUpDate('');
      setFollowUpNotes('');
      loadData();
    } catch (error) {
      console.error('Failed to save follow-up:', error);
      alert('Failed to save follow-up');
    }
  };

  if (authLoading || (loading && !stats.myLeads)) {
    return (
      <div className="flex h-screen items-center justify-center -mt-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const statCards = [
    { name: "My Leads", value: stats.myLeads, icon: ClipboardList, color: "text-green-600", bg: "bg-green-50" },
    { name: "Today's Tasks", value: stats.todaysTasks, icon: Calendar, color: "text-blue-600", bg: "bg-blue-50" },
    { name: "Calls Made", value: stats.callsMade, icon: PhoneCall, color: "text-orange-600", bg: "bg-orange-50" },
    { name: "Converted", value: stats.converted, icon: CheckCircle2, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="space-y-8 animate-in pb-12">
      {/* Top User Context & Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{greeting}, {userData?.name || "Team Member"}!</h1>
          <p className="text-slate-500 flex items-center gap-2">
            <span>{new Date().toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <span className="h-1 w-1 rounded-full bg-slate-300"></span>
            <span className="italic text-slate-400">"Quality over quantity. Make every call count!"</span>
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
            {userData?.name?.[0] || "U"}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-slate-900">{userData?.email}</p>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{userData?.role}</p>
          </div>
          <button onClick={() => signOut()} className="ml-2 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Sign Out">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.name} className="flex items-center gap-4 rounded-2xl bg-white p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md hover:border-blue-100 cursor-pointer group">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.name}</p>
              <p className="text-2xl font-bold text-slate-900 tracking-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* NEW: Tab Navigation */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-1">
        <div className="flex gap-1">
          <button
            onClick={() => setTab('pool')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all ${
              tab === 'pool'
                ? 'bg-blue-100 text-blue-700'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Gift className="h-4 w-4" />
            New Leads Pool ({poolLeads.length})
          </button>
          <button
            onClick={() => setTab('my-leads')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all ${
              tab === 'my-leads'
                ? 'bg-blue-100 text-blue-700'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <CheckSquare className="h-4 w-4" />
            My Leads ({stats.myLeads})
          </button>
        </div>
      </div>

      {/* TAB CONTENT: Pool Leads */}
      {tab === 'pool' && (
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-lg">
              <Gift className="h-5 w-5 text-blue-600" />
              Available Leads
            </h3>
            <button onClick={loadData} className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors">
              <RefreshCw className="h-3 w-3" /> Refresh
            </button>
          </div>

          {poolLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Gift className="h-12 w-12 mb-3 opacity-20" />
              <p className="text-center">No leads available in the pool right now.</p>
              <p className="text-xs opacity-70 mt-2">Come back soon or wait for new leads!</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {poolLeads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  mode="pool"
                  onAccept={handleAcceptLead}
                  userId={user?.id}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: My Leads */}
      {tab === 'my-leads' && (
        <div className="space-y-6">
          {/* Urgent Follow-ups */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-orange-600" />
                Urgent Follow-ups
              </h3>
              {urgentLeads.length > 0 && (
                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700 animate-pulse">
                  {urgentLeads.length} ACTION REQUIRED
                </span>
              )}
            </div>

            <div className="space-y-3">
              {urgentLeads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <CheckCircle2 className="h-10 w-10 mb-2 opacity-20" />
                  <p>All caught up! No urgent follow-ups.</p>
                </div>
              ) : (
                urgentLeads.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-l-4 border-l-orange-500 border-slate-100 bg-orange-50/10 p-4 hover:bg-orange-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center font-bold text-orange-700 shrink-0">
                        {item.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{item.name}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          {item.next_follow_up ? new Date(item.next_follow_up).toLocaleTimeString("en-US", { hour: 'numeric', minute: '2-digit' }) : "Overdue"}
                          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                          <span className="font-mono">{item.phone}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => handleCall(item)}
                        className="h-9 w-9 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:scale-105 transition-all shadow-sm"
                        title="Call"
                      >
                        <PhoneForwarded className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleWhatsApp(item)}
                        className="h-9 w-9 flex items-center justify-center rounded-lg bg-green-50 text-green-600 hover:bg-green-100 hover:scale-105 transition-all shadow-sm"
                        title="WhatsApp"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setFollowUpModal({ lead: item, open: true })}
                        className="h-9 px-3 flex items-center justify-center rounded-lg bg-purple-50 text-purple-600 text-xs font-semibold hover:bg-purple-100 transition-colors"
                      >
                        Follow-up
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* My Leads Grid */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-lg">
                <CheckSquare className="h-5 w-5 text-green-600" />
                My Leads ({stats.myLeads})
              </h3>
              <button onClick={loadData} className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors">
                <RefreshCw className="h-3 w-3" /> Refresh
              </button>
            </div>

            {stats.myLeads === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <CheckSquare className="h-12 w-12 mb-3 opacity-20" />
                <p>No leads assigned yet.</p>
                <p className="text-xs opacity-70 mt-2">Check the pool to accept new leads!</p>
              </div>
            ) : (
              <p className="text-sm text-slate-600 mb-4">View your assigned leads (limited view - see urgent section above)</p>
            )}
          </div>
        </div>
      )}

      {/* Follow-up Modal */}
      {followUpModal.open && followUpModal.lead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-900">Schedule Follow-up</h3>
                <button onClick={() => setFollowUpModal({ lead: null as any, open: false })} className="text-slate-400 hover:text-slate-600">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <p className="text-sm text-slate-500 mb-1">Lead:</p>
                <p className="font-bold text-slate-900">{followUpModal.lead.name}</p>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Next Follow-up Date</label>
                  <input
                    type="datetime-local"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                  <textarea
                    value={followUpNotes}
                    onChange={(e) => setFollowUpNotes(e.target.value)}
                    placeholder="e.g., Call in 2 days, Evening follow-up"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setFollowUpModal({ lead: null as any, open: false })}
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveFollowUp}
                  className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [newStats, urgency] = await Promise.all([
        getTeamDashboardStats(user.id),
        getUrgentFollowUps(user.id)
      ]);
      setStats(newStats);
      setUrgentLeads(urgency);
    } catch (error) {
      console.error("Failed to load dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      loadData();
    }
  }, [user, authLoading]);

  // Handle one-click call
  const handleCall = async (lead: Lead) => {
    window.location.href = `tel:${lead.phone}`;
    // Show modal to log result? For now just log "call initiated"
    if (user) await logActivity(user.id, lead.id, 'call', 'One-click call initiated');
    // Ideally open a modal here to ask for result
  };

  // Handle WhatsApp
  const handleWhatsApp = async (lead: Lead) => {
    const text = "Hello " + lead.name + ", calling from CRM Pro regarding your inquiry.";
    window.open(`https://wa.me/${lead.phone.replace(/\+/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
    if (user) await logActivity(user.id, lead.id, 'whatsapp', 'WhatsApp opened');
  };

  if (authLoading || (loading && !stats.myLeads)) {
     return (
      <div className="flex h-screen items-center justify-center -mt-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const statCards = [
    { name: "My Leads", value: stats.myLeads, icon: ClipboardList, color: "text-green-600", bg: "bg-green-50" },
    { name: "Today's Tasks", value: stats.todaysTasks, icon: Calendar, color: "text-blue-600", bg: "bg-blue-50" },
    { name: "Calls Made", value: stats.callsMade, icon: PhoneCall, color: "text-orange-600", bg: "bg-orange-50" },
    { name: "Converted", value: stats.converted, icon: CheckCircle2, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  // Dynamic greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="space-y-8 animate-in pb-12">
      {/* Top User Context & Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{greeting}, {userData?.name || "Team Member"}!</h1>
          <p className="text-slate-500 flex items-center gap-2">
            <span>{new Date().toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <span className="h-1 w-1 rounded-full bg-slate-300"></span>
            <span className="italic text-slate-400">"Quality over quantity. Make every call count!"</span>
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
           <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
             {userData?.name?.[0] || "U"}
           </div>
           <div className="hidden md:block">
             <p className="text-sm font-semibold text-slate-900">{userData?.email}</p>
             <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{userData?.role}</p>
           </div>
           <button onClick={() => signOut()} className="ml-2 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Sign Out">
             <LogOut className="h-5 w-5" />
           </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.name} className="flex items-center gap-4 rounded-2xl bg-white p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md hover:border-blue-100 cursor-pointer group">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.name}</p>
              <p className="text-2xl font-bold text-slate-900 tracking-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Urgent Follow-ups */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 h-full">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-orange-600" />
                Urgent Follow-ups
              </h3>
              {urgentLeads.length > 0 && (
                 <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700 animate-pulse">
                   {urgentLeads.length} ACTION REQUIRED
                 </span>
              )}
            </div>
            
            <div className="space-y-3">
              {urgentLeads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <CheckCircle2 className="h-10 w-10 mb-2 opacity-20" />
                  <p>All caught up! No urgent follow-ups.</p>
                </div>
              ) : (
                urgentLeads.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-l-4 border-l-orange-500 border-slate-100 bg-orange-50/10 p-4 hover:bg-orange-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center font-bold text-orange-700 shrink-0">
                        {item.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{item.name}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          {item.next_follow_up ? new Date(item.next_follow_up).toLocaleTimeString("en-US", { hour: 'numeric', minute: '2-digit' }) : "Overdue"}
                          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                          <span className="font-mono">{item.phone}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 self-end sm:self-auto">
                      <button 
                        onClick={() => handleCall(item)}
                        className="h-9 w-9 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:scale-105 transition-all shadow-sm" title="Call">
                        <PhoneForwarded className="h-4 w-4" />
                      </button>
                      <button 
                         onClick={() => handleWhatsApp(item)}
                         className="h-9 w-9 flex items-center justify-center rounded-lg bg-green-50 text-green-600 hover:bg-green-100 hover:scale-105 transition-all shadow-sm" title="WhatsApp">
                        <MessageSquare className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedLead(item);
                          setIsStatusModalOpen(true);
                        }}
                        className="h-9 px-3 flex items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-semibold transition-colors">
                         Update Status
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
             {/* Refresh Button */}
             <div className="mt-4 flex justify-end">
               <button onClick={loadData} className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors">
                 <RefreshCw className="h-3 w-3" /> Refresh Data
               </button>
             </div>
          </div>

          {/* New Feature: Weekly Performance Chart (Mock Visual) */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
             <div className="mb-6 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-purple-600" />
                  Weekly Performance
                </h3>
                <select className="text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none">
                  <option>Last 7 Days</option>
                  <option>This Month</option>
                </select>
             </div>
             
             <div className="flex items-end justify-between h-48 gap-2 pt-4">
                {[
                  { day: 'Mon', calls: 40, sales: 5 },
                  { day: 'Tue', calls: 32, sales: 8 },
                  { day: 'Wed', calls: 55, sales: 3 },
                  { day: 'Thu', calls: 48, sales: 6 },
                  { day: 'Fri', calls: 62, sales: 9 },
                  { day: 'Sat', calls: 25, sales: 2 },
                  { day: 'Sun', calls: 10, sales: 0 },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 w-full">
                     <div className="relative w-full flex items-end justify-center h-full gap-1">
                        <div className="w-2 bg-blue-200 rounded-t-sm hover:bg-blue-300 transition-colors" style={{ height: `${(item.calls / 70) * 100}%` }} title={`Calls: ${item.calls}`}></div>
                        <div className="w-2 bg-purple-500 rounded-t-sm hover:bg-purple-600 transition-colors shadow-sm" style={{ height: `${(item.sales / 15) * 100}%` }} title={`Sales: ${item.sales}`}></div>
                     </div>
                     <span className="text-[10px] font-medium text-slate-400">{item.day}</span>
                  </div>
                ))}
             </div>
             <div className="mt-4 flex items-center justify-center gap-6 text-xs text-slate-500">
               <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-200"></span> Calls</div>
               <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Conversions</div>
             </div>
          </div>
        </div>

        {/* Daily Goals & Tips */}
        <div className="space-y-6 h-fit">
           <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Daily Goal
            </h3>
            <div className="space-y-6">
              {/* Calls Goal */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500 font-medium">Calls Made</span>
                  <span className={`font-bold ${stats.callsMade >= 50 ? 'text-green-600' : 'text-slate-900'}`}>{stats.callsMade} / 50</span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${stats.callsMade >= 50 ? 'bg-green-500' : stats.callsMade >= 25 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                    style={{ width: `${Math.min((stats.callsMade / 50) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Conversions Goal */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500 font-medium">Conversions</span>
                  <span className={`font-bold ${stats.converted >= 10 ? 'text-green-600' : 'text-slate-900'}`}>{stats.converted} / 10</span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                     className={`h-full rounded-full transition-all duration-1000 ${stats.converted >= 10 ? 'bg-green-500' : 'bg-purple-600'}`}
                     style={{ width: `${Math.min((stats.converted / 10) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

               {/* Goal Badge */}
               {stats.callsMade >= 50 && (
                 <div className="mt-4 flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-100 text-green-700 text-xs font-bold animate-bounce">
                    <CheckCircle2 className="h-4 w-4" />
                    DAILY CALL GOAL ACHIEVED! 🚀
                 </div>
               )}
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-6 shadow-lg shadow-blue-200 text-white">
             <div className="flex items-start gap-3">
               <div className="p-2 bg-white/20 rounded-lg shrink-0">
                  <AlertCircle className="h-5 w-5 text-white" />
               </div>
               <div>
                 <p className="text-xs font-bold text-blue-100 uppercase tracking-wider mb-2">Today's Pro Tip</p>
                 <p className="text-sm font-medium leading-relaxed">
                   "Call follow-up leads within 2 hours for better conversion. Speed matches intent!"
                 </p>
                 <div className="mt-4 flex gap-2">
                   <span className="text-[10px] bg-white/20 px-2 py-1 rounded">#SalesTip</span>
                   <span className="text-[10px] bg-white/20 px-2 py-1 rounded">#Motivation</span>
                 </div>
               </div>
             </div>
          </div>
          
          {/* New Feature: Recent Activity Feed */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">Live Activity</h3>
            <div className="relative space-y-6 before:absolute before:inset-0 before:ml-2.5 before:h-full before:w-0.5 before:-translate-x-1/2 before:bg-slate-100 before:content-['']">
              {[
                { time: '10 min ago', text: 'Called Rahul Sharma', icon: PhoneCall, color: 'text-blue-500', bg: 'bg-blue-50' },
                { time: '45 min ago', text: 'WhatsApp sent to Priya', icon: MessageSquare, color: 'text-green-500', bg: 'bg-green-50' },
                { time: '2 hours ago', text: 'Marked Amit as "Interested"', icon: CheckCircle2, color: 'text-orange-500', bg: 'bg-orange-50' },
              ].map((act, i) => (
                <div key={i} className="relative flex items-center gap-3">
                   <div className={`relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-white ${act.bg} shadow-sm`}>
                     <act.icon className={`h-3 w-3 ${act.color}`} />
                   </div>
                   <div>
                     <p className="text-xs font-medium text-slate-900">{act.text}</p>
                     <p className="text-[10px] text-slate-400">{act.time}</p>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Update Status Modal */}
      {isStatusModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-900">Update Status</h3>
                <button onClick={() => setIsStatusModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-6">
                 <p className="text-sm text-slate-500 mb-1">Updating lead:</p>
                 <p className="font-bold text-slate-900 text-lg">{selectedLead.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { label: "Interested / Qualified", value: "qualified", color: "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200" },
                  { label: "Converted / Won", value: "converted", color: "bg-green-50 text-green-700 hover:bg-green-100 border-green-200" },
                  { label: "Follow-up Required", value: "contacted", color: "bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200" },
                  { label: "Not Interested", value: "lost", color: "bg-red-50 text-red-700 hover:bg-red-100 border-red-200" },
                  { label: "Wrong Number", value: "lost", color: "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200" },
                  { label: "Ringing / No Answer", value: "contacted", color: "bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200" },
                ].map((option, i) => (
                   <button
                     key={i}
                     onClick={async () => {
                        if (user && selectedLead) {
                           // Optimistic Update
                           const newStatus = option.value as Lead['status'];
                           
                           // Update local state immediately
                           setUrgentLeads(prev => prev.map(l => 
                             l.id === selectedLead.id ? { ...l, status: newStatus } : l
                           ));

                           // Show feedback
                           if (selectedLead.id.startsWith('mock-')) {
                             alert(`[DEMO MODE] Status updated to "${option.label}".\n\n(This is a simulation because the database is empty.)`);
                           }

                           await updateLeadStatus(user.id, selectedLead.id, newStatus);
                           setIsStatusModalOpen(false);
                           
                           // Only reload real data if not mock
                           if (!selectedLead.id.startsWith('mock-')) {
                              loadData(); 
                           }
                        }
                     }}
                     className={`p-3 rounded-xl border text-sm font-semibold transition-all hover:scale-[1.02] ${option.color} text-center flex flex-col items-center justify-center gap-1`}
                   >
                     {option.label}
                   </button>
                ))}
              </div>
              
               <div className="text-center">
                 <p className="text-xs text-slate-400">Updates are logged automatically</p>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
