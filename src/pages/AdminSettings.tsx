import React, { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { AppSettings } from '../types';
import { 
  Save, 
  Phone, 
  Mail, 
  MapPin, 
  Facebook, 
  CreditCard,
  Check,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>({
    whatsappNumber: '',
    email: '',
    location: '',
    facebookPage: '',
    paymentNumber: ''
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as AppSettings);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'general'), settings);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="transition-colors duration-500">
        <h1 className="text-3xl font-black text-slate-900 dark:text-slate-50 mb-2">Store Settings</h1>
        <p className="text-slate-500 dark:text-slate-400">Update your contact information and payment details.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors duration-500">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 transition-colors duration-500">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-3">
              <Phone className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
              Contact Information
            </h2>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">WhatsApp Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                <input 
                  type="text"
                  name="whatsappNumber"
                  value={settings.whatsappNumber}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  placeholder="+8801234567890"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                <input 
                  type="email"
                  name="email"
                  value={settings.email}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  placeholder="contact@plaxomart.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Location</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                <input 
                  type="text"
                  name="location"
                  value={settings.location}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  placeholder="Gaibandha, Bangladesh"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Facebook Page URL</label>
              <div className="relative">
                <Facebook className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                <input 
                  type="text"
                  name="facebookPage"
                  value={settings.facebookPage}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  placeholder="https://facebook.com/plaxomart"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors duration-500">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 transition-colors duration-500">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
              Payment Details
            </h2>
          </div>
          <div className="p-8">
            <div className="max-w-md space-y-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Payment Number (bKash/Nagad)</label>
              <div className="relative">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                <input 
                  type="text"
                  name="paymentNumber"
                  value={settings.paymentNumber}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  placeholder="017XXXXXXXX"
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 ml-1 italic">This number will be shown to customers during checkout.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            {showSuccess && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold"
              >
                <Check className="w-5 h-5" /> Settings saved successfully!
              </motion.div>
            )}
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" /> Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;
