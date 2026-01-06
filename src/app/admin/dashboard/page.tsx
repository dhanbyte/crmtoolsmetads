"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  ClipboardList, 
  PhoneCall, 
  TrendingUp,
  Clock,
  Loader2
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
    
    // Set a timeout to stop loading if data is fetched
    const timer = setTimeout(() => setLoading(false), 1000);
    
    return () => {
      unsubLeads();
      unsubUsers();
      clearTimeout(timer);
    };
  }, []);

  const stats = [
    { name: "Total Leads", value: leads.length.toString(), icon: ClipboardList, color: "text-blue-600", bg: "bg-blue-50" },
    { name: "Active Team", value: users.length.toString(), icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
    { name: "Hot Leads", value: leads.filter(l => l.status === 'qualified').length.toString(), icon: PhoneCall, color: "text-orange-600", bg: "bg-orange-50" },
    { name: "Conversion", value: leads.length > 0 ? `${Math.round((leads.filter(l => l.status === 'converted').length / leads.length) * 100)}%` : "0%", icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
  ];

  if (loading && leads.length === 0 && users.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center -mt-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 leading-tight">Admin Dashboard</h1>
        <p className="text-slate-500">Overview of your CRM activities and team performance</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="flex items-center gap-4 rounded-2xl bg-white p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md hover:border-blue-100">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">{stat.name}</p>
              <p className="text-2xl font-bold text-slate-900 tracking-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Recent Leads
            </h3>
            <button 
              onClick={() => router.push('/admin/leads')}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              View All
            </button>
          </div>
          <div className="space-y-4">
            {leads.length === 0 ? (
              <p className="text-center py-8 text-slate-400 text-sm italic">No recent leads found</p>
            ) : (
              leads.slice(0, 5).map((lead) => (
                <div key={lead.id} className="flex items-center gap-4 rounded-xl border border-dashed border-slate-100 p-3 hover:bg-slate-50 transition-colors">
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                    <span className="text-xs font-bold text-slate-400">{lead.name[0]}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{lead.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{lead.source}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    lead.status === 'new' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-600'
                  }`}>
                    {lead.status.toUpperCase()}
                  </span>
                </div>
              ))
             )}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="mb-6">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Lead Status Distribution
            </h3>
          </div>
          <div className="space-y-4">
            {['new', 'contacted', 'qualified', 'converted', 'lost'].map(status => {
              const count = leads.filter(l => l.status === status).length;
              const percentage = leads.length > 0 ? (count / leads.length) * 100 : 0;
              const colorMap: any = {
                new: 'bg-blue-500',
                contacted: 'bg-yellow-500',
                qualified: 'bg-orange-500',
                converted: 'bg-green-500',
                lost: 'bg-red-500'
              };
              return (
                <div key={status} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                    <span>{status}</span>
                    <span>{count} ({Math.round(percentage)}%)</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div 
                      className={`h-full ${colorMap[status]} transition-all duration-1000`} 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            Team Performance Overview
          </h3>
          <button 
            onClick={() => router.push('/admin/users')}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Manage Team
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((u) => {
            const userLeads = leads.filter(l => l.assigned_to === u.id);
            const conversion = userLeads.length > 0 
              ? Math.round((userLeads.filter(l => l.status === 'converted').length / userLeads.length) * 100) 
              : 0;
            return (
              <div key={u.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
                    {u.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{u.name}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{u.role}</p>
                  </div>
                  <div className={`ml-auto h-2 w-2 rounded-full ${u.status === 'Active' ? 'bg-green-500' : 'bg-slate-300'}`} />
                </div>
                <div className="flex justify-between text-xs border-t border-slate-100 pt-3">
                  <div className="text-center">
                    <p className="text-slate-400 mb-0.5">Leads</p>
                    <p className="font-bold text-slate-900">{userLeads.length}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-400 mb-0.5">Conversion</p>
                    <p className="font-bold text-green-600">{conversion}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-400 mb-0.5">Status</p>
                    <p className={`font-bold ${u.status === 'Active' ? 'text-blue-600' : 'text-slate-400'}`}>{u.status}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
