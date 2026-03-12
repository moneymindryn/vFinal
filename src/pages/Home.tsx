import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Product, Category } from '../types';
import BannerSlider from '../components/BannerSlider';
import CategoryCard from '../components/CategoryCard';
import FeaturedProductsSlider from '../components/FeaturedProductsSlider';
import ProductCard from '../components/ProductCard';
import ReviewSection from '../components/ReviewSection';
import FAQSection from '../components/FAQSection';
import { Zap, ShieldCheck, Headphones, Tag, LayoutGrid } from 'lucide-react';
import { motion } from 'framer-motion';

const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const qProducts = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      setLoading(false);
    });

    const unsubscribeCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    });

    return () => {
      unsubscribeProducts();
      unsubscribeCategories();
    };
  }, []);

  const featuredProducts = products.filter(p => p.featured);
  const bannerProducts = products.filter(p => p.banner);
  
  const filteredProducts = selectedCategory 
    ? products.filter(p => p.categories.includes(selectedCategory))
    : products;

  const features = [
    { icon: Zap, title: 'Instant Delivery', desc: 'Get your digital assets immediately after payment.' },
    { icon: ShieldCheck, title: 'Lifetime Access', desc: 'Enjoy your products forever with no hidden fees.' },
    { icon: Headphones, title: '24/7 Support', desc: 'Our team is always here to help you anytime.' },
    { icon: Tag, title: 'Affordable Price', desc: 'Premium quality digital products at the best rates.' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-20 pb-20">
      {/* Hero */}
      <section className="pt-4">
        <BannerSlider products={bannerProducts} />
      </section>

      {/* Featured Slider */}
      {featuredProducts.length > 0 && (
        <section className="px-4 max-w-7xl mx-auto">
          <FeaturedProductsSlider products={featuredProducts} />
        </section>
      )}

      {/* Product Grid */}
      <section className="px-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8 md:mb-12">
          <div className="flex items-baseline gap-3">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-50">
              {selectedCategory || 'All Products'}
            </h2>
            <span className="text-xs md:text-sm font-bold text-slate-400 dark:text-slate-500">{filteredProducts.length} Items</span>
          </div>
          <Link 
            to="/products" 
            className="flex items-center gap-1 text-xs md:text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors group"
          >
            View All
            <motion.span
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              →
            </motion.span>
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="px-4 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
        {features.map((f, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -5 }}
            className="p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all"
          >
            <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6">
              <f.icon className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-2">{f.title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{f.desc}</p>
          </motion.div>
        ))}
      </section>

      {/* Reviews */}
      <section className="px-4 max-w-7xl mx-auto">
        <ReviewSection />
      </section>

      {/* FAQ */}
      <section className="px-4 max-w-7xl mx-auto">
        <FAQSection />
      </section>
    </div>
  );
};

export default Home;
