import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, setDoc, doc, serverTimestamp, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Product, Category, Order } from '../types';
import { 
  Package, 
  Layers, 
  Star, 
  Image as ImageIcon,
  Clock,
  ArrowUpRight,
  Wallet,
  ShoppingBag,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { formatPrice } from '../utils/utils';
import { motion, useSpring, useTransform, animate } from 'framer-motion';

const CountUp: React.FC<{ value: number; duration?: number }> = ({ value, duration = 2 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: duration,
      onUpdate: (latest) => setCount(Math.floor(latest)),
      ease: "easeOut"
    });
    return () => controls.stop();
  }, [value, duration]);

  return <>{formatPrice(count)}</>;
};

const AdminDashboard: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qProducts = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(prods);
    });

    const unsubscribeCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      setCategories(cats);
    });

    const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
      const ords = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(ords);
      setLoading(false);
    });

    return () => {
      unsubscribeProducts();
      unsubscribeCategories();
      unsubscribeOrders();
    };
  }, []);

  const totalRevenue = orders
    .filter(o => o.status === 'Complete')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const pendingOrders = orders.filter(o => o.status === 'Pending');
  const completedOrders = orders.filter(o => o.status === 'Complete');
  const rejectedOrders = orders.filter(o => o.status === 'Reject');

  const getPercentage = (count: number) => {
    if (orders.length === 0) return '0%';
    return `${Math.round((count / orders.length) * 100)}%`;
  };

  const orderStats = [
    { 
      name: 'Total Earnings', 
      value: totalRevenue, 
      isCurrency: true,
      icon: Wallet, 
      color: 'text-emerald-400', 
      bg: 'bg-emerald-500/10',
      subValue: 'From completed orders'
    },
    { 
      name: 'Total Orders', 
      value: orders.length, 
      icon: ShoppingBag, 
      color: 'text-blue-400', 
      bg: 'bg-blue-500/10',
      subValue: 'All time orders'
    },
    { 
      name: 'Pending Orders', 
      value: pendingOrders.length, 
      icon: Clock, 
      color: 'text-amber-400', 
      bg: 'bg-amber-500/10',
      percentage: getPercentage(pendingOrders.length),
      percentageColor: 'bg-amber-500/20 text-amber-400'
    },
    { 
      name: 'Completed Orders', 
      value: completedOrders.length, 
      icon: CheckCircle, 
      color: 'text-emerald-400', 
      bg: 'bg-emerald-500/10',
      percentage: getPercentage(completedOrders.length),
      percentageColor: 'bg-emerald-500/20 text-emerald-400'
    },
    { 
      name: 'Rejected Orders', 
      value: rejectedOrders.length, 
      icon: XCircle, 
      color: 'text-red-400', 
      bg: 'bg-red-500/10',
      percentage: getPercentage(rejectedOrders.length),
      percentageColor: 'bg-red-500/20 text-red-400'
    },
  ];

  const stats = [
    { name: 'Total Products', value: products.length, icon: Package, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { name: 'Total Categories', value: categories.length, icon: Layers, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { name: 'Featured Products', value: products.filter(p => p.featured).length, icon: Star, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { name: 'Banner Products', value: products.filter(p => p.banner).length, icon: ImageIcon, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  ];

  const seedDatabase = async () => {
    setLoading(true);
    try {
      // Seed Categories
      const catRefs = await Promise.all([
        addDoc(collection(db, 'categories'), { name: 'Streaming', icon: '📺' }),
        addDoc(collection(db, 'categories'), { name: 'Gaming', icon: '🎮' }),
        addDoc(collection(db, 'categories'), { name: 'Design', icon: '🎨' }),
        addDoc(collection(db, 'categories'), { name: 'Software', icon: '💻' }),
      ]);

      // Seed Settings
      await setDoc(doc(db, 'settings', 'general'), {
        whatsappNumber: '+8801838192595',
        email: 'infoplaxora@gmail.com',
        location: 'Gaibandha, Bangladesh',
        facebookPage: 'https://facebook.com/plaxomart',
        paymentNumber: '01945220851'
      });

      // Seed Products
      const demoProducts = [
        {
          title: 'Netflix Premium 1 Month',
          description: 'Get high-quality 4K streaming with your own profile. Shared account with private profile.',
          image: 'https://picsum.photos/seed/netflix/800/800',
          regularPrice: 450,
          salePrice: 350,
          categories: ['Streaming'],
          featured: true,
          banner: true,
          rating: 4.9,
          reviewCount: 124,
          createdAt: serverTimestamp()
        },
        {
          title: 'Canva Pro Lifetime',
          description: 'Unlock all premium features of Canva for a lifetime. Best for designers and creators.',
          image: 'https://picsum.photos/seed/canva/800/800',
          regularPrice: 2000,
          salePrice: 499,
          categories: ['Design', 'Software'],
          featured: true,
          banner: false,
          rating: 5.0,
          reviewCount: 89,
          createdAt: serverTimestamp()
        },
        {
          title: 'Spotify Premium 6 Months',
          description: 'Ad-free music streaming with offline downloads. Individual plan.',
          image: 'https://picsum.photos/seed/spotify/800/800',
          regularPrice: 1200,
          salePrice: 850,
          categories: ['Streaming'],
          featured: false,
          banner: true,
          rating: 4.8,
          reviewCount: 210,
          createdAt: serverTimestamp()
        }
      ];

      for (const product of demoProducts) {
        await addDoc(collection(db, 'products'), product);
      }

      alert('Database seeded successfully!');
    } catch (error) {
      console.error('Error seeding database:', error);
      alert('Failed to seed database.');
    } finally {
      setLoading(false);
    }
  };

  const clearDatabase = async () => {
    if (!window.confirm('Are you sure you want to delete ALL products and categories? This cannot be undone.')) return;
    
    setLoading(true);
    try {
      // Delete all products
      const productsSnapshot = await getDocs(collection(db, 'products'));
      const productDeletions = productsSnapshot.docs.map(d => deleteDoc(d.ref));
      await Promise.all(productDeletions);

      // Delete all categories
      const categoriesSnapshot = await getDocs(collection(db, 'categories'));
      const categoryDeletions = categoriesSnapshot.docs.map(d => deleteDoc(d.ref));
      await Promise.all(categoryDeletions);

      alert('All demo data cleared successfully!');
    } catch (error) {
      console.error('Error clearing database:', error);
      alert('Failed to clear database.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full transition-colors duration-500">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 transition-colors duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Dashboard Overview</h1>
          <p className="text-slate-500 dark:text-slate-400">Welcome back! Here's what's happening with Pixi Marts.</p>
        </div>
        <div className="flex gap-4">
          {products.length === 0 && (
            <button 
              onClick={seedDatabase}
              className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
            >
              Seed Demo Data
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all duration-500"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bg} ${stat.color} p-3 rounded-2xl`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Live</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{stat.name}</p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Order Statistics */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-indigo-500 rounded-full"></div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Order Statistics</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {orderStats.map((stat, i) => (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + (i * 0.1) }}
              className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all duration-500"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.bg} ${stat.color} p-3 rounded-2xl`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                {stat.percentage && (
                  <span className={`${stat.percentageColor} text-[10px] font-bold px-2 py-1 rounded-lg`}>
                    {stat.percentage}
                  </span>
                )}
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{stat.name}</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                {stat.name === 'Total Earnings' ? (
                  <CountUp value={stat.value as number} />
                ) : (
                  stat.value
                )}
              </h3>
              {stat.subValue && (
                <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-1 font-medium uppercase tracking-wider">{stat.subValue}</p>
              )}
              {stat.percentage && (
                <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-1 font-medium uppercase tracking-wider">{stat.percentage} of total</p>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Products */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-500">
          <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Clock className="w-6 h-6 text-indigo-400" />
              Recent Products
            </h2>
            <button className="text-indigo-600 dark:text-indigo-400 text-sm font-bold flex items-center gap-2 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
              View All <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest border-b border-slate-50 dark:border-slate-800">
                  <th className="px-8 py-4">Product</th>
                  <th className="px-8 py-4">Category</th>
                  <th className="px-8 py-4">Price</th>
                  <th className="px-8 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {products.slice(0, 5).map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-4">
                        {product.image && (
                          <img src={product.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        )}
                        <span className="font-bold text-slate-900 dark:text-white text-sm truncate max-w-[200px]">{product.title}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex gap-1">
                        {product.categories.slice(0, 1).map(cat => (
                          <span key={cat} className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-1 rounded-md uppercase">
                            {cat}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">{formatPrice(product.salePrice)}</span>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex gap-2">
                        {product.featured && <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]" title="Featured"></span>}
                        {product.banner && <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" title="Banner"></span>}
                        <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]" title="Live"></span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions / Summary */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-all duration-500">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">System Status</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 text-sm">Firestore</span>
                <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 text-sm">Storage</span>
                <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 text-sm">Auth</span>
                <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                  Secure
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
