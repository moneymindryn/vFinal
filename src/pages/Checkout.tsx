import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice, generateTrackingNumber } from '../utils/utils';
import { Copy, Check, ArrowLeft, Wallet, CreditCard, ShoppingBag, CheckCircle2, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, onSnapshot, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { AppSettings } from '../types';

const Checkout: React.FC = () => {
  const { cart, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'bKash' | 'Nagad' | 'Rocket'>('bKash');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    gmail: '',
    phone: '',
    transactionId: '',
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as AppSettings);
      }
    });
    return unsubscribe;
  }, []);

  const adminNumber = settings?.paymentNumber || '01945220851';

  if (cart.length === 0 && !showSuccess) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
        <button
          onClick={() => navigate('/products')}
          className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold"
        >
          Go to Shop
        </button>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(adminNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const trackingNumber = generateTrackingNumber();
      
      // Save to Firestore
      const orderData = {
        trackingNumber,
        userId: user?.uid || 'guest',
        customerName: formData.name,
        customerGmail: formData.gmail,
        customerPhone: formData.phone,
        totalAmount: totalPrice,
        paymentMethod,
        transactionId: formData.transactionId,
        status: 'Pending',
        items: cart.map(item => ({
          productId: item.id,
          title: item.title,
          quantity: item.quantity,
          price: item.salePrice,
          variantName: item.selectedVariant?.name || null
        })),
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'orders'), orderData);
      
      clearCart();
      setShowSuccess(true);
    } catch (error) {
      console.error("Order submission error:", error);
      alert("Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 font-bold mb-8 transition-colors group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left: Summary & Payment */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h2 className="text-2xl font-black text-gray-900 mb-6">Order Summary</h2>
            <div className="space-y-4 mb-8">
              {cart.map((item) => (
                <div key={item.cartItemId} className="flex justify-between items-center">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{item.title}</p>
                    {item.selectedVariant && (
                      <p className="text-[10px] font-black text-indigo-500 uppercase tracking-tighter">Option: {item.selectedVariant.name}</p>
                    )}
                    <p className="text-xs text-gray-400 font-medium">Quantity: {item.quantity}</p>
                  </div>
                  <span className="text-sm font-bold text-gray-900 shrink-0">
                    {formatPrice(item.salePrice * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="pt-6 border-t border-gray-100 flex justify-between items-center">
              <span className="text-lg font-bold text-gray-900">Total Amount</span>
              <span className="text-2xl font-black text-indigo-600">{formatPrice(totalPrice)}</span>
            </div>
          </div>

          <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Wallet className="w-6 h-6" />
              Payment Instructions
            </h3>
            <div className="space-y-6">
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20">
                <p className="text-white/70 text-sm font-medium mb-2">Send Money to this number:</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black">{adminNumber}</span>
                  <button
                    onClick={handleCopy}
                    className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</div>
                  <p className="text-sm font-medium">Select your preferred payment method below.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</div>
                  <p className="text-sm font-medium">Send <span className="font-black">{formatPrice(totalPrice)}</span> to the number above.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</div>
                  <p className="text-sm font-medium">Copy the Transaction ID and fill the form.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm h-fit">
          <h2 className="text-2xl font-black text-gray-900 mb-8">Complete Your Order</h2>
          
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setPaymentMethod('bKash')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold border-2 transition-all ${
                paymentMethod === 'bKash'
                  ? 'bg-pink-50 border-pink-500 text-pink-600'
                  : 'bg-white border-gray-100 text-gray-400'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              bKash
            </button>
            <button
              onClick={() => setPaymentMethod('Nagad')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold border-2 transition-all ${
                paymentMethod === 'Nagad'
                  ? 'bg-orange-50 border-orange-500 text-orange-600'
                  : 'bg-white border-gray-100 text-gray-400'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              Nagad
            </button>
            <button
              onClick={() => setPaymentMethod('Rocket')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold border-2 transition-all ${
                paymentMethod === 'Rocket'
                  ? 'bg-purple-50 border-purple-500 text-purple-600'
                  : 'bg-white border-gray-100 text-gray-400'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              Rocket
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all font-medium"
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Gmail</label>
              <input
                required
                type="email"
                value={formData.gmail}
                onChange={(e) => setFormData({ ...formData, gmail: e.target.value })}
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all font-medium"
                placeholder="example@gmail.com"
              />
              <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Info className="w-3.5 h-3.5 text-indigo-400" />
                Double-check! Your product access details will be delivered to this email address.
              </p>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
              <input
                required
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all font-medium"
                placeholder="01XXX-XXXXXX"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Transaction ID</label>
              <input
                required
                type="text"
                value={formData.transactionId}
                onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all font-medium"
                placeholder="Enter TxID from SMS"
              />
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-100 active:scale-[0.98] mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <ShoppingBag className="w-6 h-6" />
              )}
              {isSubmitting ? 'Processing...' : 'Order Now'}
            </button>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-md p-8 md:p-10 rounded-[3rem] shadow-2xl text-center"
            >
              <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-4">Order Placed!</h2>
              <p className="text-gray-500 font-medium mb-8">
                Your order has been placed! Wait for confirmation.
              </p>
              <button
                onClick={() => navigate('/my-orders')}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-[0.98]"
              >
                Check your Order
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Checkout;
