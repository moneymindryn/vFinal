import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { Order } from '../types';
import { formatPrice, formatDate } from '../utils/utils';
import { motion } from 'framer-motion';
import { ShoppingCart, CheckCircle2, Clock, XCircle, ExternalLink, ChevronUp, ChevronDown, Search, Trash2, Eye } from 'lucide-react';

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: 'Complete' | 'Reject') => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });

      if (newStatus === 'Complete') {
        const userRef = doc(db, 'users', order.userId);
        await updateDoc(userRef, {
          totalSpent: increment(order.totalAmount)
        });
      }
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Failed to update order status.");
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this order? This action cannot be undone.")) return;
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete order via API');
      }

      const data = await response.json();
      console.log(data.message);
      
      // The state will be updated automatically by the onSnapshot listener
      // but we can also manually filter if we weren't using real-time listeners.
    } catch (error) {
      console.error("Error deleting order:", error);
      alert("Failed to delete order.");
    }
  };

  const toggleSort = () => {
    if (sortOrder === 'asc') {
      setSortOrder('desc');
    } else {
      setSortOrder('asc');
    }
  };

  const sortedOrders = [...orders].sort((a, b) => {
    if (!sortOrder) return 0;
    if (sortOrder === 'asc') {
      return a.status.localeCompare(b.status);
    } else {
      return b.status.localeCompare(a.status);
    }
  });

  const filteredOrders = sortedOrders.filter(order => {
    const search = searchTerm.toLowerCase();
    return (
      order.trackingNumber?.toLowerCase().includes(search) ||
      order.transactionId?.toLowerCase().includes(search)
    );
  });

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Complete': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Reject': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    }
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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 transition-colors duration-500">Order Management</h1>
          <p className="text-slate-600 dark:text-slate-400 transition-colors duration-500">Track and manage customer orders.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative group w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" />
            <input
              type="text"
              placeholder="Search by Tracking ID or Transaction ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white pl-11 pr-4 py-3 rounded-2xl w-full focus:outline-none focus:border-indigo-500 transition-all text-sm shadow-sm"
            />
          </div>
          <div className="bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-xl border border-indigo-500/20 font-bold flex items-center gap-2 whitespace-nowrap">
            <ShoppingCart className="w-5 h-5" />
            {orders.length} Total Orders
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors duration-500 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">
                <th className="px-8 py-6">Tracking #</th>
                <th className="px-8 py-6">Amount</th>
                <th className="px-8 py-6">Status</th>
                <th className="px-8 py-6 text-center">Actions</th>
                <th className="px-8 py-6 text-center">View</th>
                <th className="px-8 py-6 text-right">Remove</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white mb-1 transition-colors duration-500">{order.trackingNumber || 'N/A'}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white transition-colors duration-500">{formatPrice(order.totalAmount)}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tighter">{order.paymentMethod}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${getStatusClass(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    {order.status === 'Pending' ? (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'Complete')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/20"
                        >
                          Done
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'Reject')}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-red-500/20"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-bold italic">Processed</span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-center">
                    <a
                      href={`/order-details/${order.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center p-2 bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
                    >
                      <Eye className="w-4 h-4" />
                    </a>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button
                      onClick={() => handleDeleteOrder(order.id)}
                      className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredOrders.length === 0 && (
          <div className="p-20 text-center">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400 dark:text-slate-600">
              {searchTerm ? <Search className="w-10 h-10" /> : <ShoppingCart className="w-10 h-10" />}
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 transition-colors duration-500">
              {searchTerm ? 'No orders found with this ID' : 'No orders yet'}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 transition-colors duration-500">
              {searchTerm ? 'Try adjusting your search term.' : 'When customers place orders, they will appear here.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
