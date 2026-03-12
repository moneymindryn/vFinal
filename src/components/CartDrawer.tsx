import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { formatPrice } from '../utils/utils';
import { Link } from 'react-router-dom';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { cart, removeFromCart, updateQuantity, totalPrice, totalItems } = useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white dark:bg-slate-950 z-[70] shadow-2xl flex flex-col transition-colors duration-500"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between transition-colors duration-500">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Your Cart ({totalItems})</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-500 dark:text-slate-400" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4 transition-colors duration-500">
                    <ShoppingBag className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-50 mb-2">Your cart is empty</h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-8">Looks like you haven't added anything to your cart yet.</p>
                  <button
                    onClick={onClose}
                    className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.cartItemId} className="flex gap-4 group">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 transition-colors duration-500">
                      {item.image && (
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50 truncate mb-1">{item.title}</h4>
                      {item.selectedVariant && (
                        <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-tighter mb-1">Option: {item.selectedVariant.name}</p>
                      )}
                      <p className="text-indigo-600 dark:text-indigo-400 font-bold text-sm mb-3">{formatPrice(item.salePrice)}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 rounded-lg p-1 transition-colors duration-500">
                          <button
                            onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                            className="p-1 hover:bg-white dark:hover:bg-slate-800 rounded-md shadow-sm transition-all"
                          >
                            <Minus className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                          </button>
                          <span className="text-xs font-bold w-4 text-center text-slate-900 dark:text-slate-50">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                            className="p-1 hover:bg-white dark:hover:bg-slate-800 rounded-md shadow-sm transition-all"
                          >
                            <Plus className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.cartItemId)}
                          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 transition-colors duration-500">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Subtotal</span>
                  <span className="text-2xl font-bold text-slate-900 dark:text-slate-50">{formatPrice(totalPrice)}</span>
                </div>
                <Link
                  to="/checkout"
                  onClick={onClose}
                  className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-center block hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none active:scale-[0.98]"
                >
                  Proceed to Checkout
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
