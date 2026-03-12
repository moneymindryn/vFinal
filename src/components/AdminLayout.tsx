import React from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Layers, 
  Settings, 
  LogOut, 
  Store,
  User,
  Menu,
  X,
  ShoppingCart,
  Users
} from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useState } from 'react';
import { cn } from '../utils/utils';

import { useAuth } from '../context/AuthContext';
import UserAvatar from './UserAvatar';

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/admin');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const menuItems = [
    { name: 'Dashboard', path: '/admin-panel/dashboard', icon: LayoutDashboard },
    { name: 'Orders', path: '/admin-panel/orders', icon: ShoppingCart },
    { name: 'Products', path: '/admin-panel/products', icon: Package },
    { name: 'Categories', path: '/admin-panel/categories', icon: Layers },
    { name: 'Users', path: '/admin-panel/users', icon: Users },
    { name: 'Settings', path: '/admin-panel/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 flex transition-colors duration-500">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-500 transform lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="p-8 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="bg-indigo-600 p-2 rounded-xl group-hover:rotate-12 transition-transform shadow-lg shadow-indigo-500/20">
                <Store className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
                Pixi Marts
              </span>
            </Link>
            <button className="lg:hidden" onClick={() => setIsSidebarOpen(false)}>
              <X className="w-6 h-6 text-slate-400 dark:text-slate-500" />
            </button>
          </div>

          <nav className="flex-1 px-4 space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "flex items-center gap-4 px-4 py-4 rounded-2xl font-bold transition-all",
                  location.pathname === item.path 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" 
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-100 dark:border-slate-800 transition-colors duration-500">
            <button
              onClick={handleLogout}
              className="flex items-center gap-4 w-full px-4 py-4 rounded-2xl font-bold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 min-h-screen flex flex-col">
        {/* Header */}
        <header className="h-20 bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between sticky top-0 z-40 transition-colors duration-500">
          <button className="lg:hidden" onClick={() => setIsSidebarOpen(true)}>
            <Menu className="w-6 h-6 text-slate-500 dark:text-slate-400" />
          </button>
          
          <div className="flex items-center gap-4 ml-auto">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-50">Admin</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email || 'No Email'}</p>
            </div>
            <UserAvatar 
              src={profile?.profilePic || profile?.photoURL} 
              name={profile?.displayName} 
              size="md" 
              className="border-slate-200 dark:border-slate-700"
            />
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
