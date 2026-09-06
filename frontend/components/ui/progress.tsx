import React from 'react';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
}

export function Progress({ value = 0, className = '', ...props }: ProgressProps) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div className={`relative w-full overflow-hidden rounded-full bg-gray-200 ${className}`} {...props}>
      <div
        className="h-full bg-black transition-all"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}
