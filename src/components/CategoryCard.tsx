import React from 'react';
import { cn } from '../utils/utils';
import * as Icons from 'lucide-react';

interface CategoryCardProps {
  category: {
    id: string;
    name: string;
    icon: string;
  };
  isActive?: boolean;
  onClick: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, isActive, onClick }) => {
  // Dynamically get the icon component if it exists in lucide-react
  const IconComponent = (Icons as any)[category.icon] || Icons.Package;

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-3 p-6 rounded-[2rem] border transition-all min-w-[120px] group duration-500',
        isActive 
          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
          : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:bg-indigo-50/30 dark:hover:bg-indigo-500/10'
      )}
    >
      <div className={cn(
        'w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110',
        isActive ? 'bg-white/20' : 'bg-slate-50 dark:bg-slate-800'
      )}>
        {/* If icon is an emoji, show it directly, otherwise show the icon component */}
        {category.icon.length <= 2 ? (
          <span className="text-2xl">{category.icon}</span>
        ) : (
          <IconComponent className={cn('w-6 h-6', isActive ? 'text-white' : 'text-indigo-600 dark:text-indigo-400')} />
        )}
      </div>
      <span className={cn('text-sm font-bold whitespace-nowrap transition-colors duration-500', isActive ? 'text-white' : 'text-slate-900 dark:text-slate-50')}>{category.name}</span>
    </button>
  );
};

export default CategoryCard;
