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
  Search,
  Phone,
  MoreVertical
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getTeamDashboardStats, getUrgentFollowUps, DashboardStats, logActivity, updateLeadStatus, getAvailablePoolLeads, acceptLead, getGlobalSettings, updateLeadFollowUp } from "@/lib/dashboard-service";
import { Lead, Activity, supabase } from "@/lib/supabase";
import LeadCard from "@/components/lead-card";
import LeadRowMobile from "@/components/lead-row-mobile";
import { StatsCardSkeleton, LeadCardSkeleton } from "@/components/loading-skeleton";
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
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const router = useRouter();

  const loadData = async (skipCache = false) => {
    if (!user) return;
    setLoading(true);
    try {
      // Try to load from cache first (mobile optimization)
      const cacheKey = `dashboard_${user.id}`;
      const cachedData = !skipCache && sessionStorage.getItem(cacheKey);
      const cacheTime = sessionStorage.getItem(`${cacheKey}_time`);
      
      // Use cache if less than 2 minutes old
      if (cachedData && cacheTime && Date.now() - parseInt(cacheTime) < 120000) {
        const cached = JSON.parse(cachedData);
        setStats(cached.stats);
        setUrgentLeads(cached.urgentLeads);
        setPoolLeads(cached.poolLeads);
        setMyLeads(cached.myLeads);
        setWhatsappTemplate(cached.whatsappTemplate);
        setLoading(false);
        // Still fetch in background for real-time updates
        skipCache = false;
      }

      const [newStats, urgency, pool, template, allMyLeads] = await Promise.all([
        getTeamDashboardStats(user.id),
        getUrgentFollowUps(user.id),
        getAvailablePoolLeads(30), // Limit to 30 pool leads for faster loading
        getGlobalSettings('whatsapp_template'),
        supabase.from('leads').select('*').eq('assigned_to', user.id).limit(100) // Limit to 100 my leads
      ]);
      
      setStats(newStats);
      setUrgentLeads(urgency);
      setPoolLeads(pool);
      if (allMyLeads.data) setMyLeads(allMyLeads.data);
      const whatsappMsg = template?.message || "Hello {name}, calling from CRM regarding your inquiry about {interest}. How can we help you today?";
      setWhatsappTemplate(whatsappMsg);
      
      // Cache the data for mobile performance
      sessionStorage.setItem(cacheKey, JSON.stringify({
        stats: newStats,
        urgentLeads: urgency,
        poolLeads: pool,
        myLeads: allMyLeads.data || [],
        whatsappTemplate: whatsappMsg
      }));
      sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString());
      
      console.log('Dashboard loaded:', { 
        poolLeads: pool.length, 
        myLeads: allMyLeads.data?.length || 0,
        stats: newStats 
      });
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
       // Real-time subscriptions will automatically update both pool and my leads
     } catch (err) {
       alert("Failed to release lead");
       loadData(); // Refresh on error
     }
  };

  useEffect(() => {
    if (!authLoading && user) {
      loadData();

      // Real-time subscription for pool leads (unassigned)
      const poolChannel = supabase
        .channel('pool-leads-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'leads',
            filter: 'assigned_to=is.null',
          },
          async (payload) => {
            console.log('Pool leads change detected:', payload);
            // Refresh pool leads
            const pool = await getAvailablePoolLeads();
            setPoolLeads(pool);
          }
        )
        .subscribe();

      // Real-time subscription for my leads (assigned to current user)
      const myLeadsChannel = supabase
        .channel(`my-leads-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'leads',
            filter: `assigned_to=eq.${user.id}`,
          },
          async (payload) => {
            console.log('My leads change detected:', payload);
            // Refresh my leads and stats
            const [newStats, urgency, allMyLeads] = await Promise.all([
              getTeamDashboardStats(user.id),
              getUrgentFollowUps(user.id),
              supabase.from('leads').select('*').eq('assigned_to', user.id)
            ]);
            setStats(newStats);
            setUrgentLeads(urgency);
            if (allMyLeads.data) setMyLeads(allMyLeads.data);
          }
        )
        .subscribe();

      // Cleanup subscriptions on unmount
      return () => {
        supabase.removeChannel(poolChannel);
        supabase.removeChannel(myLeadsChannel);
      };
    }
  }, [user, authLoading]);

  // Handle accept lead
  const handleAcceptLead = async (leadId: string) => {
    if (!user) return;
    try {
      await acceptLead(user.id, leadId);
      // Optimistically remove from pool (real-time will confirm)
      setPoolLeads(prev => prev.filter(l => l.id !== leadId));
      // Real-time subscriptions will automatically update my leads and stats
    } catch (error) {
      console.error('Failed to accept lead:', error);
      alert('Failed to accept lead');
      // Refresh on error to get correct state
      loadData();
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

  const interestedCount = myLeads.filter(l => l.status === 'qualified').length;
  
  const statCards = [
    { name: "My Leads", value: stats.myLeads, icon: ClipboardList, color: "text-green-600", bg: "bg-green-50" },
    { name: "Interested", value: interestedCount, icon: AlertCircle, color: "text-yellow-600", bg: "bg-yellow-50" },
    { name: "Calls Made", value: stats.callsMade, icon: PhoneCall, color: "text-orange-600", bg: "bg-orange-50" },
    { name: "Converted", value: stats.converted, icon: CheckCircle2, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="space-y-4 md:space-y-8 animate-in pb-4 md:pb-12">
      {/* Top User Context & Welcome - Mobile Optimized */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">{greeting}, {userData?.name?.split(' ')[0] || "Team Member"}!</h1>
          <p className="text-xs md:text-sm text-slate-500 flex items-center gap-2 flex-wrap">
            <span className="hidden md:inline">{new Date().toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <span className="md:hidden">{new Date().toLocaleDateString("en-US", { month: 'short', day: 'numeric' })}</span>
            <span className="hidden md:inline h-1 w-1 rounded-full bg-slate-300"></span>
            <span className="hidden md:inline italic text-slate-400 text-xs">"Make every call count!"</span>
          </p>
        </div>
        <div className="flex items-center gap-2 md:gap-3 bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
            {userData?.name?.[0] || "U"}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-slate-900">{userData?.email}</p>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{userData?.role}</p>
          </div>
          <button onClick={() => signOut()} className="ml-2 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors hidden md:block" title="Sign Out">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Stats Grid - Horizontal Scroll on Mobile */}
      <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0 hide-scrollbar">
        <div className="flex md:grid gap-3 md:gap-6 md:grid-cols-2 lg:grid-cols-4 min-w-max md:min-w-0">
          {loading ? (
            <>
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
            </>
          ) : (
            statCards.map((stat) => (
              <div key={stat.name} className="flex items-center gap-4 rounded-2xl bg-white p-5 md:p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md hover:border-blue-100 cursor-pointer group min-w-[180px] md:min-w-0">
                <div className={`flex h-14 w-14 md:h-12 md:w-12 items-center justify-center rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform flex-shrink-0`}>
                  <stat.icon className="h-7 w-7 md:h-6 md:w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-600 whitespace-nowrap">{stat.name}</p>
                  <p className="text-2xl md:text-2xl font-bold text-slate-900 tracking-tight">{stat.value}</p>
                </div>
              </div>
            ))
          )}
        </div>
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
            <button onClick={() => loadData()} className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors">
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
          {/* Filters Section */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
            <div className="mb-4 flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm">Filters:</h3>
            </div>
            
            {/* Status Filter */}
            <div className="mb-4">
              <p className="text-sm font-bold text-slate-700 mb-3">Status</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                    statusFilter === 'all'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Leads
                </button>
                <button
                  onClick={() => setStatusFilter('qualified')}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                    statusFilter === 'qualified'
                      ? 'bg-yellow-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  👍 Interested
                </button>
                <button
                  onClick={() => setStatusFilter('converted')}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                    statusFilter === 'converted'
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  ✅ Done
                </button>
                <button
                  onClick={() => setStatusFilter('ready')}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                    statusFilter === 'ready'
                      ? 'bg-orange-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  🔔 Need Follow-up
                </button>
              </div>
            </div>

            {/* Time Filter */}
            <div>
              <p className="text-sm font-bold text-slate-700 mb-3">Follow-up Time</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setTimeFilter('all')}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                    timeFilter === 'all'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Time
                </button>
                <button
                  onClick={() => setTimeFilter('evening')}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                    timeFilter === 'evening'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  🌆 Evening
                </button>
                <button
                  onClick={() => setTimeFilter('tomorrow')}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                    timeFilter === 'tomorrow'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  📅 Tomorrow
                </button>
                <button
                  onClick={() => setTimeFilter('2days')}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                    timeFilter === '2days'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  2 Days
                </button>
                <button
                  onClick={() => setTimeFilter('5days')}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                    timeFilter === '5days'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  5 Days
                </button>
                <button
                  onClick={() => setTimeFilter('month')}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                    timeFilter === 'month'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  📆 This Month
                </button>
              </div>
            </div>
          </div>

          {/* My Leads Table */}
          <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-lg">
                <CheckSquare className="h-5 w-5 text-green-600" />
                My Leads ({myLeads.filter(l => {
                  // Apply status filter
                  if (statusFilter === 'converted' && l.status !== 'converted') return false;
                  if (statusFilter === 'qualified' && l.status !== 'qualified') return false;
                  if (statusFilter === 'ready' && (!l.next_follow_up || new Date(l.next_follow_up) > new Date())) return false;
                  
                  // Apply time filter
                  const now = new Date();
                  const followUp = l.next_follow_up ? new Date(l.next_follow_up) : null;
                  
                  if (timeFilter === 'evening') {
                    const today6PM = new Date(now);
                    today6PM.setHours(18, 0, 0, 0);
                    const today11PM = new Date(now);
                    today11PM.setHours(23, 59, 59, 999);
                    if (!followUp || followUp < today6PM || followUp > today11PM) return false;
                  }
                  if (timeFilter === 'tomorrow') {
                    const tomorrow = new Date(now);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    tomorrow.setHours(0, 0, 0, 0);
                    const tomorrowEnd = new Date(tomorrow);
                    tomorrowEnd.setHours(23, 59, 59, 999);
                    if (!followUp || followUp < tomorrow || followUp > tomorrowEnd) return false;
                  }
                  if (timeFilter === '2days') {
                    const twoDays = new Date(now);
                    twoDays.setDate(twoDays.getDate() + 2);
                    if (!followUp || followUp > twoDays) return false;
                  }
                  if (timeFilter === '5days') {
                    const fiveDays = new Date(now);
                    fiveDays.setDate(fiveDays.getDate() + 5);
                    if (!followUp || followUp > fiveDays) return false;
                  }
                  if (timeFilter === 'month') {
                    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
                    if (!followUp || followUp > monthEnd) return false;
                  }
                  
                  // Apply search
                  if (myLeadsSearch && !l.name.toLowerCase().includes(myLeadsSearch.toLowerCase()) && !l.phone.includes(myLeadsSearch)) return false;
                  
                  return true;
                }).length})
              </h3>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search..." 
                    className="input-field pl-10 h-9 text-xs w-48"
                    value={myLeadsSearch}
                    onChange={(e) => setMyLeadsSearch(e.target.value)}
                  />
                </div>
                <button onClick={() => loadData()} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-blue-600 transition-colors">
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
              <>
                {/* Mobile View - Stacked Cards */}
                <div className="md:hidden p-4">
                  {loading ? (
                    <>
                      <LeadCardSkeleton />
                      <LeadCardSkeleton />
                      <LeadCardSkeleton />
                    </>
                  ) : myLeads
                    .filter(l => {
                      // Apply status filter
                      if (statusFilter === 'converted' && l.status !== 'converted') return false;
                      if (statusFilter === 'qualified' && l.status !== 'qualified') return false;
                      if (statusFilter === 'ready' && (!l.next_follow_up || new Date(l.next_follow_up) > new Date())) return false;
                      
                      // Apply time filter
                      const now = new Date();
                      const followUp = l.next_follow_up ? new Date(l.next_follow_up) : null;
                      
                      if (timeFilter === 'evening') {
                        const today6PM = new Date(now);
                        today6PM.setHours(18, 0, 0, 0);
                        const today11PM = new Date(now);
                        today11PM.setHours(23, 59, 59, 999);
                        if (!followUp || followUp < today6PM || followUp > today11PM) return false;
                      }
                      if (timeFilter === 'tomorrow') {
                        const tomorrow = new Date(now);
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        tomorrow.setHours(0, 0, 0, 0);
                        const tomorrowEnd = new Date(tomorrow);
                        tomorrowEnd.setHours(23, 59, 59, 999);
                        if (!followUp || followUp < tomorrow || followUp > tomorrowEnd) return false;
                      }
                      if (timeFilter === '2days') {
                        const twoDays = new Date(now);
                        twoDays.setDate(twoDays.getDate() + 2);
                        if (!followUp || followUp > twoDays) return false;
                      }
                      if (timeFilter === '5days') {
                        const fiveDays = new Date(now);
                        fiveDays.setDate(fiveDays.getDate() + 5);
                        if (!followUp || followUp > fiveDays) return false;
                      }
                      if (timeFilter === 'month') {
                        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
                        if (!followUp || followUp > monthEnd) return false;
                      }
                      
                      // Apply search
                      if (myLeadsSearch && !l.name.toLowerCase().includes(myLeadsSearch.toLowerCase()) && !l.phone.includes(myLeadsSearch)) return false;
                      
                      return true;
                    })
                    .map((lead) => (
                      <LeadRowMobile
                        key={lead.id}
                        lead={lead}
                        onCall={async (lead) => {
                          window.location.href = `tel:${lead.phone}`;
                          if (user) {
                            await logActivity(user.id, lead.id, 'call', 'Call initiated from dashboard');
                            const newStats = await getTeamDashboardStats(user.id);
                            setStats(newStats);
                          }
                        }}
                        onWhatsApp={handleWhatsApp}
                        onStatusChange={async (leadId, newStatus) => {
                          if (!user) return;
                          try {
                            await updateLeadStatus(user.id, leadId, newStatus as any);
                            loadData();
                          } catch (error) {
                            console.error('Failed to update status:', error);
                          }
                        }}
                        onScheduleFollowUp={(lead) => setFollowUpModal({ lead, open: true })}
                      />
                    ))}
                </div>

                {/* Desktop View - Table */}
                <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Source</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Follow-up</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Notes</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {myLeads
                      .filter(l => {
                        // Apply status filter
                        if (statusFilter === 'converted' && l.status !== 'converted') return false;
                        if (statusFilter === 'qualified' && l.status !== 'qualified') return false;
                        if (statusFilter === 'ready' && (!l.next_follow_up || new Date(l.next_follow_up) > new Date())) return false;
                        
                        // Apply time filter
                        const now = new Date();
                        const followUp = l.next_follow_up ? new Date(l.next_follow_up) : null;
                        
                        if (timeFilter === 'evening') {
                          const today6PM = new Date(now);
                          today6PM.setHours(18, 0, 0, 0);
                          const today11PM = new Date(now);
                          today11PM.setHours(23, 59, 59, 999);
                          if (!followUp || followUp < today6PM || followUp > today11PM) return false;
                        }
                        if (timeFilter === 'tomorrow') {
                          const tomorrow = new Date(now);
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          tomorrow.setHours(0, 0, 0, 0);
                          const tomorrowEnd = new Date(tomorrow);
                          tomorrowEnd.setHours(23, 59, 59, 999);
                          if (!followUp || followUp < tomorrow || followUp > tomorrowEnd) return false;
                        }
                        if (timeFilter === '2days') {
                          const twoDays = new Date(now);
                          twoDays.setDate(twoDays.getDate() + 2);
                          if (!followUp || followUp > twoDays) return false;
                        }
                        if (timeFilter === '5days') {
                          const fiveDays = new Date(now);
                          fiveDays.setDate(fiveDays.getDate() + 5);
                          if (!followUp || followUp > fiveDays) return false;
                        }
                        if (timeFilter === 'month') {
                          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
                          if (!followUp || followUp > monthEnd) return false;
                        }
                        
                        // Apply search
                        if (myLeadsSearch && !l.name.toLowerCase().includes(myLeadsSearch.toLowerCase()) && !l.phone.includes(myLeadsSearch)) return false;
                        
                        return true;
                      })
                      .map((lead) => {
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

                        const getStatusLabel = (status: string) => {
                          switch (status?.toLowerCase()) {
                            case 'new': return 'New';
                            case 'contacted': return 'Contacted';
                            case 'qualified': return 'Interested';
                            case 'converted': return 'Done ✓';
                            case 'lost': return 'Rejected';
                            default: return status;
                          }
                        };
                        
                        const nextFollowUp = lead.next_follow_up 
                          ? new Date(lead.next_follow_up).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : '-';

                        const handleCallClick = async () => {
                          window.location.href = `tel:${lead.phone}`;
                          if (user) {
                            await logActivity(user.id, lead.id, 'call', 'Call initiated from dashboard');
                            // Refresh stats to show updated call count
                            const newStats = await getTeamDashboardStats(user.id);
                            setStats(newStats);
                          }
                        };

                        const handleStatusChange = async (newStatus: string) => {
                          if (!user) return;
                          try {
                            await updateLeadStatus(user.id, lead.id, newStatus as any);
                            // Refresh data
                            loadData();
                          } catch (error) {
                            console.error('Failed to update status:', error);
                          }
                        };

                        return (
                          <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                                  {lead.name[0]?.toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">{lead.name}</p>
                                  {lead.interest && (
                                    <p className="text-xs text-slate-500 truncate max-w-[200px]">{lead.interest}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <a 
                                href={`tel:${lead.phone}`} 
                                className="text-base text-blue-600 font-bold hover:underline block"
                              >
                                {lead.phone}
                              </a>
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={lead.status}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg text-sm font-bold uppercase border-2 transition-all cursor-pointer hover:shadow-md ${getStatusColor(lead.status)}`}
                                style={{ minWidth: '140px', fontSize: '13px' }}
                              >
                                <option value="new">🆕 New</option>
                                <option value="contacted">📞 Contacted</option>
                                <option value="qualified">👍 Interested</option>
                                <option value="converted">✅ Done</option>
                                <option value="lost">❌ Rejected</option>
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-xs text-slate-600 font-medium">{lead.source || 'Direct'}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-xs text-slate-700 font-medium">{nextFollowUp}</p>
                            </td>
                            <td className="px-4 py-3">
                              {lead.follow_up_notes ? (
                                <p className="text-xs text-slate-600 italic truncate max-w-[150px]">"{lead.follow_up_notes}"</p>
                              ) : (
                                <p className="text-xs text-slate-400">-</p>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={handleCallClick}
                                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all shadow-sm active:scale-95"
                                  title="Call"
                                >
                                  <Phone className="h-4 w-4" />
                                  Call
                                </button>
                                <button
                                  onClick={() => handleWhatsApp(lead)}
                                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-bold hover:brightness-110 transition-all shadow-sm active:scale-95"
                                  style={{ backgroundColor: '#25D366', color: 'white' }}
                                  title="WhatsApp"
                                >
                                  <MessageSquare className="h-4 w-4" />
                                  WP
                                </button>
                                <button
                                  onClick={() => setFollowUpModal({ lead, open: true })}
                                  className="flex items-center justify-center p-2.5 rounded-lg bg-orange-100 text-orange-600 hover:bg-orange-200 transition-colors active:scale-95"
                                  title="Schedule Follow-up"
                                >
                                  <Clock className="h-5 w-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
                
                {myLeads.filter(l => {
                  // Same filter logic as above
                  if (statusFilter === 'converted' && l.status !== 'converted') return false;
                  if (statusFilter === 'qualified' && l.status !== 'qualified') return false;
                  if (statusFilter === 'ready' && (!l.next_follow_up || new Date(l.next_follow_up) > new Date())) return false;
                  const now = new Date();
                  const followUp = l.next_follow_up ? new Date(l.next_follow_up) : null;
                  if (timeFilter === 'evening') {
                    const today6PM = new Date(now);
                    today6PM.setHours(18, 0, 0, 0);
                    const today11PM = new Date(now);
                    today11PM.setHours(23, 59, 59, 999);
                    if (!followUp || followUp < today6PM || followUp > today11PM) return false;
                  }
                  if (timeFilter === 'tomorrow') {
                    const tomorrow = new Date(now);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    tomorrow.setHours(0, 0, 0, 0);
                    const tomorrowEnd = new Date(tomorrow);
                    tomorrowEnd.setHours(23, 59, 59, 999);
                    if (!followUp || followUp < tomorrow || followUp > tomorrowEnd) return false;
                  }
                  if (timeFilter === '2days') {
                    const twoDays = new Date(now);
                    twoDays.setDate(twoDays.getDate() + 2);
                    if (!followUp || followUp > twoDays) return false;
                  }
                  if (timeFilter === '5days') {
                    const fiveDays = new Date(now);
                    fiveDays.setDate(fiveDays.getDate() + 5);
                    if (!followUp || followUp > fiveDays) return false;
                  }
                  if (timeFilter === 'month') {
                    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
                    if (!followUp || followUp > monthEnd) return false;
                  }
                  if (myLeadsSearch && !l.name.toLowerCase().includes(myLeadsSearch.toLowerCase()) && !l.phone.includes(myLeadsSearch)) return false;
                  return true;
                }).length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <Search className="h-10 w-10 mb-2 opacity-20" />
                    <p className="text-sm">No leads match the selected filters.</p>
                    <button 
                      onClick={() => { setStatusFilter('all'); setTimeFilter('all'); setMyLeadsSearch(''); }}
                      className="mt-3 text-xs text-blue-600 hover:underline font-semibold"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>
            </>
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

