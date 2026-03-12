import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '../types';
import { formatPrice } from '../utils/utils';
import { Link } from 'react-router-dom';

interface BannerSliderProps {
  products: Product[];
}

const BannerSlider: React.FC<BannerSliderProps> = ({ products }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (products.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [products.length]);

  if (products.length === 0) return null;

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % products.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);

  return (
    <div className="relative h-[400px] md:h-[500px] w-full overflow-hidden rounded-[2.5rem] group">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10" />
          {products[currentIndex].image && (
            <img
              src={products[currentIndex].image}
              alt={products[currentIndex].title}
              className="h-full w-full object-cover"
            />
          )}
          
          <div className="absolute inset-0 z-20 flex flex-col justify-center px-8 md:px-16 max-w-2xl">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <span className="bg-indigo-600 text-white text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-6 inline-block">
                Featured Deal
              </span>
              <h2 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight">
                {products[currentIndex].title}
              </h2>
              <p className="text-gray-300 text-lg mb-8 line-clamp-2 font-medium">
                {products[currentIndex].description}
              </p>
              <div className="flex items-center gap-6">
                <Link
                  to={`/product/${products[currentIndex].id}`}
                  className="bg-white text-gray-900 px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-50 transition-all active:scale-95"
                >
                  <ShoppingCart className="w-5 h-5" /> Buy Now - {formatPrice(products[currentIndex].salePrice)}
                </Link>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/10 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/10 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2">
        {products.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === currentIndex ? 'w-8 bg-white' : 'w-2 bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default BannerSlider;
