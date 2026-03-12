import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice, generateTrackingNumber, cn } from '../utils/utils';
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

  const isFreeOrder = cart.length > 0 && cart.every(item => item.categories.includes('Free'));
  const freeLink = isFreeOrder ? cart[0].freeLink : null;

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
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-4">Your cart is empty</h2>
        <button
          onClick={() => navigate('/products')}
          className="bg-indigo-600 dark:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
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
        totalAmount: isFreeOrder ? 0 : totalPrice,
        paymentMethod: isFreeOrder ? 'Free' : paymentMethod,
        transactionId: isFreeOrder ? 'FREE_ACCESS' : formData.transactionId,
        status: isFreeOrder ? 'Complete' : 'Pending',
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
      
      if (isFreeOrder && freeLink) {
        window.open(freeLink, '_blank');
      }
      
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-12 transition-colors duration-500">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold mb-8 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Summary & Payment */}
          <div className="space-y-8">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-50 mb-6">Order Summary</h2>
              <div className="space-y-4 mb-8">
                {cart.map((item) => (
                  <div key={item.cartItemId} className="flex justify-between items-center">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-50 truncate">{item.title}</p>
                      {item.selectedVariant && (
                        <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-tighter">Option: {item.selectedVariant.name}</p>
                      )}
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Quantity: {item.quantity}</p>
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-50 shrink-0">
                      {isFreeOrder ? 'FREE' : formatPrice(item.salePrice * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-lg font-bold text-slate-900 dark:text-slate-50">Total Amount</span>
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{isFreeOrder ? 'FREE' : formatPrice(totalPrice)}</span>
              </div>
            </div>

            {!isFreeOrder && (
              <div className="bg-indigo-600 dark:bg-indigo-700 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100 dark:shadow-none">
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
            )}
            
            {isFreeOrder && (
              <div className="bg-emerald-600 dark:bg-emerald-700 p-8 rounded-[2.5rem] text-white shadow-xl shadow-emerald-100 dark:shadow-none">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6" />
                  Free Access
                </h3>
                <p className="text-emerald-50 font-medium">
                  This product is currently free! Just fill out your details and click "Get for Free" to receive your access link immediately.
                </p>
              </div>
            )}
          </div>

          {/* Right: Form */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm h-fit">
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-50 mb-8">Complete Your Order</h2>
            
            {!isFreeOrder && (
              <div className="flex gap-4 mb-8">
                <button
                  onClick={() => setPaymentMethod('bKash')}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold border-2 transition-all ${
                    paymentMethod === 'bKash'
                      ? 'bg-pink-50 dark:bg-pink-900/20 border-pink-500 text-pink-600 dark:text-pink-400'
                      : 'bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  bKash
                </button>
                <button
                  onClick={() => setPaymentMethod('Nagad')}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold border-2 transition-all ${
                    paymentMethod === 'Nagad'
                      ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-500 text-orange-600 dark:text-orange-400'
                      : 'bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  Nagad
                </button>
                <button
                  onClick={() => setPaymentMethod('Rocket')}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold border-2 transition-all ${
                    paymentMethod === 'Rocket'
                      ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-500 text-purple-600 dark:text-purple-400'
                      : 'bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  Rocket
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-900/20 focus:border-indigo-200 dark:focus:border-indigo-800 transition-all font-medium text-slate-900 dark:text-slate-50"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Gmail</label>
                <input
                  required
                  type="email"
                  value={formData.gmail}
                  onChange={(e) => setFormData({ ...formData, gmail: e.target.value })}
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-900/20 focus:border-indigo-200 dark:focus:border-indigo-800 transition-all font-medium text-slate-900 dark:text-slate-50"
                  placeholder="example@gmail.com"
                />
                <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <Info className="w-3.5 h-3.5 text-indigo-400" />
                  Double-check! Your product access details will be delivered to this email address.
                </p>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Phone Number</label>
                <input
                  required
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-900/20 focus:border-indigo-200 dark:focus:border-indigo-800 transition-all font-medium text-slate-900 dark:text-slate-50"
                  placeholder="01XXX-XXXXXX"
                />
              </div>
              {!isFreeOrder && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Transaction ID</label>
                  <input
                    required
                    type="text"
                    value={formData.transactionId}
                    onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-900/20 focus:border-indigo-200 dark:focus:border-indigo-800 transition-all font-medium text-slate-900 dark:text-slate-50"
                    placeholder="Enter TxID from SMS"
                  />
                </div>
              )}
              
              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "w-full py-5 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-xl active:scale-[0.98] mt-8 disabled:opacity-50 disabled:cursor-not-allowed",
                  isFreeOrder 
                    ? "bg-emerald-600 dark:bg-emerald-500 text-white hover:bg-emerald-700 dark:hover:bg-emerald-600 shadow-emerald-100 dark:shadow-none" 
                    : "bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 shadow-indigo-100 dark:shadow-none"
                )}
              >
                {isSubmitting ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  isFreeOrder ? <CheckCircle2 className="w-6 h-6" /> : <ShoppingBag className="w-6 h-6" />
                )}
                {isSubmitting ? 'Processing...' : (isFreeOrder ? 'Get for Free' : 'Order Now')}
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
                className="relative bg-white dark:bg-slate-900 w-full max-w-md p-8 md:p-10 rounded-[3rem] shadow-2xl text-center border border-slate-100 dark:border-slate-800"
              >
                <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 dark:text-emerald-400" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-slate-50 mb-4">{isFreeOrder ? 'Success!' : 'Order Placed!'}</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">
                  {isFreeOrder 
                    ? 'Your free access has been processed. The link should have opened in a new tab.' 
                    : 'Your order has been placed! Wait for confirmation.'}
                </p>
                <button
                  onClick={() => navigate('/my-orders')}
                  className="w-full bg-indigo-600 dark:bg-indigo-500 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-200 dark:shadow-none active:scale-[0.98]"
                >
                  Check your Order
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Checkout;
