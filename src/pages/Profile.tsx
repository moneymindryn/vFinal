import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { 
  LogOut, Package, ShieldCheck, User as UserIcon, Clock, CheckCircle2, XCircle, 
  Edit2, Camera, Phone, Mail, Save, X, ChevronRight, Wallet, MessageSquare
} from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { Order, UserProfile } from '../types';
import { formatPrice, cn, formatDate } from '../utils/utils';

import UserAvatar from '../components/UserAvatar';

const Profile: React.FC = () => {
  const { user, profile, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Completed' | 'Rejected'>('All');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    console.log("Fetching orders for user:", user.uid);
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      // Sort client-side to avoid index issues
      fetchedOrders.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      console.log("Fetched and sorted orders:", fetchedOrders);
      setOrders(fetchedOrders);
      setLoadingOrders(false);
    }, (error) => {
      console.error("Error fetching orders:", error);
      setLoadingOrders(false);
    });

    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (profile) {
      console.log("Current profile:", profile);
      setEditName(profile.displayName);
      setEditPhone(profile.phoneNumber || '');
    }
  }, [profile]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    console.log("Updating profile for:", user.uid, { editName, editPhone });
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: editName,
        phoneNumber: editPhone
      });
      console.log("Profile updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    console.log("Processing image for upload:", user.uid, file.name);
    setUploading(true);
    
    try {
      // Create a promise to handle the compression
      const compressedBlob = await new Promise<Blob>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 800;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            canvas.toBlob((blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Canvas to Blob conversion failed'));
            }, 'image/jpeg', 0.8);
          };
          img.onerror = () => reject(new Error('Image loading failed'));
          img.src = event.target?.result as string;
        };
        reader.onerror = () => reject(new Error('File reading failed'));
        reader.readAsDataURL(file);
      });

      const storageRef = ref(storage, `profiles/${user.uid}`);
      
      // Add a timeout to the upload process
      const uploadPromise = uploadBytes(storageRef, compressedBlob);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Upload timeout')), 30000);
      });

      console.log("Uploading compressed image...");
      const uploadResult = await Promise.race([uploadPromise, timeoutPromise]) as any;
      const downloadURL = await getDownloadURL(uploadResult.ref);
      console.log("Image uploaded, URL:", downloadURL);
      
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        profilePic: downloadURL,
        photoURL: downloadURL // Keep photoURL in sync for compatibility
      });
      console.log("Profile photo updated in Firestore");
    } catch (error) {
      console.error("Error uploading image:", error);
      alert(error instanceof Error && error.message === 'Upload timeout' 
        ? "Upload timed out. Please check your internet connection and try again." 
        : "Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Complete':
      case 'Completed':
      case 'Delivered':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'Reject':
      case 'Rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Complete':
      case 'Completed':
      case 'Delivered':
        return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-100 dark:border-green-900/30';
      case 'Reject':
      case 'Rejected':
        return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/30';
      default:
        return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-100 dark:border-yellow-900/30';
    }
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Pending') return order.status === 'Pending';
    if (activeTab === 'Completed') return order.status === 'Complete' || order.status === 'Delivered';
    if (activeTab === 'Rejected') return order.status === 'Reject';
    return true;
  });

  const totalSpent = orders
    .filter(order => order.status === 'Complete' || order.status === 'Delivered')
    .reduce((sum, order) => sum + order.totalAmount, 0);

  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest).toLocaleString());

  useEffect(() => {
    if (!loadingOrders) {
      const controls = animate(count, totalSpent, { 
        duration: 2,
        ease: "easeOut"
      });
      return controls.stop;
    }
  }, [loadingOrders, totalSpent, count]);

  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8 transition-colors duration-500">
      {/* Profile Card */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-500">
        <div className="bg-indigo-600 px-8 py-12 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-violet-700 opacity-50" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="relative group">
              <UserAvatar 
                src={profile.profilePic || profile.photoURL} 
                name={profile.displayName} 
                size="xl" 
                className="border-4 border-white/20 shadow-xl"
              />
              <label className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 p-2.5 rounded-2xl shadow-lg cursor-pointer hover:scale-110 transition-transform">
                <Camera className="w-5 h-5" />
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
              </label>
              {uploading && (
                <div className="absolute inset-0 bg-black/40 rounded-[2rem] flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
            </div>

            <div className="flex-1 text-center md:text-left space-y-4">
              {isEditing ? (
                <div className="space-y-4 max-w-md">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder:text-white/50 outline-none focus:bg-white/20 transition-all font-bold text-2xl"
                    placeholder="Full Name"
                  />
                  <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-4 py-2">
                    <Phone className="w-4 h-4 text-white/60" />
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="bg-transparent text-white placeholder:text-white/50 outline-none w-full font-medium"
                      placeholder="Phone Number"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdateProfile}
                      className="flex-1 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-all"
                    >
                      <Save className="w-4 h-4" /> Save Changes
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 bg-white/10 text-white py-2 rounded-xl font-bold hover:bg-white/20 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-center md:justify-start gap-4">
                    <h1 className="text-4xl font-black text-white">{profile.displayName}</h1>
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
                    >
                      <Edit2 className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-indigo-100 font-medium">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 opacity-70" />
                      {profile.email}
                    </div>
                    {profile.phoneNumber && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 opacity-70" />
                        {profile.phoneNumber}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 dark:bg-slate-900/50 transition-colors duration-500">
          {profile.role === 'admin' && (
            <Link 
              to="/admin"
              className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-emerald-200 dark:hover:border-emerald-900 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/20 transition-all group"
            >
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-50">Admin Panel</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Manage products and orders</p>
              </div>
              <ChevronRight className="w-4 h-4 ml-auto text-slate-300 dark:text-slate-600" />
            </Link>
          )}

          <button 
            onClick={handleLogout}
            className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-red-200 dark:hover:border-red-900 hover:bg-red-50/30 dark:hover:bg-red-900/20 transition-all group text-left"
          >
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-50">Sign Out</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Logout from your account</p>
            </div>
            <ChevronRight className="w-4 h-4 ml-auto text-slate-300 dark:text-slate-600" />
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-indigo-600 rounded-[2rem] p-8 text-white shadow-lg shadow-indigo-200 dark:shadow-none relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="relative z-10">
            <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
              <Wallet className="w-6 h-6" />
            </div>
            <p className="text-indigo-100 font-bold text-sm uppercase tracking-widest mb-1">Total Spent</p>
            <h3 className="text-3xl font-black flex items-center">
              ৳<motion.span>{rounded}</motion.span>
            </h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm md:col-span-2 flex items-center justify-between transition-all duration-500">
          <div className="space-y-1">
            <p className="text-slate-400 dark:text-slate-500 font-bold text-sm uppercase tracking-widest">Order Statistics</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-50">Activity Overview</h3>
          </div>
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{orders.length}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-green-500 dark:text-green-400">{orders.filter(o => o.status === 'Complete' || o.status === 'Delivered').length}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-yellow-500 dark:text-yellow-400">{orders.filter(o => o.status === 'Pending').length}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Pending</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-red-500 dark:text-red-400">{orders.filter(o => o.status === 'Reject').length}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Rejected</p>
              </div>
            </div>
        </div>
      </div>

      {/* Order History */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-500">
        <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2.5 rounded-2xl">
              <Package className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-50">Order History</h2>
          </div>
          
          <div className="flex bg-slate-50 dark:bg-slate-800 p-1.5 rounded-2xl overflow-x-auto no-scrollbar transition-colors duration-500">
            {(['All', 'Pending', 'Completed', 'Rejected'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                  activeTab === tab 
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="p-8">
          {loadingOrders ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
          ) : filteredOrders.length > 0 ? (
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {filteredOrders.map((order) => (
                  <Link 
                    key={order.id} 
                    to={`/order-details/${order.id}`}
                    className="block group"
                  >
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-6 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-indigo-100 dark:hover:border-indigo-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-black text-slate-900 dark:text-slate-50">{order.trackingNumber || `#${order.id.slice(-8).toUpperCase()}`}</span>
                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${getStatusClass(order.status)}`}>
                              {getStatusIcon(order.status)}
                              {order.status === 'Complete' || order.status === 'Delivered' ? 'Completed' : order.status === 'Reject' ? 'Rejected' : order.status}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500 font-medium">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(order.createdAt)}
                            </span>
                            <span className="w-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
                            <span>{order.items.length} Items</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform origin-right">
                            {formatPrice(order.totalAmount)}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">{order.paymentMethod}</p>
                        </div>
                      </div>

                      {(order.status === 'Pending' || order.status === 'Reject') && (
                        <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                          <button
                            onClick={(e) => handleWhatsAppSupport(e, order)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-xl text-xs font-bold hover:bg-[#128C7E] transition-all shadow-sm hover:shadow-md"
                          >
                            <MessageSquare className="w-4 h-4" />
                            {order.status === 'Pending' ? 'Get Product Fast' : 'Why Reject/ Refund'}
                          </button>
                        </div>
                      )}
                    </motion.div>
                  </Link>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300 dark:text-slate-600">
                <Package className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-50 mb-2">No {activeTab.toLowerCase()} orders</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-8">
                {activeTab === 'All' 
                  ? "You haven't placed any orders yet." 
                  : `You don't have any ${activeTab.toLowerCase()} orders at the moment.`}
              </p>
              <Link 
                to="/products"
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none"
              >
                Start Shopping
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
