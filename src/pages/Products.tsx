import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Product, Category } from '../types';
import ProductCard from '../components/ProductCard';
import CategoryCard from '../components/CategoryCard';
import SearchBar from '../components/SearchBar';
import { Filter, LayoutGrid } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [searchParams]);

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

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory ? product.categories.includes(selectedCategory) : true;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 transition-colors duration-500">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-slate-50 mb-2">Explore Products</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Discover our collection of premium digital assets.</p>
          </div>
          <div className="w-full md:w-96">
            <SearchBar value={searchTerm} onChange={setSearchTerm} />
          </div>
        </div>

        {/* Categories Filter */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-slate-900 dark:text-slate-50 font-bold">
            <Filter className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Filter by Category</span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            <CategoryCard 
              category={{ id: 'all', name: 'All Products', icon: 'LayoutGrid' }} 
              isActive={selectedCategory === null}
              onClick={() => setSelectedCategory(null)}
            />
            {categories.map((cat) => (
              <CategoryCard 
                key={cat.id} 
                category={cat} 
                isActive={selectedCategory === cat.name}
                onClick={() => setSelectedCategory(cat.name)}
              />
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
              {selectedCategory || 'All Products'}
              <span className="ml-2 text-sm font-medium text-slate-400 dark:text-slate-500">({filteredProducts.length} items)</span>
            </h2>
          </div>
          
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-20 text-center border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="bg-slate-50 dark:bg-slate-950 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300 dark:text-slate-700">
                <LayoutGrid className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-2">No products found</h3>
              <p className="text-slate-500 dark:text-slate-400">Try adjusting your search or filter to find what you're looking for.</p>
              <button 
                onClick={() => { setSearchTerm(''); setSelectedCategory(null); }}
                className="mt-8 text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
