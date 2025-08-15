import * as React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'solid' | 'subtle' | 'ghost' | 'outline';
  size?: 'sm' | 'md';
};

const base =
  'inline-flex items-center justify-center rounded-lg transition-colors focus:outline-none focus:ring-1 focus:ring-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed';

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  solid:  'bg-zinc-100 text-zinc-900 hover:bg-white border border-zinc-700',
  subtle: 'bg-zinc-900/60 text-zinc-100 hover:bg-zinc-900 border border-zinc-800',
  ghost:  'bg-transparent text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900/50',
  outline:'bg-transparent text-zinc-100 border border-zinc-800 hover:bg-zinc-900/60'
};

const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-8 px-2.5 text-xs',
  md: 'h-9 px-3 text-sm'
};

export function Button({
  className = '',
  variant = 'subtle',
  size = 'md',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
