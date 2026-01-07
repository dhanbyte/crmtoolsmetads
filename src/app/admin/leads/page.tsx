"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, Download as DownloadIcon, Plus, UserPlus, Trash2, Loader2, MapPin, Phone, X, Upload, RefreshCw, User, Users as UsersIcon, MoreVertical, Globe, Calendar } from "lucide-react";
import { getAllLeads, Lead, deleteLead, updateLead, bulkImportLeads } from "@/lib/leads-service";
import { convertToCSV, downloadCSV } from "@/lib/csv-utils";
import { getAllUsersInDb, CRMUser } from "@/lib/users-service";

export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal states
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isQuickAdd, setIsQuickAdd] = useState(true); 
  const [newLead, setNewLead] = useState({ name: '', email: '', phone: '', source: 'Manual Entry', city: '', interest: '' });
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [users, setUsers] = useState<CRMUser[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [googleSheetsConfigured, setGoogleSheetsConfigured] = useState(false);
  const [unassigning, setUnassigning] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const unsubscribeLeads = getAllLeads((data) => {
      setLeads(data);
      setLoading(false);
    });
    
    const unsubscribeUsers = getAllUsersInDb((data) => {
      setUsers(data.filter(u => u.role === 'team'));
    });

    checkGoogleSheetsConfig();

    return () => {
      unsubscribeLeads();
      unsubscribeUsers();
    };
  }, []);

  const checkGoogleSheetsConfig = async () => {
    try {
      const response = await fetch('/api/admin/sync-google-sheets');
      const data = await response.json();
      setGoogleSheetsConfigured(data.configured);
    } catch (error) {
      console.error('Error checking Google Sheets config:', error);
    }
  };

  const handleSyncGoogleSheets = async () => {
    setSyncing(true);
    setSyncStatus('');
    try {
      const response = await fetch('/api/admin/sync-google-sheets', {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        setSyncStatus(`✓ ${data.message}`);
        setTimeout(() => setSyncStatus(''), 5000);
      } else {
        setSyncStatus(`✗ ${data.error}`);
      }
    } catch (error: any) {
      setSyncStatus(`✗ Error: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!newLead.phone) {
        alert("Phone number is required");
        return;
      }

      const { addLead } = await import("@/lib/leads-service");
      
      // Only save essential fields - let database handle the rest
      const leadToSave: any = { 
        name: newLead.name || `Lead ${newLead.phone.slice(-4)}`,
        phone: newLead.phone,
        email: newLead.email || `lead${newLead.phone}@temp.com`, // Auto-generate email if empty
        source: 'Manual Entry',
        assigned_to: null,
        status: 'new' as const
      };

      await addLead(leadToSave);
      setShowAddModal(false);
      setNewLead({ name: '', email: '', phone: '', source: 'Manual Entry', city: '', interest: '' });
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    try {
      await deleteLead(id);
    } catch (error: any) {
      alert(error.message || "Failed to delete lead");
    }
  };

  const filteredLeads = leads.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Header Info - Improved for Mobile */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center justify-between w-full md:w-auto">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Leads Matrix</h1>
            <p className="text-xs md:text-sm text-slate-500 font-medium">Total registered: {leads.length}</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="md:hidden h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>

        <div className="hidden md:flex gap-3">
          <button onClick={handleSyncGoogleSheets} disabled={syncing} className="btn-secondary">
            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            Sync Sheets
          </button>
          <button onClick={() => setShowAddModal(true)} className="btn-primary">
            <Plus className="mr-2 h-4 w-4" />
            Add New Lead
          </button>
        </div>
      </div>

      {/* Modern Search & Filter Bar */}
      <div className="sticky top-[64px] md:top-0 z-40 bg-slate-50/80 backdrop-blur-md py-2 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
           <div className="relative flex-1 group">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
             <input 
               type="text" 
               placeholder="Search by name, phone or city..." 
               className="w-full bg-white pl-12 pr-4 py-3 md:py-2.5 rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
           <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
             {['all', 'new', 'contacted', 'qualified', 'converted'].map(status => (
               <button
                 key={status}
                 onClick={() => setStatusFilter(status)}
                 className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border-2 transition-all ${
                   statusFilter === status 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100' 
                    : 'bg-white border-slate-100 text-slate-500 hover:border-blue-100 hover:text-blue-600'
                 }`}
               >
                 {status}
               </button>
             ))}
           </div>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          {/* Mobile View: High-Quality Cards */}
          <div className="grid gap-4 md:hidden">
            {filteredLeads.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
                 <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                   <UsersIcon className="h-8 w-8 text-slate-300" />
                 </div>
                 <p className="text-slate-500 font-medium">No leads found in this filter.</p>
              </div>
            ) : (
              filteredLeads.map((lead) => (
                <div key={lead.id} className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 active:scale-[0.98] transition-transform">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-blue-600 font-bold">
                        {lead.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 leading-tight">{lead.name}</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{lead.phone}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wide ${
                      lead.status === 'qualified' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                      lead.status === 'converted' ? 'bg-green-50 text-green-600 border border-green-100' :
                      'bg-blue-50 text-blue-600 border border-blue-100'
                    }`}>
                      {lead.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 py-3 border-y border-slate-50 mb-4">
                    <div className="flex-1">
                      <p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Assigned To</p>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        {lead.assigned_to ? (users.find(u => u.id === lead.assigned_to)?.name || 'Agent') : 'Public Pool'}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Location</p>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        {lead.city || 'Not Specified'}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setSelectedLead(lead); setShowAssignModal(true); }}
                      className="flex-1 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-slate-100"
                    >
                      <UserPlus className="h-3.5 w-3.5" /> Assign
                    </button>
                    <button 
                      onClick={() => window.location.href = `tel:${lead.phone}`}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-green-100 flex items-center justify-center gap-2"
                    >
                      <Phone className="h-3.5 w-3.5" /> Call
                    </button>
                    <button 
                      onClick={() => handleDelete(lead.id)}
                      className="w-11 h-11 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-100 border border-red-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop View: Clean Matrix Table */}
          <div className="hidden md:block bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400 tracking-widest">Lead Identity</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400 tracking-widest">Ownership</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400 tracking-widest">Pipeline Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400 tracking-widest">Timestamp</th>
                  <th className="px-6 py-4 text-right text-[10px] font-bold uppercase text-slate-400 tracking-widest">Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm">
                          {lead.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{lead.name}</p>
                          <p className="text-xs text-slate-500">{lead.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className={`text-xs font-bold ${!lead.assigned_to ? 'text-red-500' : 'text-slate-600'}`}>
                         {lead.assigned_to ? users.find(u => u.id === lead.assigned_to)?.name : 'Public Pool'}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        lead.status === 'qualified' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                        lead.status === 'converted' ? 'bg-green-50 text-green-600 border-green-100' :
                        'bg-blue-50 text-blue-600 border-blue-100'
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 text-slate-400">
                        <button onClick={() => { setSelectedLead(lead); setShowAssignModal(true); }} className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"><UserPlus className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(lead.id)} className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Reusable Modals (Kept mostly same but adding visual polish) */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600" />
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold text-slate-900">Add New Entry</h3>
               <button onClick={() => setShowAddModal(false)} className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"><X className="h-5 w-5" /></button>
            </div>
            
            <form onSubmit={handleManualAdd} className="space-y-5">
               <div>
                 <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                 <input 
                   type="text" 
                   className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all font-semibold text-slate-900" 
                   placeholder="Rahul Sharma"
                   value={newLead.name} 
                   onChange={e => setNewLead({...newLead, name: e.target.value})} 
                 />
               </div>
               <div>
                 <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Phone Number</label>
                 <input 
                   required
                   type="tel" 
                   className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all font-bold text-slate-900 text-lg" 
                   placeholder="9988776655"
                   value={newLead.phone} 
                   onChange={e => setNewLead({...newLead, phone: e.target.value})} 
                 />
               </div>
               <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[20px] font-bold shadow-xl shadow-blue-100 active:scale-[0.98] transition-all">
                 Confirm Registration
               </button>
            </form>
          </div>
        </div>
      )}

      {/* Assign Modal - Improved for Mobile */}
      {showAssignModal && selectedLead && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in slide-in-from-bottom-5 duration-300">
          <div className="w-full max-w-md bg-white rounded-t-[32px] md:rounded-[32px] p-6 shadow-2xl">
             <div className="w-12 h-1 bg-slate-100 rounded-full mx-auto mb-6 md:hidden" />
             <div className="flex justify-between items-center mb-6">
               <div>
                 <h3 className="text-xl font-bold text-slate-900">Assign Agent</h3>
                 <p className="text-xs text-slate-500">Pick a team member for {selectedLead.name}</p>
               </div>
               <button onClick={() => setShowAssignModal(false)} className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"><X className="h-5 w-5" /></button>
             </div>
             
             <div className="grid gap-2 max-h-[40vh] overflow-y-auto pr-1 hide-scrollbar">
                {users.map(u => (
                  <button 
                    key={u.id}
                    onClick={async () => {
                      await updateLead(selectedLead.id, { assigned_to: u.id });
                      setShowAssignModal(false);
                    }}
                    className="flex items-center gap-3 p-3 rounded-2xl border border-slate-50 hover:border-blue-200 hover:bg-blue-50 transition-all group"
                  >
                    <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold group-hover:bg-blue-600 group-hover:text-white transition-all">
                      {u.name[0]}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-slate-900">{u.name}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">{u.role}</p>
                    </div>
                  </button>
                ))}
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
