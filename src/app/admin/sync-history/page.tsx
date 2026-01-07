"use client";

import React, { useState, useEffect } from "react";
import { Calendar, RefreshCw, TrendingUp, CheckCircle, AlertCircle, Clock, Loader2, Download } from "lucide-react";

interface SyncLog {
  id: string;
  sync_started_at: string;
  sync_completed_at: string | null;
  imported_count: number;
  updated_count: number;
  error_count: number;
  total_processed: number;
  status: 'running' | 'success' | 'failed' | 'partial';
  sync_type: 'manual' | 'auto';
  error_message: string | null;
}

export default function SyncHistoryPage() {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [todayStats, setTodayStats] = useState({
    totalSyncs: 0,
    totalImported: 0,
    totalUpdated: 0,
    successRate: 0,
  });
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load stats
      const statsResponse = await fetch('/api/admin/sync-stats');
      const statsData = await statsResponse.json();
      
      if (statsData.success) {
        setTodayStats(statsData.data.todayStats);
        setLastSyncTime(statsData.data.lastSyncTime);
      }

      // Load logs
      const logsResponse = await fetch('/api/admin/sync-logs');
      const logsData = await logsResponse.json();
      
      if (logsData.success) {
        setLogs(logsData.data);
      }
    } catch (error) {
      console.error('Error loading sync data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = async () => {
    if (!startDate && !endDate) {
      loadData();
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await fetch(`/api/admin/sync-logs?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setLogs(data.data);
      }
    } catch (error) {
      console.error('Error filtering logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = async () => {
    setSyncing(true);
    setSyncMessage('');
    try {
      const response = await fetch('/api/admin/sync-google-sheets', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        setSyncMessage(`✓ ${data.message}`);
        // Reload data after sync
        setTimeout(() => {
          loadData();
          setSyncMessage('');
        }, 3000);
      } else {
        setSyncMessage(`✗ ${data.error}`);
      }
    } catch (error: any) {
      setSyncMessage(`✗ Error: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric' 
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700 border border-green-200">
          <CheckCircle className="h-3 w-3" />
          Success
        </span>;
      case 'failed':
        return <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700 border border-red-200">
          <AlertCircle className="h-3 w-3" />
          Failed
        </span>;
      case 'partial':
        return <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-bold text-yellow-700 border border-yellow-200">
          <AlertCircle className="h-3 w-3" />
          Partial
        </span>;
      case 'running':
        return <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-200">
          <Loader2 className="h-3 w-3 animate-spin" />
          Running
        </span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Sync History</h1>
          <p className="text-sm md:text-base text-slate-500">Auto-sync runs every hour</p>
        </div>
        <div className="flex gap-2 md:gap-3 w-full md:w-auto">
          <button 
            onClick={handleManualSync}
            disabled={syncing}
            className="flex-1 md:flex-none btn-primary bg-green-600 hover:bg-green-700"
          >
            {syncing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Manual Sync
              </>
            )}
          </button>
          <button 
            onClick={loadData}
            disabled={loading}
            className="flex-1 md:flex-none btn-primary"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Sync Message */}
      {syncMessage && (
        <div className={`rounded-xl p-4 ${
          syncMessage.startsWith('✓') 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          <p className="text-sm font-semibold">{syncMessage}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        <div className="rounded-xl md:rounded-2xl bg-white p-4 md:p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs md:text-sm text-slate-500 font-medium">Today's Syncs</p>
              <p className="text-xl md:text-2xl font-bold text-slate-900">{todayStats.totalSyncs}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl md:rounded-2xl bg-white p-4 md:p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-green-50 flex items-center justify-center">
              <Download className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
            </div>
            <div>
              <p className="text-xs md:text-sm text-slate-500 font-medium">Imported</p>
              <p className="text-xl md:text-2xl font-bold text-slate-900">{todayStats.totalImported}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl md:rounded-2xl bg-white p-4 md:p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-purple-50 flex items-center justify-center">
              <RefreshCw className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-xs md:text-sm text-slate-500 font-medium">Updated</p>
              <p className="text-xl md:text-2xl font-bold text-slate-900">{todayStats.totalUpdated}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl md:rounded-2xl bg-white p-4 md:p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-orange-50 flex items-center justify-center">
              <Clock className="h-5 w-5 md:h-6 md:w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-xs md:text-sm text-slate-500 font-medium">Last Sync</p>
              <p className="text-sm md:text-base font-bold text-slate-900">
                {lastSyncTime ? formatTime(lastSyncTime) : 'Never'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl md:rounded-2xl bg-white p-4 md:p-6 shadow-sm border border-slate-100">
        <h3 className="text-base md:text-lg font-bold text-slate-900 mb-4">Filter by Date Range</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <div>
            <label className="block text-xs md:text-sm font-semibold text-slate-700 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-field w-full text-sm md:text-base"
            />
          </div>
          <div>
            <label className="block text-xs md:text-sm font-semibold text-slate-700 mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-field w-full text-sm md:text-base"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleFilter}
              className="btn-primary w-full"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Apply Filter
            </button>
          </div>
        </div>
      </div>

      {/* Sync Logs Table */}
      <div className="rounded-xl md:rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-slate-100">
          <h3 className="text-base md:text-lg font-bold text-slate-900">Sync Logs</h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 md:py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 md:py-20 text-slate-400">
            <Calendar className="h-12 w-12 mb-3 opacity-20" />
            <p className="text-center font-medium text-sm md:text-base">No sync logs found</p>
          </div>
        ) : (
          <>
            {/* Mobile View */}
            <div className="md:hidden divide-y divide-slate-100">
              {logs.map((log) => (
                <div key={log.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{formatDate(log.sync_started_at)}</p>
                      <p className="text-xs text-slate-500">{formatTime(log.sync_started_at)}</p>
                    </div>
                    {getStatusBadge(log.status)}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-green-50 p-2">
                      <p className="text-xs text-slate-500 mb-1">Imported</p>
                      <p className="text-lg font-bold text-green-700">{log.imported_count}</p>
                    </div>
                    <div className="rounded-lg bg-blue-50 p-2">
                      <p className="text-xs text-slate-500 mb-1">Updated</p>
                      <p className="text-lg font-bold text-blue-700">{log.updated_count}</p>
                    </div>
                    <div className="rounded-lg bg-red-50 p-2">
                      <p className="text-xs text-slate-500 mb-1">Errors</p>
                      <p className="text-lg font-bold text-red-700">{log.error_count}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${log.sync_type === 'auto' ? 'bg-purple-50 text-purple-700' : 'bg-gray-50 text-gray-700'}`}>
                      {log.sync_type === 'auto' ? '⚡ Auto' : '👤 Manual'}
                    </span>
                  </div>

                  {log.error_message && (
                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                      {log.error_message}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">Imported</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">Updated</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">Errors</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-slate-900">{formatTime(log.sync_started_at)}</p>
                          <p className="text-xs text-slate-500">{formatDate(log.sync_started_at)}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-lg font-bold text-green-700">{log.imported_count}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-lg font-bold text-blue-700">{log.updated_count}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-lg font-bold text-red-700">{log.error_count}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-xs font-bold px-2 py-1 rounded ${log.sync_type === 'auto' ? 'bg-purple-50 text-purple-700' : 'bg-gray-50 text-gray-700'}`}>
                          {log.sync_type === 'auto' ? '⚡ Auto' : '👤 Manual'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {getStatusBadge(log.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}