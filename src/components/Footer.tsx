import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, MessageCircle, Mail, MapPin, Store } from 'lucide-react';
import { doc, getDoc, collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { AppSettings, Category } from '../types';

const Footer: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'general');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(docSnap.data() as AppSettings);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    fetchSettings();

    const unsubscribeCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    });

    return () => unsubscribeCategories();
  }, []);

  return (
    <footer className="bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pt-16 pb-8 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
        {/* Brand */}
        <div className="col-span-1 md:col-span-1">
          <Link to="/" className="flex items-center gap-2 mb-4">
            <div className="bg-indigo-600 p-2 rounded-xl">
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-slate-50">Pixi Marts</span>
          </Link>
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">
            Your ultimate destination for premium digital products. Instant delivery, lifetime access, and 24/7 support.
          </p>
          <div className="flex items-center gap-4">
            <a href="https://facebook.com/piximarts" target="_blank" rel="noopener noreferrer" className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-600 dark:hover:border-indigo-400 transition-all">
              <Facebook className="w-5 h-5" />
            </a>
            {settings?.whatsappNumber && (
              <a href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-600 dark:hover:border-indigo-400 transition-all">
                <MessageCircle className="w-5 h-5" />
              </a>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-bold text-slate-900 dark:text-slate-50 mb-6">Quick Links</h4>
          <ul className="space-y-4">
            <li><Link to="/" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm transition-colors">Home</Link></li>
            <li><Link to="/products" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm transition-colors">Products</Link></li>
            <li><Link to="/contact" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm transition-colors">Contact Us</Link></li>
            <li><a href="https://facebook.com/piximarts" target="_blank" rel="noopener noreferrer" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm transition-colors">FB Page</a></li>
          </ul>
        </div>

        {/* Categories */}
        <div>
          <h4 className="font-bold text-slate-900 dark:text-slate-50 mb-6">Categories</h4>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-4">
            {categories.length > 0 ? (
              categories.map(cat => (
                <li key={cat.id}>
                  <Link to={`/products?category=${cat.name}`} className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm transition-colors">
                    {cat.name}
                  </Link>
                </li>
              ))
            ) : (
              <>
                <li><Link to="/products?category=Streaming" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm transition-colors">Streaming</Link></li>
                <li><Link to="/products?category=Design" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm transition-colors">Design</Link></li>
              </>
            )}
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h4 className="font-bold text-slate-900 dark:text-slate-50 mb-6">Contact Info</h4>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <MessageCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <a 
                href={`https://wa.me/${(settings?.whatsappNumber || '+8801887076101').replace(/\D/g, '')}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-slate-600 dark:text-slate-400 text-sm hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                {settings?.whatsappNumber || '+8801887076101'}
              </a>
            </li>
            <li className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <a 
                href={`mailto:${settings?.email || 'moneymindryn@gmail.com'}`}
                className="text-slate-600 dark:text-slate-400 text-sm hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                {settings?.email || 'moneymindryn@gmail.com'}
              </a>
            </li>
            <li className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings?.location || 'mymensingh')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-600 dark:text-slate-400 text-sm hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                {settings?.location || 'mymensingh'}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-slate-200 dark:border-slate-800 text-center">
        <p className="text-slate-500 dark:text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} Pixi Marts. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
