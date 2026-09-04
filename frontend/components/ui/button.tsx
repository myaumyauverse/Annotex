import React from 'react';

type ButtonVariant = 'default' | 'outline' | 'secondary';
type ButtonSize = 'sm' | 'default' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClassMap: Record<ButtonVariant, string> = {
  default: 'bg-black text-white hover:bg-black/85',
  outline: 'border border-black/20 bg-white text-black hover:bg-black/5',
  secondary: 'bg-gray-100 text-black hover:bg-gray-200',
};

const sizeClassMap: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm',
  default: 'h-10 px-4 text-sm',
  icon: 'h-10 w-10 p-0',
};

export function Button({
  className = '',
  variant = 'default',
  size = 'default',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variantClassMap[variant]} ${sizeClassMap[size]} ${className}`}
      {...props}
    />
  );
}
