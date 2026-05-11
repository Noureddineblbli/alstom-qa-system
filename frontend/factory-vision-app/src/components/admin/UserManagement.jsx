import React, { useState } from 'react';
import { UserPlus, MoreVertical, Shield, User, Clock, Mail, Trash2, Edit2, X } from 'lucide-react';
import { USERS as INITIAL_USERS } from '../../data/mockData';
import { motion, AnimatePresence } from 'motion/react';

export default function UserManagement() {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Operator' });

  const handleSubmit = (e) => {
    e.preventDefault();
    const userToAdd = {
      id: `u${Date.now()}`,
      ...newUser,
      lastActive: new Date().toISOString()
    };
    setUsers([...users, userToAdd]);
    setIsModalOpen(false);
    setNewUser({ name: '', email: '', role: 'Operator' });
  };

  const handleDelete = (id) => {
    setUsers(users.filter(u => u.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">User Management</h3>
          <p className="text-sm text-white/40">Manage factory operators and supervisor permissions.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-blue-600/20"
        >
          <UserPlus className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="bg-[#16191E] border border-white/5 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/[0.02] border-b border-white/5">
              <th className="p-4 text-[10px] font-mono uppercase text-white/40">User</th>
              <th className="p-4 text-[10px] font-mono uppercase text-white/40">Role</th>
              <th className="p-4 text-[10px] font-mono uppercase text-white/40">Last Activity</th>
              <th className="p-4 text-[10px] font-mono uppercase text-white/40 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map(user => (
              <motion.tr 
                layout
                key={user.id} 
                className="hover:bg-white/[0.01] transition-colors"
              >
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-500/20">
                      <User className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-white/40 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    user.role === 'Admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                    user.role === 'Supervisor' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                    'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="p-4 text-xs text-white/40 font-mono">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(user.lastActive).toLocaleDateString()} {new Date(user.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-2 hover:bg-white/5 rounded-lg text-white/60 hover:text-white transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(user.id)}
                      className="p-2 hover:bg-red-500/10 rounded-lg text-red-500/60 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#16191E] border border-white/10 rounded-2xl shadow-2xl p-6 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xl font-bold">Add New User</h4>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest">Full Name</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. John Doe"
                    className="w-full bg-white/[0.02] border border-white/5 rounded-lg p-3 text-sm focus:border-blue-500 outline-none transition-colors"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest">Email Address</label>
                  <input 
                    required
                    type="email" 
                    placeholder="john@factory.com"
                    className="w-full bg-white/[0.02] border border-white/5 rounded-lg p-3 text-sm focus:border-blue-500 outline-none transition-colors"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest">Role</label>
                  <select 
                    className="w-full bg-[#16191E] border border-white/5 rounded-lg p-3 text-sm focus:border-blue-500 outline-none transition-colors"
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  >
                    <option value="Operator">Operator</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-sm transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-600/20"
                  >
                    Create User
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
