"use client";

import React, { useState, useRef } from "react";
import { Upload, FileText, Check, X, AlertCircle, Download, Loader2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface PreviewData {
  total: number;
  new: number;
  duplicates: number;
  newLeads: any[];
  duplicateLeads: any[];
}

export default function UploadCSVPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setPreview(null);
      setMessage("");
      setError("");
    } else {
      setError("Please select a valid CSV file");
    }
  };

  const handlePreview = async () => {
    if (!file) return;

    setUploading(true);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('action', 'preview');

      const response = await fetch('/api/admin/upload-csv', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setPreview(data.data);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to preview CSV');
    } finally {
      setUploading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('action', 'import');

      const response = await fetch('/api/admin/upload-csv', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setMessage(data.message);
        setFile(null);
        setPreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        // Redirect to leads page after 2 seconds
        setTimeout(() => {
          router.push('/admin/leads');
        }, 2000);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to import CSV');
    } finally {
      setImporting(false);
    }
  };

  const downloadSampleCSV = () => {
    const sampleData = `name,email,phone,source,city,interest,notes
Rahul Sharma,rahul@example.com,+919876543210,Website,Mumbai,Web Development,Looking for services
Priya Patel,priya@example.com,+918765432109,Facebook,Delhi,Digital Marketing,Interested in SEO`;
    
    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-leads.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Upload CSV</h1>
        <p className="text-sm md:text-base text-slate-500">Import leads from CSV file</p>
      </div>

      {/* Download Sample */}
      <div className="rounded-xl md:rounded-2xl bg-blue-50 border border-blue-200 p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-base md:text-lg font-bold text-blue-900 mb-1">Need a template?</h3>
            <p className="text-sm text-blue-700">Download sample CSV to see the required format</p>
          </div>
          <button
            onClick={downloadSampleCSV}
            className="btn-primary bg-blue-600 hover:bg-blue-700 w-full md:w-auto"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Sample CSV
          </button>
        </div>
      </div>

      {/* Upload Section */}
      <div className="rounded-xl md:rounded-2xl bg-white p-6 md:p-8 shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Select CSV File</h3>
        
        <div className="space-y-4">
          <div 
            className="border-2 border-dashed border-slate-300 rounded-xl p-8 md:p-12 text-center hover:border-blue-400 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-12 w-12 md:h-16 md:w-16 text-slate-400 mx-auto mb-4" />
            <p className="text-sm md:text-base font-semibold text-slate-700 mb-2">
              {file ? file.name : 'Click to upload CSV file'}
            </p>
            <p className="text-xs md:text-sm text-slate-500">
              CSV file with columns: name, email, phone (required)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {file && !preview && (
            <button
              onClick={handlePreview}
              disabled={uploading}
              className="btn-primary w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading Preview...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Preview Data
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm font-semibold text-red-700">{error}</p>
          </div>
        </div>
      )}

      {message && (
        <div className="rounded-xl bg-green-50 border border-green-200 p-4">
          <div className="flex items-center gap-3">
            <Check className="h-5 w-5 text-green-600" />
            <p className="text-sm font-semibold text-green-700">{message}</p>
          </div>
        </div>
      )}

      {/* Preview Section */}
      {preview && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Total Leads</p>
                  <p className="text-2xl font-bold text-slate-900">{preview.total}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">New Leads</p>
                  <p className="text-2xl font-bold text-green-700">{preview.new}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 rounded-xl bg-orange-50 flex items-center justify-center">
                  <X className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Duplicates</p>
                  <p className="text-2xl font-bold text-orange-700">{preview.duplicates}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Tables */}
          {preview.newLeads.length > 0 && (
            <div className="rounded-xl md:rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 md:p-6 border-b border-slate-200">
                <h3 className="text-lg font-bold text-slate-900">New Leads Preview (First 10)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">Name</th>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">Phone</th>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">Email</th>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {preview.newLeads.map((lead, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-4 md:px-6 py-3 text-sm font-semibold text-slate-900">{lead.name}</td>
                        <td className="px-4 md:px-6 py-3 text-sm text-slate-600">{lead.phone}</td>
                        <td className="px-4 md:px-6 py-3 text-sm text-slate-600">{lead.email || 'N/A'}</td>
                        <td className="px-4 md:px-6 py-3 text-sm text-slate-600">{lead.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {preview.duplicateLeads.length > 0 && (
            <div className="rounded-xl md:rounded-2xl bg-white shadow-sm border border-orange-200 overflow-hidden">
              <div className="p-4 md:p-6 border-b border-orange-200 bg-orange-50">
                <h3 className="text-lg font-bold text-orange-900">Duplicate Leads (Will be Skipped)</h3>
                <p className="text-sm text-orange-700 mt-1">These leads already exist in the database</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">Name</th>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">Phone</th>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {preview.duplicateLeads.map((lead, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-4 md:px-6 py-3 text-sm font-semibold text-slate-900">{lead.name}</td>
                        <td className="px-4 md:px-6 py-3 text-sm text-slate-600">{lead.phone}</td>
                        <td className="px-4 md:px-6 py-3 text-sm text-slate-600">{lead.email || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import Button */}
          {preview.new > 0 && (
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setPreview(null);
                  setFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="flex-1 rounded-lg border border-slate-200 px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={importing}
                className="flex-1 btn-primary bg-green-600 hover:bg-green-700"
              >
                {importing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-5 w-5 mr-2" />
                    Import {preview.new} Leads
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}