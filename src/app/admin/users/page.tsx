"use client";

import React, { useState, useEffect } from "react";
import { UserPlus, Search, Shield, User, Loader2, Check, X, Edit, Trash2, Phone, MoreHorizontal, Mail, Activity, ArrowLeft } from "lucide-react";
import { getAllUsersInDb, CRMUser, updateUserInDb } from "@/lib/users-service";

export default function UserManagement() {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [users, setUsers] = useState<CRMUser[]>([]);
  const [fetching, setFetching] = useState(true);
  const [isQuickAdd, setIsQuickAdd] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"admin" | "team">("team");
  const [phone, setPhone] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const unsubscribe = getAllUsersInDb((data) => {
      setUsers(data);
      setFetching(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (!phone) {
        alert('Phone number is required for login');
        setLoading(false);
        return;
      }

      let finalEmail = email;
      let finalName = name;

      if (isQuickAdd) {
        if (!finalName) finalName = `User ${phone.slice(-4)}`;
        if (!finalEmail) finalEmail = `user${phone}@crmpro.com`;
      }

      const response = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: finalEmail, name: finalName, role, phone }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create user");

      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setShowModal(false);
        resetForm();
      }, 2000);
    } catch (err: any) {
      alert(err.message || "Something went wrong.");
      setLoading(false);
    }
  };

  const toggleStatus = async (user: CRMUser) => {
    const newStatus = user.status === "Active" ? "Inactive" : "Active";
    await updateUserInDb(user.id, { status: newStatus });
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Permanently remove ${name}?`)) return;
    try {
      const response = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed");
    } catch (err: any) {
      alert(err.message);
    }
  };

  const [editingUser, setEditingUser] = useState<CRMUser | null>(null);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setPhone("");
    setRole("team");
    setEditingUser(null);
    setIsQuickAdd(true);
  };

  const handleEdit = (user: CRMUser) => {
    setName(user.name);
    setEmail(user.email);
    setPassword("********"); 
    setPhone((user as any).phone || "");
    setRole(user.role);
    setEditingUser(user);
    setIsQuickAdd(false);
    setShowModal(true);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Agent Network</h1>
          <p className="text-xs text-slate-500 font-medium">Manage access and team roles</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="h-11 px-4 bg-slate-900 text-white rounded-2xl text-xs font-bold shadow-lg flex items-center gap-2 active:scale-95 transition-all"
        >
          <UserPlus className="h-4 w-4" /> Add Agent
        </button>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-900" />
        <input 
          type="text" 
          placeholder="Lookup name or email..." 
          className="w-full bg-white border-none shadow-sm rounded-2xl pl-12 pr-4 py-3 text-sm font-medium focus:ring-2 focus:ring-slate-900 transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {fetching ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredUsers.map((user) => (
            <div key={user.id} className="bg-white rounded-[28px] p-6 shadow-sm border border-slate-100 flex flex-col gap-5">
               <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-900 font-black text-lg">
                      {user.name[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 leading-none mb-1.5">{user.name}</h3>
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {user.role === 'admin' ? <Shield className="h-3 w-3" /> : <Activity className="h-3 w-3" />}
                        {user.role}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => toggleStatus(user)}
                    className={`h-2.5 w-2.5 rounded-full shadow-sm ring-4 ${user.status === 'Active' ? 'bg-green-500 ring-green-50' : 'bg-slate-300 ring-slate-50'}`} 
                  />
               </div>

               <div className="space-y-3 pt-2">
                 <div className="flex items-center gap-3 text-slate-500">
                    <Mail className="h-4 w-4 opacity-40" />
                    <span className="text-xs font-semibold truncate">{user.email}</span>
                 </div>
                 <div className="flex items-center gap-3 text-slate-500">
                    <Phone className="h-4 w-4 opacity-40" />
                    <span className="text-xs font-bold">{ (user as any).phone || 'No phone' }</span>
                 </div>
               </div>

               <div className="flex gap-2 pt-2 border-t border-slate-50">
                  <button 
                    onClick={() => handleEdit(user)}
                    className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-900 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <Edit className="h-3.5 w-3.5" /> Edit Profile
                  </button>
                  <button 
                    onClick={() => handleDeleteUser(user.id, user.name)}
                    className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
               </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in zoom-in-95 duration-200">
          <div className="w-full max-w-sm bg-white rounded-[32px] p-8 shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{editingUser ? "Update Agent" : "New Agent"}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Credentials Managed by Auth</p>
              </div>
              <button onClick={() => setShowModal(false)} className="h-10 w-10 bg-slate-50 rounded-full flex items-center justify-center"><X className="h-5 w-5 text-slate-500" /></button>
            </div>
            
            <div className="bg-slate-50 p-1.5 rounded-2xl flex gap-1">
               <button onClick={() => setIsQuickAdd(true)} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isQuickAdd ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>Quick</button>
               <button onClick={() => setIsQuickAdd(false)} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isQuickAdd ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>Full</button>
            </div>

            {isQuickAdd && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-green-500 flex items-center justify-center">
                    <Phone className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-green-900">WhatsApp Fast Add</p>
                    <p className="text-[10px] text-green-600 font-semibold">Just phone number needed • Auto-generates credentials</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-4">
                {isQuickAdd ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">WhatsApp/Phone Number *</label>
                      <input 
                        required 
                        type="tel" 
                        placeholder="Enter phone number (e.g., +919876543210)" 
                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 focus:border-green-500 rounded-2xl font-black text-slate-900 tracking-wider text-lg transition-colors" 
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value)} 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Name (Optional)</label>
                      <input 
                        type="text" 
                        placeholder="Leave empty to auto-generate" 
                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                      />
                      <p className="text-[9px] text-slate-400 font-semibold px-1">Auto-generated: User {phone ? phone.slice(-4) : 'XXXX'}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <input type="text" placeholder="Full Name" className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900" value={name} onChange={(e) => setName(e.target.value)} />
                    <input type="email" placeholder="Email Address" className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900" value={email} onChange={(e) => setEmail(e.target.value)} />
                    <input required type="tel" placeholder="Login Phone" className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-black text-slate-900" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                 <button type="button" onClick={() => setRole('team')} className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${role === 'team' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-100 text-slate-400'}`}>Team</button>
                 <button type="button" onClick={() => setRole('admin')} className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${role === 'admin' ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white border-slate-100 text-slate-400'}`}>Admin</button>
              </div>

              <button type="submit" disabled={loading} className="w-full py-4 bg-slate-900 text-white rounded-[22px] font-bold text-sm shadow-xl shadow-slate-200 active:scale-95 transition-all flex items-center justify-center">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : success ? <Check className="h-5 w-5" /> : editingUser ? "Update Agent" : "Create Agent"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
