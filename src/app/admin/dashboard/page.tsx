"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  ClipboardList, 
  PhoneCall, 
  TrendingUp,
  Clock,
  Loader2,
  ChevronRight,
  ArrowUpRight,
  Target,
  Zap,
  LayoutGrid
} from "lucide-react";
import { getAllLeads, Lead } from "@/lib/leads-service";
import { getAllUsersInDb, CRMUser } from "@/lib/users-service";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<CRMUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubLeads = getAllLeads(setLeads);
    const unsubUsers = getAllUsersInDb(setUsers);
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => {
      unsubLeads();
      unsubUsers();
      clearTimeout(timer);
    };
  }, []);

  const stats = [
    { name: "Total Leads", value: leads.length.toString(), icon: ClipboardList, color: "text-blue-600", bg: "bg-blue-50/50", trend: "+12%" },
    { name: "Active Agents", value: users.length.toString(), icon: Users, color: "text-purple-600", bg: "bg-purple-50/50", trend: "0" },
    { name: "Interested", value: leads.filter(l => l.status === 'qualified').length.toString(), icon: Target, color: "text-orange-600", bg: "bg-orange-50/50", trend: "Hot" },
    { name: "Conversion", value: leads.length > 0 ? `${Math.round((leads.filter(l => l.status === 'converted').length / leads.length) * 100)}%` : "0%", icon: Zap, color: "text-emerald-600", bg: "bg-emerald-50/50", trend: "Target 20%" },
  ];

  if (loading && leads.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center -mt-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Top Banner - App Welcome Area */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[32px] p-6 text-white shadow-xl shadow-blue-100 flex flex-col md:flex-row justify-between items-center gap-6 overflow-hidden relative">
         <div className="absolute top-0 right-0 p-4 opacity-10">
           <LayoutGrid className="h-32 w-32 rotate-12" />
         </div>
         <div className="relative z-10 w-full md:w-auto">
           <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">Matrix Command</h1>
           <p className="text-white/80 text-sm font-medium">Monitoring {leads.length} active leads across {users.length} agents</p>
         </div>
         <button 
           onClick={() => router.push('/admin/leads')}
           className="relative z-10 bg-white/10 backdrop-blur-md hover:bg-white/20 px-6 py-3 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 border border-white/20"
         >
           Access Database <ArrowUpRight className="h-4 w-4" />
         </button>
      </div>

      {/* Grid of Stats - Horizontal on Mobile if needed, or Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col gap-3 group">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.name}</p>
              <div className="flex items-end justify-between">
                <p className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{stat.value}</p>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg ${stat.color} bg-slate-50`}>{stat.trend}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Stream */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-lg italic">
              <Zap className="h-5 w-5 text-blue-500 fill-blue-500" />
              Live Feed
            </h3>
            <button 
              onClick={() => router.push('/admin/leads')}
              className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl hover:bg-blue-100 transition-colors"
            >
              Stream All
            </button>
          </div>
          <div className="space-y-3">
            {leads.slice(0, 5).map((lead) => (
              <div key={lead.id} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/50 border border-transparent hover:border-slate-100 transition-all">
                <div className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center text-xs font-bold text-slate-400 border border-slate-50">
                  {lead.name[0]}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900 leading-tight">{lead.name}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{lead.source}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                  lead.status === 'new' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  {lead.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Team Leaderboard Area */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
           <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-purple-600" />
              Agent Pulse
            </h3>
          </div>
          <div className="grid gap-4">
             {users.slice(0, 4).map((u, idx) => {
               const uLeads = leads.filter(l => l.assigned_to === u.id);
               const conv = uLeads.length > 0 ? Math.round((uLeads.filter(l => l.status === 'converted').length / uLeads.length) * 100) : 0;
               return (
                 <div key={u.id} className="flex items-center gap-4 group">
                    <div className="relative">
                      <div className="h-11 w-11 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 border border-slate-50 group-hover:bg-purple-600 group-hover:text-white transition-all">
                        {u.name[0]}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white ${u.status === 'Active' ? 'bg-green-500' : 'bg-slate-300'}`} />
                    </div>
                    <div className="flex-1">
                       <div className="flex justify-between items-baseline mb-1">
                         <p className="text-sm font-bold text-slate-900">{u.name}</p>
                         <p className="text-[10px] font-black text-blue-600">{conv}% CVR</p>
                       </div>
                       <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full transition-all duration-1000" style={{ width: `${conv || uLeads.length * 5}%` }} />
                       </div>
                    </div>
                 </div>
               );
             })}
          </div>
          <button 
            onClick={() => router.push('/admin/users')}
            className="w-full mt-6 py-3 rounded-2xl text-xs font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
          >
            Manage All Agents <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
