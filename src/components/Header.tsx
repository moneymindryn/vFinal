import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X, Store, User as UserIcon, Gift } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/utils';

import UserAvatar from './UserAvatar';
import ThemeToggle from './ThemeToggle';

interface HeaderProps {
  onCartOpen: () => void;
}

const Header: React.FC<HeaderProps> = ({ onCartOpen }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { totalItems } = useCart();
  const { user, profile } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isAdmin = profile?.role === 'admin' || user?.email === 'admin@piximart.com';

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Products', path: '/products' },
    { name: 'Contact', path: '/contact' },
    { name: 'FB Page', path: 'https://facebook.com/piximarts', external: true },
  ];

  const freeLink = { name: 'FREE 🎁', path: '/products?category=Free' };

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 py-3',
        isScrolled 
          ? 'bg-white/80 dark:bg-slate-950/80 backdrop-blur-md shadow-sm' 
          : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-indigo-600 p-2 rounded-xl group-hover:rotate-12 transition-transform">
            <Store className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            Pixi Marts
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            link.external ? (
              <a
                key={link.name}
                href={link.path}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                {link.name}
              </a>
            ) : (
              <Link
                key={link.name}
                to={link.path}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-indigo-600 dark:hover:text-indigo-400',
                  location.pathname === link.path 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : 'text-slate-600 dark:text-slate-300'
                )}
              >
                {link.name}
              </Link>
            )
          ))}
          
          {/* Animated FREE Button */}
          <Link
            to={freeLink.path}
            className="relative group"
          >
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
                boxShadow: [
                  "0 0 0 0px rgba(249, 115, 22, 0)",
                  "0 0 0 10px rgba(249, 115, 22, 0.2)",
                  "0 0 0 0px rgba(249, 115, 22, 0)"
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="bg-[#FF8C00] hover:bg-[#FFA500] text-white px-4 py-1.5 rounded-full text-xs font-black tracking-widest flex items-center justify-center shadow-lg shadow-orange-500/40 transition-colors"
            >
              {freeLink.name}
            </motion.div>
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          <ThemeToggle />

          <Link
            to={user ? "/profile" : "/login"}
            className={cn(
              "p-2 rounded-xl transition-all duration-300",
              location.pathname === (user ? "/profile" : "/login")
                ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-indigo-600 dark:hover:text-indigo-400"
            )}
            title={user ? "Profile" : "Login"}
          >
            <UserAvatar 
              src={profile?.profilePic || profile?.photoURL} 
              name={profile?.displayName} 
              size="sm" 
            />
          </Link>

          <button
            onClick={onCartOpen}
            className="relative p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <ShoppingCart className="w-6 h-6" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-950">
                {totalItems}
              </span>
            )}
          </button>

          <button
            className="md:hidden p-2 text-slate-600 dark:text-slate-300"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-50 md:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-3/4 max-w-sm bg-white dark:bg-slate-950 z-50 shadow-2xl md:hidden flex flex-col p-6"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">Menu</span>
                <button onClick={() => setIsMobileMenuOpen(false)}>
                  <X className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                </button>
              </div>
              <nav className="flex flex-col gap-6">
                {navLinks.map((link) => (
                  link.external ? (
                    <a
                      key={link.name}
                      href={link.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg font-medium text-slate-600 dark:text-slate-300 transition-colors"
                    >
                      {link.name}
                    </a>
                  ) : (
                    <Link
                      key={link.name}
                      to={link.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        'text-lg font-medium transition-colors',
                        location.pathname === link.path 
                          ? 'text-indigo-600 dark:text-indigo-400' 
                          : 'text-slate-600 dark:text-slate-300'
                      )}
                    >
                      {link.name}
                    </Link>
                  )
                ))}
                
                {/* Mobile FREE Button */}
                <Link
                  to={freeLink.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="bg-[#FF8C00] active:bg-[#FFA500] text-white px-6 py-4 rounded-2xl font-black tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-orange-500/20 transition-colors"
                >
                  {freeLink.name}
                </Link>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
