import React from 'react';
import ProductCard from './ProductCard';
import { Product } from '../types';

interface FeaturedProductsSliderProps {
  products: Product[];
}

const FeaturedProductsSlider: React.FC<FeaturedProductsSliderProps> = ({ products }) => {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between transition-colors duration-500">
        <h2 className="text-3xl font-black text-slate-900 dark:text-slate-50">Featured Products</h2>
        <div className="flex gap-2">
          {/* Custom navigation if needed */}
        </div>
      </div>
      <div className="flex gap-4 md:gap-6 overflow-x-auto pb-8 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        {products.map((product) => (
          <div key={product.id} className="min-w-[160px] sm:min-w-[200px] md:min-w-[220px]">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeaturedProductsSlider;
