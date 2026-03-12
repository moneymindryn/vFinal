import React, { useEffect, useState } from 'react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Category } from '../types';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Layout,
  Search,
  Check,
  AlertCircle
} from 'lucide-react';
import { cn } from '../utils/utils';
import { motion, AnimatePresence } from 'framer-motion';

const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const fetchedCategories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      setCategories(fetchedCategories);
      setLoading(false);

      // Check if Premium category exists, if not add it (one-time check)
      const hasPremium = fetchedCategories.some(c => c.name === 'Premium');
      if (!hasPremium && fetchedCategories.length > 0) {
        addDoc(collection(db, 'categories'), {
          name: 'Premium',
          icon: '💎'
        }).catch(err => console.error('Error seeding Premium category:', err));
      }
    });
    return unsubscribe;
  }, []);

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setName(category.name);
      setIcon(category.icon);
    } else {
      setEditingCategory(null);
      setName('');
      setIcon('');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const categoryData = { name, icon };
      if (editingCategory) {
        await updateDoc(doc(db, 'categories', editingCategory.id), categoryData);
      } else {
        await addDoc(collection(db, 'categories'), categoryData);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving category:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await deleteDoc(doc(db, 'categories', categoryToDelete.id));
      setCategoryToDelete(null);
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors duration-500">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-50 mb-2">Categories</h1>
          <p className="text-slate-500 dark:text-slate-400">Organize your products with categories.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 text-white px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
        >
          <Plus className="w-5 h-5" /> Add New Category
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          </div>
        ) : categories.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400">
            No categories found.
          </div>
        ) : categories.map((category) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 flex items-center justify-between group transition-colors duration-500"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-2xl transition-colors duration-500">
                {category.icon || '📦'}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-50">{category.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold">Category</p>
              </div>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity relative z-10">
              <button 
                onClick={() => handleOpenModal(category)}
                className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 rounded-xl transition-all cursor-pointer"
              >
                <Edit2 className="w-4 h-4 pointer-events-none" />
              </button>
              <button 
                onClick={() => setCategoryToDelete(category)}
                className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-red-600 hover:text-white dark:hover:bg-red-500 rounded-xl transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4 pointer-events-none" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden transition-colors duration-500"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between transition-colors duration-500">
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-50">
                  {editingCategory ? 'Edit Category' : 'Add Category'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  <X className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Category Name</label>
                  <input 
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-4 px-4 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    placeholder="e.g. Graphics"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Icon (Emoji)</label>
                  <input 
                    type="text"
                    required
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-4 px-4 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    placeholder="e.g. 🎨"
                  />
                </div>

                <div className="pt-4 flex items-center justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-3 rounded-xl font-bold text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Category'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {categoryToDelete && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCategoryToDelete(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-2xl p-8 text-center transition-colors duration-500"
            >
              <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6 transition-colors duration-500">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-50 mb-2">Delete Category?</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8">Are you sure you want to delete "{categoryToDelete.name}"? This action cannot be undone.</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setCategoryToDelete(null)}
                  className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition-all shadow-xl shadow-red-500/20"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminCategories;
