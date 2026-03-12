import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, placeholder = "Search for products..." }) => {
  return (
    <div className="relative w-full max-w-2xl mx-auto transition-colors duration-500">
      <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-slate-400 dark:text-slate-500" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full pl-14 pr-6 py-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] text-slate-900 dark:text-slate-50 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-xl shadow-slate-200/50 dark:shadow-none"
        placeholder={placeholder}
      />
    </div>
  );
};

export default SearchBar;
