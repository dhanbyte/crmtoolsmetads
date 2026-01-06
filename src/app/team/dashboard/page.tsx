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
  CheckSquare,
  X,
  Search
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getTeamDashboardStats, getUrgentFollowUps, DashboardStats, logActivity, updateLeadStatus, getAvailablePoolLeads, acceptLead, getGlobalSettings, updateLeadFollowUp } from "@/lib/dashboard-service";
import { Lead, Activity, supabase } from "@/lib/supabase";
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
  const [whatsappTemplate, setWhatsappTemplate] = useState('');
  const [followUpModal, setFollowUpModal] = useState<{ lead: Lead; open: boolean }>({ lead: null as any, open: false });
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [historyModal, setHistoryModal] = useState<{ lead: Lead; open: boolean }>({ lead: null as any, open: false });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [myLeads, setMyLeads] = useState<Lead[]>([]);
  const [myLeadsSearch, setMyLeadsSearch] = useState('');
  const router = useRouter();

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [newStats, urgency, pool, template, allMyLeads] = await Promise.all([
        getTeamDashboardStats(user.id),
        getUrgentFollowUps(user.id),
        getAvailablePoolLeads(),
        getGlobalSettings('whatsapp_template'),
        supabase.from('leads').select('*').eq('assigned_to', user.id)
      ]);
      setStats(newStats);
      setUrgentLeads(urgency);
      setPoolLeads(pool);
      if (allMyLeads.data) setMyLeads(allMyLeads.data);
      if (template?.message) {
        setWhatsappTemplate(template.message);
      }
    } catch (error) {
      console.error("Failed to load dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewHistory = async (lead: Lead) => {
    setHistoryModal({ lead, open: true });
    setHistoryLoading(true);
    try {
      const { getLeadActivities } = await import("@/lib/dashboard-service");
      const data = await getLeadActivities(lead.id);
      setActivities(data);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleReleaseLead = async (leadId: string) => {
     if (!confirm("Are you sure you want to release this lead back to the pool?")) return;
     try {
       await (supabase as any).from('leads').update({ assigned_to: null, updated_at: new Date().toISOString() }).eq('id', leadId);
       loadData();
     } catch (err) {
       alert("Failed to release lead");
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

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {urgentLeads.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <CheckCircle2 className="h-10 w-10 mb-2 opacity-20" />
                  <p>All caught up! No urgent follow-ups.</p>
                </div>
              ) : (
                urgentLeads.map((item) => (
                  <LeadCard
                    key={item.id}
                    lead={item}
                    mode="my-leads"
                    onWhatsApp={handleWhatsApp}
                    onViewHistory={handleViewHistory}
                    onUpdateStatus={(l) => { setSelectedLead(l); setIsStatusModalOpen(true); }}
                    onRelease={handleReleaseLead}
                    onAddNote={(l) => setFollowUpModal({ lead: l, open: true })}
                    userId={user?.id}
                  />
                ))
              )}
            </div>
          </div>

          {/* My Leads Grid */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-lg">
                <CheckSquare className="h-5 w-5 text-green-600" />
                My Leads ({myLeads.length})
              </h3>
              <div className="flex gap-2 flex-1 max-w-sm">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search my leads..." 
                    className="input-field pl-10 h-10 text-xs"
                    value={myLeadsSearch}
                    onChange={(e) => setMyLeadsSearch(e.target.value)}
                  />
                </div>
                <button onClick={loadData} className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-blue-600 transition-colors">
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>

            {myLeads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <CheckSquare className="h-12 w-12 mb-3 opacity-20" />
                <p>No leads assigned yet.</p>
                <p className="text-xs opacity-70 mt-2">Check the pool to accept new leads!</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {myLeads
                  .filter(l => l.name.toLowerCase().includes(myLeadsSearch.toLowerCase()) || l.phone.includes(myLeadsSearch))
                  .map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      mode="my-leads"
                      onWhatsApp={handleWhatsApp}
                      onViewHistory={handleViewHistory}
                      onUpdateStatus={(l) => { setSelectedLead(l); setIsStatusModalOpen(true); }}
                      onRelease={handleReleaseLead}
                      onAddNote={(l) => setFollowUpModal({ lead: l, open: true })}
                      userId={user?.id}
                    />
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {isStatusModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-900">Update Lead Status</h3>
                <button onClick={() => setIsStatusModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                   <X />
                </button>
              </div>

              <div className="space-y-3">
                {[
                  { id: 'contacted', label: 'Contacted', color: 'bg-blue-100 text-blue-700' },
                  { id: 'qualified', label: 'Qualified / Interested', color: 'bg-yellow-100 text-yellow-700' },
                  { id: 'converted', label: 'Converted / Won', color: 'bg-green-100 text-green-700' },
                  { id: 'lost', label: 'Not Interested / Lost', color: 'bg-red-100 text-red-700' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={async () => {
                      if (!user) return;
                      await updateLeadStatus(user.id, selectedLead.id, s.id as any);
                      setIsStatusModalOpen(false);
                      loadData();
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all text-left"
                  >
                    <span className="font-bold text-slate-900">{s.label}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${s.color}`}>
                      {s.id.toUpperCase()}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setIsStatusModalOpen(false)}
                  className="w-full px-4 py-3 rounded-lg bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyModal.open && historyModal.lead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900">Lead History</h3>
                <button onClick={() => setHistoryModal({ lead: null as any, open: false })} className="text-slate-400 hover:text-slate-600">
                   <X />
                </button>
              </div>
              
              <div className="flex items-center gap-3 mb-6 bg-slate-50 p-4 rounded-2xl">
                 <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                    {historyModal.lead.name[0]}
                 </div>
                 <div>
                    <p className="text-sm font-bold text-slate-900">{historyModal.lead.name}</p>
                    <p className="text-xs text-slate-500 italic">Timeline of interactions</p>
                 </div>
              </div>

              <div className="space-y-6 max-h-[400px] overflow-y-auto px-2 custom-scrollbar">
                {historyLoading ? (
                  <div className="flex justify-center py-10"><Loader2 className="animate-spin h-6 w-6 text-blue-600" /></div>
                ) : activities.length === 0 ? (
                  <p className="text-center py-10 text-slate-400 text-sm">No activities logged yet.</p>
                ) : (
                  activities.map((act, i) => (
                    <div key={act.id} className="relative pl-6 pb-6 border-l-2 border-slate-100 last:pb-0">
                       <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-white border-4 border-blue-500" />
                       <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">{act.type}</span>
                            <span className="text-[10px] text-slate-400">{new Date(act.created_at || '').toLocaleString()}</span>
                          </div>
                          <p className="text-sm text-slate-700 font-medium">{act.details}</p>
                       </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6">
                <button onClick={() => setHistoryModal({ lead: null as any, open: false })} className="w-full btn-primary py-3">Close</button>
              </div>
            </div>
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

