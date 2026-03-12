import React, { useEffect, useState } from 'react';
import { Star, Quote } from 'lucide-react';
import { Review } from '../types';
import { motion } from 'framer-motion';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

const ReviewSection: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'), limit(6));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const revs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
      setReviews(revs);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return null;
  if (reviews.length === 0) return null;

  return (
    <div className="py-20 bg-slate-50 dark:bg-slate-900/50 -mx-4 px-4 md:mx-0 md:px-0 rounded-[3rem] transition-colors duration-500">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-slate-50 mb-4 transition-colors duration-500">What Our Customers Say</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium transition-colors duration-500">
          Trusted by thousands of happy customers worldwide. Here's why they love Pixi Marts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {reviews.map((review, index) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            viewport={{ once: true }}
            className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 relative transition-colors duration-500"
          >
            <div className="absolute top-8 right-8 opacity-10">
              <Quote className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${i < review.rating ? 'text-amber-400 fill-current' : 'text-slate-200 dark:text-slate-700'}`}
                />
              ))}
            </div>
            <p className="text-slate-600 dark:text-slate-400 italic mb-8 leading-relaxed transition-colors duration-500">"{review.reviewText}"</p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg transition-colors duration-500">
                {review.customerName[0]}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-50 transition-colors duration-500">{review.customerName}</h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium transition-colors duration-500">Verified Customer</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ReviewSection;
