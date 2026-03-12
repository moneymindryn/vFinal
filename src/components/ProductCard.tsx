import React from 'react';
import { ShoppingCart, MessageCircle, Star } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { formatPrice, cn } from '../utils/utils';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();

  // Find the variation with the lowest sale price
  const lowestSaleVariant = product.variants && product.variants.length > 0
    ? [...product.variants].sort((a, b) => a.salePrice - b.salePrice)[0]
    : null;

  const displaySalePrice = lowestSaleVariant ? lowestSaleVariant.salePrice : product.salePrice;
  const displayRegularPrice = lowestSaleVariant ? lowestSaleVariant.regularPrice : product.regularPrice;

  const discountPercentage = displayRegularPrice > displaySalePrice
    ? Math.round(((displayRegularPrice - displaySalePrice) / displayRegularPrice) * 100)
    : 0;

  const getDiscountColor = (pct: number) => {
    if (pct <= 20) return "bg-blue-500";
    if (pct <= 40) return "bg-green-500";
    if (pct <= 60) return "bg-orange-500";
    if (pct <= 80) return "bg-red-600";
    return "bg-purple-600";
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const message = `Hello Pixi Marts! I am interested in ${product.title} (Price: ${formatPrice(displaySalePrice)}). Can you help me?`;
    window.open(`https://wa.me/8801838192595?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    addToCart(product);
    navigate('/checkout');
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      onClick={() => navigate(`/product/${product.id}`)}
      className={cn(
        "group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-950">
        {product.image && (
          <img
            src={product.image}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        )}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {discountPercentage > 0 && (
            <div className={cn(
              "text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-lg flex items-center justify-center self-start",
              getDiscountColor(discountPercentage),
              discountPercentage >= 80 && "animate-discount-glow"
            )}>
              {discountPercentage}% OFF
            </div>
          )}
        </div>
        {product.featured && (
          <div className="absolute top-2 right-2 z-10">
            <div className="bg-amber-400 p-1 rounded-full shadow-sm">
              <Star className="w-2.5 h-2.5 text-white fill-current" />
            </div>
          </div>
        )}
      </div>

      <div className="p-2.5 relative z-10">
        <h3 className="text-[11px] font-bold text-slate-900 dark:text-slate-50 mb-1 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {product.title}
        </h3>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
              {formatPrice(displaySalePrice)}
            </span>
            {displayRegularPrice > displaySalePrice && (
              <span className="text-[10px] text-slate-400 dark:text-slate-500 line-through font-bold">
                {formatPrice(displayRegularPrice)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            <Star className="w-2 h-2 text-amber-400 fill-current" />
            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">{Number(product.rating || 0).toFixed(1)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={handleBuyNow}
            className="col-span-2 bg-indigo-600 text-white py-1.5 rounded-lg text-[9px] font-bold hover:bg-indigo-700 dark:hover:bg-indigo-500 transition-all active:scale-95 flex items-center justify-center gap-1"
          >
            Buy Now
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              addToCart(product);
            }}
            className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-1 rounded-lg text-[9px] font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 flex items-center justify-center gap-1"
          >
            <ShoppingCart className="w-3 h-3" />
            Add
          </button>
          <button
            onClick={handleWhatsApp}
            className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/30 py-1 rounded-lg text-[9px] font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all active:scale-95 flex items-center justify-center gap-1"
          >
            <MessageCircle className="w-3 h-3" />
            Chat
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
