import React from 'react';
import { User as UserIcon } from 'lucide-react';
import { cn } from '../utils/utils';

interface UserAvatarProps {
  src?: string;
  name?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const UserAvatar: React.FC<UserAvatarProps> = ({ src, name, className, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-32 h-32 text-4xl',
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'User'}
        className={cn('rounded-full object-cover border border-slate-100 dark:border-slate-800 shadow-sm transition-all duration-500', sizeClasses[size], className)}
        referrerPolicy="no-referrer"
      />
    );
  }

  if (name) {
    return (
      <div
        className={cn(
          'rounded-full bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black border border-slate-200 dark:border-slate-700 shadow-sm transition-all duration-500',
          sizeClasses[size],
          className
        )}
      >
        {getInitials(name)}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm transition-all duration-500',
        sizeClasses[size],
        className
      )}
    >
      <UserIcon className={cn(size === 'xl' ? 'w-16 h-16' : size === 'lg' ? 'w-8 h-8' : 'w-4 h-4')} />
    </div>
  );
};

export default UserAvatar;
