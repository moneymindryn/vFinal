import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Order } from '../types';
import { formatPrice, formatDate } from '../utils/utils';
import { motion } from 'framer-motion';
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const MyOrders: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    console.log("MyOrders: Fetching orders for user:", user.uid);
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      // Sort client-side
      fetchedOrders.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      console.log("MyOrders: Fetched orders:", fetchedOrders);
      setOrders(fetchedOrders);
      setLoading(false);
    }, (error) => {
      console.error("MyOrders: Error fetching orders:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Complete':
      case 'Completed':
      case 'Delivered':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'Reject':
      case 'Rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Complete':
      case 'Completed':
      case 'Delivered':
        return 'bg-green-50 text-green-700 border-green-100';
      case 'Reject':
      case 'Rejected':
        return 'bg-red-50 text-red-700 border-red-100';
      default:
        return 'bg-yellow-50 text-yellow-700 border-yellow-100';
    }
  };

  const handleWhatsAppSupport = (e: React.MouseEvent, order: Order) => {
    e.preventDefault();
    e.stopPropagation();
    
    const tracking = order.trackingNumber || `#${order.id.slice(-8).toUpperCase()}`;
    const date = formatDate(order.createdAt);
    const amount = formatPrice(order.totalAmount);
    const trx = order.transactionId || 'N/A';
    
    let message = '';
    if (order.status === 'Pending') {
      message = `Hello Admin, I have paid ${amount} for Order ${tracking}. My Trx ID is ${trx}. Please verify and complete it.\n\nOrder ID: ${tracking}\nTotal Amount: ${amount}\nTransaction ID: ${trx}\nDate: ${date}`;
    } else if (order.status === 'Reject') {
      message = `Hello Admin, my order ${tracking} was rejected. I paid ${amount} with Trx ID: ${trx}. Could you please check this and let me know the reason or refund status?\n\nOrder ID: ${tracking}\nTotal Amount: ${amount}\nTransaction ID: ${trx}\nDate: ${date}`;
    }
    
    if (!message) return;

    const whatsappUrl = `https://wa.me/8801887076101?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <button
        onClick={() => navigate('/profile')}
        className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 font-bold mb-8 transition-colors group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        Back to Profile
      </button>

      <div className="flex items-center gap-4 mb-10">
        <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-100">
          <Package className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-gray-900">My Orders</h1>
          <p className="text-gray-500 font-medium">View and track your purchase history</p>
        </div>
      </div>

      {orders.length > 0 ? (
        <div className="space-y-6">
          {orders.map((order) => (
            <Link 
              to={`/order-details/${order.id}`} 
              key={order.id} 
              className="block group"
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all cursor-pointer"
              >
                <div className="p-6 md:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div>
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Tracking Number</p>
                      <p className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{order.trackingNumber || `#${order.id.slice(-8).toUpperCase()}`}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 font-bold text-sm ${getStatusClass(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status === 'Complete' || order.status === 'Delivered' ? 'Completed' : order.status === 'Reject' ? 'Rejected' : order.status}
                      </div>
                      <div className="p-2 bg-gray-50 text-gray-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 rounded-xl transition-all">
                        <ExternalLink className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    {order.items.slice(0, 2).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                            <Package className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{item.title}</p>
                            <p className="text-xs text-gray-500 font-medium">
                              {item.quantity} x {formatPrice(item.price)}
                              {item.variantName && ` • ${item.variantName}`}
                            </p>
                          </div>
                        </div>
                        <p className="font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    ))}
                    {order.items.length > 2 && (
                      <p className="text-sm text-gray-400 font-bold ml-16">
                        + {order.items.length - 2} more items
                      </p>
                    )}
                  </div>

                  <div className="pt-6 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Date</p>
                        <p className="text-sm font-bold text-gray-600">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Payment</p>
                        <p className="text-sm font-bold text-gray-600">{order.paymentMethod}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Amount</p>
                        <p className="text-2xl font-black text-indigo-600">{formatPrice(order.totalAmount)}</p>
                      </div>
                      <div className="bg-indigo-50 text-indigo-600 px-6 py-2 rounded-xl font-bold text-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        View Details
                      </div>
                    </div>
                  </div>

                  {(order.status === 'Pending' || order.status === 'Reject') && (
                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <button
                        onClick={(e) => handleWhatsAppSupport(e, order)}
                        className="flex items-center gap-2 px-6 py-3 bg-[#25D366] text-white rounded-xl font-bold hover:bg-[#128C7E] transition-all shadow-lg shadow-green-100"
                      >
                        <MessageSquare className="w-5 h-5" />
                        {order.status === 'Pending' ? 'Get Product Fast' : 'Why Reject/ Refund'}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] p-20 text-center border border-gray-100 shadow-sm">
          <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
            <Package className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No orders yet</h3>
          <p className="text-gray-500">You haven't placed any orders yet. Start shopping to see them here!</p>
          <button 
            onClick={() => navigate('/products')}
            className="mt-8 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all"
          >
            Browse Products
          </button>
        </div>
      )}
    </div>
  );
};

export default MyOrders;

