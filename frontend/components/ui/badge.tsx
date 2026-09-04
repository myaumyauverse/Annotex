import React from 'react';

type BadgeVariant = 'default' | 'secondary';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClassMap: Record<BadgeVariant, string> = {
  default: 'bg-black text-white',
  secondary: 'bg-gray-100 text-gray-900',
};

export function Badge({ className = '', variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${variantClassMap[variant]} ${className}`}
      {...props}
    />
  );
}
