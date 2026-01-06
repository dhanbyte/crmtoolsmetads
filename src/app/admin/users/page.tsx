"use client";

import React, { useState, useEffect } from "react";
import { UserPlus, Search, MoreVertical, Shield, User, Loader2, Check, X, Edit, Trash2 } from "lucide-react";
import { getAllUsersInDb, CRMUser, updateUserInDb } from "@/lib/users-service";

export default function UserManagement() {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [users, setUsers] = useState<CRMUser[]>([]);
  const [fetching, setFetching] = useState(true);

  // Form states
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
      // Validate phone is required for ALL users now
      if (!phone) {
        alert('Phone number is required for login');
        setLoading(false);
        return;
      }

      const response = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, role, phone }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create user");

      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setShowModal(false);
        setEmail("");
        setName("");
        setPhone("");
      }, 2000);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const toggleStatus = async (user: CRMUser) => {
    const newStatus = user.status === "Active" ? "Inactive" : "Active";
    await updateUserInDb(user.id, { status: newStatus });
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete user ${name}?`)) return;
    try {
      const response = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) throw new Error("Failed to delete user");
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
  };

  const handleEdit = (user: CRMUser) => {
    setName(user.name);
    setEmail(user.email);
    setPassword("********"); // Placeholder
    setPhone((user as any).phone || "");
    setRole(user.role);
    setEditingUser(user);
    setShowModal(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 leading-tight">User Management</h1>
          <p className="text-slate-500">Create and manage your team members and their roles</p>
        </div>
        <button 
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn-primary"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Add New User
        </button>
      </div>

      <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search users..." 
              className="input-field pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {fetching ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/30">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">User</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Role</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user, i) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        {user.name[0]}
                      </div>
                       <div>
                         <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                         <p className="text-xs text-slate-500">{user.email}</p>
                         {(user as any).phone && <p className="text-xs text-slate-400">📱 {(user as any).phone}</p>}
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${user.role === 'admin' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                      {user.role === 'admin' ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => toggleStatus(user)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${user.status === 'Active' ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${user.status === 'Active' ? 'bg-green-600' : 'bg-red-600'}`} />
                      {user.status}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button 
                        onClick={() => handleEdit(user)}
                        className="text-slate-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        className="text-slate-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{editingUser ? "Edit User" : "Create New User"}</h3>
                <p className="text-sm text-slate-500">System will automatically sync with Auth</p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 rounded-full p-1 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Full Name</label>
                <input 
                  type="text" 
                  required 
                  className="input-field mt-1" 
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Email Address</label>
                <input 
                  type="email" 
                  required 
                  className="input-field mt-1" 
                  placeholder="user@crmpro.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Phone Number</label>
                <input 
                  type="tel" 
                  required
                  className="input-field mt-1" 
                  placeholder="9157499884"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <p className="mt-1 text-xs text-slate-500">
                  {role === 'admin' 
                    ? 'Admin will use this phone to login (e.g., 9157499884)' 
                    : 'Team member will use this phone to login'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Role</label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <button
                    type="button"
                    onClick={() => setRole("team")}
                    className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${role === "team" ? "bg-blue-50 border-blue-600 text-blue-600" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                  >
                    Team Member
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("admin")}
                    className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${role === "admin" ? "bg-purple-50 border-purple-600 text-purple-600" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                  >
                    Admin
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1 btn-primary"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : success ? (
                    <Check className="h-4 w-4" />
                  ) : editingUser ? (
                    "Update User"
                  ) : (
                    "Create User"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
