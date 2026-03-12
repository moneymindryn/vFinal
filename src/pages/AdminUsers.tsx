import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../types';
import { motion } from 'framer-motion';
import { Users, Shield, User as UserIcon, Mail, Calendar, Wallet, MessageSquare, Trash2, Download } from 'lucide-react';
import { formatPrice, formatDate } from '../utils/utils';
import UserAvatar from '../components/UserAvatar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'spent' | 'joined'>('joined');

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const sortedUsers = [...users].sort((a, b) => {
    if (sortBy === 'spent') {
      return (b.totalSpent || 0) - (a.totalSpent || 0);
    } else {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB.getTime() - dateA.getTime();
    }
  });

  const admins = sortedUsers.filter(u => u.role === 'admin');
  const regularUsers = sortedUsers.filter(u => u.role === 'user');

  const revokeAdmin = async (userId: string) => {
    if (!window.confirm(`Are you sure you want to revoke admin permissions for this user?`)) return;
    
    try {
      await updateDoc(doc(db, 'users', userId), { role: 'user' });
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Failed to update user role.");
    }
  };

  const removeUser = async (userId: string) => {
    if (!userId) {
      console.error("User ID is undefined");
      return;
    }

    if (!window.confirm("Are you sure you want to permanently remove this user? This action cannot be undone.")) return;
    
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Update local state immediately
        setUsers(prevUsers => prevUsers.filter(u => u.uid !== userId));
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove user');
      }
    } catch (error) {
      console.error("Error removing user:", error);
      alert(error instanceof Error ? error.message : "Failed to remove user.");
    }
  };

  const openWhatsApp = (phoneNumber?: string) => {
    if (!phoneNumber) {
      alert("This user has not provided a phone number.");
      return;
    }
    const message = encodeURIComponent("This is Admin from Pixi Marts Website, i ");
    window.open(`https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  const exportUserReport = () => {
    if (regularUsers.length === 0) {
      alert('No user data available to export');
      return;
    }

    const doc = new jsPDF();
    const date = new Date().toLocaleDateString();

    // Header
    doc.setFontSize(18);
    doc.text('Pixi Marts - Registered Users Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Report Date: ${date}`, 14, 28);

    // Table
    const tableData = regularUsers.map(user => [
      user.displayName || 'N/A',
      user.phoneNumber || 'N/A',
      user.email || 'N/A'
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['Name', 'Phone Number', 'Email Address']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] }, // Indigo-600
      styles: { fontSize: 9 },
    });

    doc.save('Pixi_Marts_Users_Report.pdf');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 transition-colors duration-500">User Management</h1>
          <p className="text-slate-600 dark:text-slate-400 transition-colors duration-500">Manage registered users and their permissions.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={exportUserReport}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
          >
            <Download className="w-4 h-4" />
            Export User Report
          </button>
          <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-500">
            <button
              onClick={() => setSortBy('spent')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                sortBy === 'spent' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Wallet className="w-3 h-3" />
              Sort by Spent
            </button>
            <button
              onClick={() => setSortBy('joined')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                sortBy === 'joined' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-3 h-3" />
              Sort by Joined
            </button>
          </div>
          <div className="bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-xl border border-indigo-500/20 font-bold flex items-center gap-2">
            <Users className="w-5 h-5" />
            {users.length} Total Users
          </div>
        </div>
      </div>

      {/* Admins Segment */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider transition-colors duration-500">Admins</h2>
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800 transition-colors duration-500"></div>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{admins.length} Admins</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {admins.map((user) => (
            <UserCard 
              key={user.uid} 
              user={user} 
              onRevoke={() => revokeAdmin(user.uid)}
            />
          ))}
        </div>
        {admins.length === 0 && (
          <p className="text-center py-10 text-slate-500 dark:text-slate-600 font-medium italic">No administrators found.</p>
        )}
      </div>

      {/* Regular Users Segment */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <UserIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider transition-colors duration-500">Regular Users</h2>
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800 transition-colors duration-500"></div>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{regularUsers.length} Users</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {regularUsers.map((user) => (
            <UserCard 
              key={user.uid} 
              user={user} 
              onMessage={() => openWhatsApp(user.phoneNumber)}
              onRemove={() => removeUser(user.uid)}
            />
          ))}
        </div>
        {regularUsers.length === 0 && (
          <p className="text-center py-10 text-slate-500 dark:text-slate-600 font-medium italic">No regular users found.</p>
        )}
      </div>
    </div>
  );
};

interface UserCardProps {
  user: UserProfile;
  onRevoke?: () => void;
  onMessage?: () => void;
  onRemove?: () => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, onRevoke, onMessage, onRemove }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 relative overflow-hidden group transition-colors duration-500 shadow-sm"
    >
      <div className="flex items-start gap-4 mb-6 relative z-10">
        <UserAvatar 
          src={user.profilePic || user.photoURL} 
          name={user.displayName} 
          size="lg" 
          className="rounded-2xl border-2 border-slate-100 dark:border-slate-700 shadow-xl"
        />
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate transition-colors duration-500">{user.displayName}</h3>
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium mt-1 transition-colors duration-500">
            <Mail className="w-3 h-3" />
            <span className="truncate">{user.email}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4 relative z-10">
        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 transition-colors duration-500">
          <div className="flex items-center gap-2">
            <Shield className={`w-4 h-4 ${user.role === 'admin' ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`} />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Role</span>
          </div>
          <span className={`text-xs font-black uppercase tracking-widest ${user.role === 'admin' ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`}>
            {user.role}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 transition-colors duration-500">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Joined</span>
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors duration-500">
            {formatDate(user.createdAt)}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Total Spent</span>
          </div>
          <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
            {formatPrice(user.totalSpent || 0)}
          </span>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 relative z-10 space-y-3 transition-colors duration-500">
        {(onMessage || onRemove) && (
          <div className="grid grid-cols-2 gap-3">
            {onMessage && (
              <button
                onClick={onMessage}
                className="flex items-center justify-center gap-2 py-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                Message
              </button>
            )}
            {onRemove && (
              <button
                onClick={onRemove}
                className="flex items-center justify-center gap-2 py-3 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-500/20 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Remove
              </button>
            )}
          </div>
        )}

        {onRevoke && (
          <button
            onClick={onRevoke}
            className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            Revoke Admin
          </button>
        )}
      </div>

      {/* Background Decoration */}
      <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full blur-3xl opacity-10 transition-colors ${user.role === 'admin' ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
    </motion.div>
  );
};

export default AdminUsers;
