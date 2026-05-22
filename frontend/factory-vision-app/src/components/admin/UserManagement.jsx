import React, { useState, useEffect } from 'react';
import { UserPlus, User, Clock, Mail, Trash2, Edit2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from '../../api/api';


export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ 
    nom: '', 
    email: '', 
    password: '', 
    role: 'Controller' 
  });

  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);

  const [editUser, setEditUser] = useState({
    nom: '',
    email: '',
    password: '',
    role: 'Controller',
    state: 'active'
  });
  
  // Pagination states
  const ROWS_PER_PAGE = 10;
  const [userPage, setUserPage] = useState(1);

  // Filter states
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [activityFilter, setActivityFilter] = useState('all');

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.nom.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());

    const matchesRole =
      roleFilter === 'all' || user.role === roleFilter;

    const matchesActivity =
      activityFilter === 'all' || user.state === activityFilter;

    return matchesSearch && matchesRole && matchesActivity;
  });

  const totalUserPages = Math.ceil(filteredUsers.length / ROWS_PER_PAGE);

  const paginatedUsers = filteredUsers.slice(
    (userPage - 1) * ROWS_PER_PAGE,
    userPage * ROWS_PER_PAGE
  );

  useEffect(() => {
    setUserPage(1);
  }, [users]);

  useEffect(() => {
    if (userPage > totalUserPages) {
      setUserPage(1);
    }
  }, [filteredUsers]);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const response = await axios.get('/api/users', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      setUsers(response.data);

    } catch (err) {
      console.error('ERROR:', err);
      console.error('ERROR RESPONSE:', err.response);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        '/api/users',
        newUser,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      setUsers(prev => [...prev, response.data]);

      setIsModalOpen(false);

      setNewUser({
        nom: '',
        email: '',
        password: '',
        role: 'Controller'  
      });

    } catch (err) {
      console.error('Failed to create user:', err);
      alert('Failed to create user');
    }
  };

  // const handleDelete = async (user_id) => {
  //   try {
  //     await axios.delete(`/api/users/${user_id}`, {
  //       headers: {
  //         Authorization: `Bearer ${localStorage.getItem('token')}`
  //       }
  //     });

  //     setUsers(prev => prev.filter(u => u.user_id !== user_id));

  //   } catch (err) {
  //     console.error('Failed to delete user:', err);
  //     alert('Failed to delete user');
  //   }
  // };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.put(
        `/api/users/${editingUser.user_id}`,
        editUser,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      setUsers(prev =>
        prev.map(u =>
          u.user_id === editingUser.user_id
            ? response.data
            : u
        )
      );

      setIsModalOpen(false);

      setEditingUser(null);

    } catch (err) {
      console.error('Failed to update user:', err);
      alert('Failed to update user');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">User Management</h3>
          <p className="text-sm text-white/40">Manage factory Controllers and supervisor permissions.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-blue-600/20"
        >
          <UserPlus className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="bg-[#16191E] border border-white/5 rounded-xl overflow-hidden">
        {loading ? (
          <div className="text-center py-10 text-white/40">
            Loading users...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">

              {/* SEARCH */}
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setUserPage(1);
                }}
                className="w-full md:w-64 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm outline-none focus:border-blue-500"
              />

              {/* ROLE FILTER */}
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setUserPage(1);
                }}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
              >
                <option value="all" className='text-black'>All Roles</option>
                <option value="Admin" className='text-black'>Admin</option>
                <option value="Controller" className='text-black'>Controller</option>
              </select>

              {/* ACTIVITY FILTER */}
              <select
                value={activityFilter}
                onChange={(e) => {
                  setActivityFilter(e.target.value);
                  setUserPage(1);
                }}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
              >
                <option value="all" className='text-black'>All States</option>
                <option value="active" className='text-black'>Active</option>
                <option value="inactive" className='text-black'>Inactive</option>
              </select>

              {/* RESET */}
              <button
                onClick={() => {
                  setSearch('');
                  setRoleFilter('all');
                  setActivityFilter('all');
                  setUserPage(1);
                }}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm"
              >
                Reset
              </button>

            </div>

            <table className="min-w-[900px] w-full text-left whitespace-nowrap">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/5">
                  <th className="p-4 text-[10px] font-mono uppercase text-white/40">
                    User
                  </th>

                  <th className="p-4 text-[10px] font-mono uppercase text-white/40">
                    Role
                  </th>

                  <th className="p-4 text-[10px] font-mono uppercase text-white/40">
                    Account State
                  </th>

                  <th className="p-4 text-[10px] font-mono uppercase text-white/40">
                    Last Activity
                  </th>

                  <th className="p-4 text-[10px] font-mono uppercase text-white/40 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {paginatedUsers.map(user => (
                  <motion.tr
                    layout
                    key={user.user_id}
                    className="hover:bg-white/[0.01] transition-colors"
                  >
                    {/* USER */}
                    <td className="p-4 min-w-[280px]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-500/20 shrink-0">
                          <User className="w-5 h-5 text-blue-400" />
                        </div>

                        <div className="min-w-0">
                          <div className="font-medium truncate">
                            {user.nom}
                          </div>

                          <div className="text-xs text-white/40 flex items-center gap-1 truncate">
                            <Mail className="w-3 h-3 shrink-0" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* ROLE */}
                    <td className="p-4 min-w-[140px]">
                      <span
                        className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          user.role === 'Admin'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            : user.role === 'Supervisor'
                            ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>

                    {/* STATE */}
                    <td className="p-4 min-w-[140px]">
                      <span
                        className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          user.state === 'active'
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {user.state === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* LAST ACTIVITY */}
                    <td className="p-4 text-xs text-white/40 font-mono min-w-[220px]">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 shrink-0" />

                        {new Date(new Date().toISOString()).toLocaleDateString()}

                        {new Date(new Date().toISOString()).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>

                    {/* ACTIONS */}
                    <td className="p-4 text-right min-w-[120px]">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingUser(user);

                            setEditUser({
                              nom: user.nom,
                              email: user.email || '',
                              password: '',
                              role: user.role,
                              state: user.state
                            });

                            setIsModalOpen(true);
                          }}
                          className="p-2 hover:bg-white/5 rounded-lg text-white/60 hover:text-white transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* <button 
                          onClick={() => handleDelete(user.user_id)}
                          className="p-2 hover:bg-red-500/10 rounded-lg text-red-500/60 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button> */}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {/* PAGINATION */}
            <div className="min-w-[900px] flex items-center justify-between px-4 py-3 border-t border-white/5 bg-white/[0.01]">

              <div className="text-xs text-white/40">
                Page {userPage} of {totalUserPages || 1}
              </div>

              <div className="flex items-center gap-2">

                <button
                  disabled={userPage === 1}
                  onClick={() => setUserPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1 text-xs rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30"
                >
                  Prev
                </button>

                {Array.from({ length: totalUserPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setUserPage(page)}
                    className={`px-3 py-1 text-xs rounded-lg ${
                      userPage === page
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/5 hover:bg-white/10 text-white/70'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  disabled={userPage === totalUserPages}
                  onClick={() => setUserPage(p => Math.min(totalUserPages, p + 1))}
                  className="px-3 py-1 text-xs rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30"
                >
                  Next
                </button>

              </div>

            </div>

          </div>
        )}
      </div>

      {/* Add User Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsModalOpen(false);
                setEditingUser(null);
              }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#16191E] border border-white/10 rounded-2xl shadow-2xl p-6 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xl font-bold">
                  {editingUser ? 'Edit User' : 'Add New User'}
                </h4>
                <button onClick={() => {
                  setIsModalOpen(false);
                  setEditingUser(null);
                }} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={editingUser ? handleEditSubmit : handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest">Full Name</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. John Doe"
                    className="w-full bg-white/[0.02] border border-white/5 rounded-lg p-3 text-sm focus:border-blue-500 outline-none transition-colors"
                    value={editingUser ? editUser.nom : newUser.nom}
                    onChange={(e) =>
                      editingUser
                        ? setEditUser({ ...editUser, nom: e.target.value })
                        : setNewUser({ ...newUser, nom: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest">Email Address</label>
                  <input 
                    required
                    type="email" 
                    placeholder="john@factory.com"
                    className="w-full bg-white/[0.02] border border-white/5 rounded-lg p-3 text-sm focus:border-blue-500 outline-none transition-colors"
                    value={editingUser ? editUser.email : newUser.email}
                    onChange={(e) =>
                      editingUser
                        ? setEditUser({ ...editUser, email: e.target.value })
                        : setNewUser({ ...newUser, email: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest">
                    Password
                  </label>

                  <input
                    type="password"
                    placeholder={
                      editingUser
                        ? 'Leave empty to keep current password'
                        : 'Enter password'
                    }
                    className="w-full bg-white/[0.02] border border-white/5 rounded-lg p-3 text-sm focus:border-blue-500 outline-none transition-colors"
                    value={editingUser ? editUser.password : newUser.password}
                    onChange={(e) =>
                      editingUser
                        ? setEditUser({ ...editUser, password: e.target.value })
                        : setNewUser({ ...newUser, password: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest">Role</label>
                  <select 
                    className="w-full bg-[#16191E] border border-white/5 rounded-lg p-3 text-sm focus:border-blue-500 outline-none transition-colors"
                    value={editingUser ? editUser.role : newUser.role}
                    onChange={(e) => editingUser 
                      ? setEditUser({ ...editUser, role: e.target.value }) 
                      : setNewUser({ ...newUser, role: e.target.value })}
                  >
                    <option value="Controller">Controller</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                {editingUser && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase text-white/40 tracking-widest">
                      Account State
                    </label>

                    <select
                      className="w-full bg-[#16191E] border border-white/5 rounded-lg p-3 text-sm focus:border-blue-500 outline-none transition-colors"
                      value={String(editUser.state)}
                      onChange={(e) =>
                        setEditUser({
                          ...editUser,
                          state: e.target.value === 'active' ? 'active' : 'inactive'
                        })
                      }
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                )}

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingUser(null);
                    }}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-sm transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-600/20"
                  >
                    {editingUser ? 'Save Changes' : 'Create User'}
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
