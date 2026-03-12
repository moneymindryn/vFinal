import React, { useState, useEffect } from 'react';
import { Plus, Minus } from 'lucide-react';
import { FAQ } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const FAQSection: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'faqs'), (snapshot) => {
      const fqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FAQ));
      setFaqs(fqs);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return null;
  if (faqs.length === 0) return null;

  return (
    <div className="max-w-3xl mx-auto py-20">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-black text-gray-900 mb-4">Frequently Asked Questions</h2>
        <p className="text-gray-500 font-medium">Got questions? We've got answers.</p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq) => (
          <div
            key={faq.id}
            className="border border-gray-100 rounded-3xl overflow-hidden bg-white shadow-sm"
          >
            <button
              onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
              className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-bold text-gray-900">{faq.question}</span>
              {openId === faq.id ? (
                <Minus className="w-5 h-5 text-indigo-600" />
              ) : (
                <Plus className="w-5 h-5 text-gray-400" />
              )}
            </button>
            <AnimatePresence>
              {openId === faq.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-6 pt-0 text-gray-600 leading-relaxed">
                    {faq.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQSection;
