"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, Plus, Search, Tag, Trash2, Edit, X, Loader2, Save } from "lucide-react";

interface Template {
  title: string;
  category: string;
  content: string;
}

export default function MessageTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  // Form state
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Follow-up");
  const [content, setContent] = useState("");

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/admin/settings?key=message_templates");
      const { data } = await res.json();
      if (data) setTemplates(data);
      else {
        // Default templates if none exist
        const defaults = [
          { title: "First Call Follow-up", category: "Follow-up", content: "Hi {name}, I tried calling you regarding your inquiry. Let me know a good time to talk." },
          { title: "Price Proposal", category: "Sales", content: "Dear {name}, as discussed, here is the proposal for your project." },
        ];
        setTemplates(defaults);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newTemplates = [...templates];
    if (editingIndex !== null) {
      newTemplates[editingIndex] = { title, category, content };
    } else {
      newTemplates.push({ title, category, content });
    }

    try {
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "message_templates", value: newTemplates }),
      });
      setTemplates(newTemplates);
      setShowModal(false);
      resetForm();
    } catch (err) {
      alert("Failed to save template");
    }
  };

  const handleDelete = async (index: number) => {
    if (!confirm("Are you sure?")) return;
    const newTemplates = templates.filter((_, i) => i !== index);
    try {
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "message_templates", value: newTemplates }),
      });
      setTemplates(newTemplates);
    } catch (err) {
      alert("Failed to delete template");
    }
  };

  const resetForm = () => {
    setTitle("");
    setCategory("Follow-up");
    setContent("");
    setEditingIndex(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 leading-tight">Message Templates</h1>
          <p className="text-slate-500">Manage WhatsApp templates for your team</p>
        </div>
        <button 
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn-primary"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {templates.map((tpl, i) => (
            <div key={i} className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700 border border-blue-100">
                  <Tag className="h-3 w-3" />
                  {tpl.category}
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setTitle(tpl.title);
                      setCategory(tpl.category);
                      setContent(tpl.content);
                      setEditingIndex(i);
                      setShowModal(true);
                    }}
                    className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(i)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg bg-red-50 text-red-400 hover:text-red-600 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{tpl.title}</h3>
              <p className="text-sm text-slate-600 line-clamp-3 bg-slate-50 rounded-xl p-4 border border-slate-100 font-medium">
                {tpl.content}
              </p>
            </div>
          ))}
          {templates.length === 0 && (
            <div className="lg:col-span-2 py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200">
               <MessageSquare className="h-12 w-12 text-slate-200 mx-auto mb-4" />
               <p className="text-slate-400 font-medium">No templates yet. Create your first one!</p>
            </div>
          )}
        </div>
      )}

      {/* Template Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">{editingIndex !== null ? "Edit Template" : "New Template"}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">Template Title</label>
                <input 
                  type="text" 
                  required 
                  className="input-field mt-1" 
                  placeholder="e.g. Price Proposal"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Category</label>
                <select 
                  className="input-field mt-1"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                >
                  <option>Follow-up</option>
                  <option>Sales</option>
                  <option>Accounts</option>
                  <option>Schedule</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Message Content</label>
                <p className="text-[10px] text-slate-400 mb-1">Use {"{name}"} for client name</p>
                <textarea 
                  required 
                  className="input-field mt-1 h-32" 
                  placeholder="Hey {name}..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 btn-primary"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
