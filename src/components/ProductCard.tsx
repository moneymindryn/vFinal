import React from 'react';
import { ShoppingCart, MessageCircle, Star } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/utils';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const message = `Hello Pixi Marts! I am interested in ${product.title} (Price: ${formatPrice(product.salePrice)}). Can you help me?`;
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
      whileHover={{ y: -8 }}
      className="group bg-white/40 backdrop-blur-md border border-white/20 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
    >
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {product.image && (
            <img
              src={product.image}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          )}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1">
            {product.categories.slice(0, 1).map(cat => (
              <span key={cat} className="bg-white/80 backdrop-blur-md text-indigo-600 text-[10px] font-bold px-3 py-1 rounded-full border border-white/50 shadow-sm">
                {cat}
              </span>
            ))}
          </div>
          {product.featured && (
            <div className="absolute top-3 right-3">
              <div className="bg-amber-400 p-1.5 rounded-full shadow-sm">
                <Star className="w-3 h-3 text-white fill-current" />
              </div>
            </div>
          )}
        </div>

        <div className="p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-2 truncate group-hover:text-indigo-600 transition-colors">
            {product.title}
          </h3>
          <div className="flex items-center justify-between mb-5">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                {product.variants && product.variants.length > 0 && (
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">From</span>
                )}
                <span className="text-lg font-black text-indigo-600">
                  {formatPrice(
                    product.variants && product.variants.length > 0
                      ? Math.min(...product.variants.map(v => v.salePrice))
                      : product.salePrice
                  )}
                </span>
              </div>
              {product.regularPrice > product.salePrice && (!product.variants || product.variants.length === 0) && (
                <span className="text-[10px] text-gray-400 line-through font-bold">{formatPrice(product.regularPrice)}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-400 fill-current" />
              <span className="text-xs font-bold text-gray-500">{Number(product.rating || 0).toFixed(1)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleBuyNow}
              className="col-span-2 bg-indigo-600 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              Buy Now
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                addToCart(product);
              }}
              className="bg-white border border-gray-100 text-gray-700 py-2 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              Add
            </button>
            <button
              onClick={handleWhatsApp}
              className="bg-emerald-50 text-emerald-600 border border-emerald-100 py-2 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Chat
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
