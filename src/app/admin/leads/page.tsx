"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, Download as DownloadIcon, Plus, UserPlus, Trash2, Loader2, MapPin, Phone, X, Upload, RefreshCw } from "lucide-react";
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
  const [newLead, setNewLead] = useState({ name: '', email: '', phone: '', source: 'Manual Entry', city: '', interest: '' });
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [users, setUsers] = useState<CRMUser[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [googleSheetsConfigured, setGoogleSheetsConfigured] = useState(false);

  useEffect(() => {
    const unsubscribeLeads = getAllLeads((data) => {
      setLeads(data);
      setLoading(false);
    });
    
    const unsubscribeUsers = getAllUsersInDb((data) => {
      setUsers(data.filter(u => u.role === 'team'));
    });

    // Check if Google Sheets is configured
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

  const handleExportCSV = () => {
    const csvData = leads.map(l => ({
      Name: l.name,
      Email: l.email,
      Phone: l.phone,
      Status: l.status,
      Source: l.source,
      City: l.city || 'N/A',
      'Created At': l.created_at ? new Date(l.created_at).toLocaleString() : 'N/A'
    }));
    const csv = convertToCSV(csvData);
    downloadCSV(csv, `leads-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { addLead } = await import("@/lib/leads-service");
      await addLead({
        ...newLead,
        status: 'new',
        assigned_to: null as any
      });
      setShowAddModal(false);
      setNewLead({ name: '', email: '', phone: '', source: 'Manual Entry', city: '', interest: '' });
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleAssignLead = async (userId: string) => {
    if (!selectedLead) return;
    try {
      await updateLead(selectedLead.id, { assigned_to: userId });
      setShowAssignModal(false);
      setSelectedLead(null);
    } catch (error) {
      console.error("Failed to assign lead:", error);
      alert("Failed to assign lead");
    }
  };

  const handleImportLeads = async (csvText: string) => {
    try {
      const rows = csvText.split('\n').filter(row => row.trim() !== '');
      if (rows.length < 2) return;
      const headers = rows[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      const importedLeads = rows.slice(1).map(row => {
        const values = row.split(',').map(v => v.trim().replace(/"/g, ''));
        const lead: any = {};
        headers.forEach((header, index) => {
          const key = header.toLowerCase();
          if (key === 'name') lead.name = values[index];
          if (key === 'email') lead.email = values[index];
          if (key === 'phone') lead.phone = values[index];
          if (key === 'source') lead.source = values[index];
          if (key === 'city') lead.city = values[index];
          if (key === 'status') lead.status = values[index] as any;
        });
        
        // Defaults
        if (!lead.status) lead.status = 'new';
        if (!lead.source) lead.source = 'CSV Import';
        
        return lead;
      });

      await bulkImportLeads(importedLeads);
      setShowImportModal(false);
      alert(`${importedLeads.length} leads imported successfully!`);
    } catch (error) {
      console.error("Import failed:", error);
      alert("Import failed. Please check CSV format.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this lead?")) {
      await deleteLead(id);
    }
  };

  const [statusFilter, setStatusFilter] = useState("all");

  const filteredLeads = leads.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 leading-tight">All Leads</h1>
          <p className="text-slate-500">Centralized view of all prospects and agent assignments</p>
        </div>
        <div className="flex gap-3">
          {googleSheetsConfigured && (
            <button 
              onClick={handleSyncGoogleSheets}
              disabled={syncing}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-4 text-sm font-medium text-blue-700 shadow-sm hover:bg-blue-100 disabled:opacity-50"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Google Sheets'}
            </button>
          )}
          <button 
            onClick={handleExportCSV}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50"
          >
            <DownloadIcon className="mr-2 h-4 w-4" />
            Export CSV
          </button>
          <button 
            onClick={() => setShowImportModal(true)}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50"
          >
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Lead
          </button>
        </div>
      </div>

      {syncStatus && (
        <div className={`rounded-lg p-4 ${syncStatus.startsWith('✓') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {syncStatus}
        </div>
      )}

      <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 gap-4">
          <div className="flex-1 flex gap-2 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by name, phone or city..." 
                className="input-field pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px]"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="converted">Converted</option>
              <option value="lost">Lost</option>
            </select>
          </div>
          <div className="flex gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
             {filteredLeads.length} Leads
          </div>
        </div>
        
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/30">
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Lead Information</th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Assignment</th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Created</th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      No leads found. Add some to get started!
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{lead.name}</p>
                          <div className="flex flex-col gap-1 mt-1">
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {lead.phone}
                            </span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                              <MapPin className="h-3 w-3" /> {lead.city || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 border border-slate-200">
                            {lead.assigned_to ? (users.find(u => u.id === lead.assigned_to)?.name?.[0] || 'A') : '?'}
                          </div>
                          <span className={`text-xs font-medium ${!lead.assigned_to ? 'text-red-500' : 'text-slate-700'}`}>
                            {lead.assigned_to ? users.find(u => u.id === lead.assigned_to)?.name : 'Unassigned'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                          lead.status === 'qualified' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                          lead.status === 'converted' ? 'bg-green-50 text-green-700 border-green-100' :
                          'bg-blue-50 text-blue-700 border-blue-100'
                        }`}>
                          {lead.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-slate-500">
                          {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button 
                            onClick={() => {
                              setSelectedLead(lead);
                              setShowAssignModal(true);
                            }}
                            className="text-slate-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <UserPlus className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(lead.id)}
                            className="text-slate-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Modal */}
      {showAssignModal && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">Assign Lead</h3>
              <button 
                onClick={() => setShowAssignModal(false)} 
                className="text-slate-400 hover:text-slate-600 hover:rotate-90 transition-transform"
              >
                <X />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-4">Select a team member to assign <strong>{selectedLead.name}</strong></p>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {users.map(u => (
                <button
                  key={u.id}
                  onClick={() => handleAssignLead(u.id)}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                      {u.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{u.name}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </div>
                  </div>
                  <UserPlus className="h-4 w-4 text-slate-300 group-hover:text-blue-600" />
                </button>
              ))}
              {users.length === 0 && (
                <p className="text-center py-4 text-slate-400 text-sm italic">No team members found.</p>
              )}
            </div>
            <div className="mt-6">
              <button 
                onClick={() => setShowAssignModal(false)}
                className="w-full px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">Import Leads</h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600 hover:rotate-90 transition-transform"><X /></button>
            </div>
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-slate-50/50 hover:border-blue-300 hover:bg-blue-50 transition-colors group">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                <Upload />
              </div>
              <p className="text-sm font-bold text-slate-900 mb-1">Click to upload CSV or drag and drop</p>
              <p className="text-xs text-slate-500 mb-6">File should contain Name, Email, Phone, Source, City headers</p>
              <input 
                type="file" 
                accept=".csv"
                className="hidden"
                id="csv-upload"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      if (event.target?.result) {
                        handleImportLeads(event.target.result as string);
                      }
                    };
                    reader.readAsText(file);
                  }
                }}
              />
              <label 
                htmlFor="csv-upload"
                className="btn-primary cursor-pointer hover:shadow-lg transition-shadow"
              >
                Select CSV File
              </label>
            </div>
            <div className="mt-6 flex justify-between items-center bg-blue-50/50 p-4 rounded-xl border border-blue-100">
               <div className="text-xs text-blue-700">
                  <p className="font-bold mb-1">💡 Pro Tip:</p>
                  <p>Download your current list as CSV to use it as a template!</p>
               </div>
               <button 
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700"
               >
                 Cancel
               </button>
            </div>
          </div>
        </div>
      )}
      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">Add New Lead</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 hover:rotate-90 transition-transform"><X /></button>
            </div>
            <form onSubmit={handleManualAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                <input required type="text" className="input-field" value={newLead.name} onChange={e => setNewLead({...newLead, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Phone</label>
                  <input required type="text" className="input-field" value={newLead.phone} onChange={e => setNewLead({...newLead, phone: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">City</label>
                  <input type="text" className="input-field" value={newLead.city} onChange={e => setNewLead({...newLead, city: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                <input type="email" className="input-field" value={newLead.email} onChange={e => setNewLead({...newLead, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Source</label>
                <input type="text" className="input-field" value={newLead.source} onChange={e => setNewLead({...newLead, source: e.target.value})} />
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full btn-primary py-3">Create Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
