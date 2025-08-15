import * as React from 'react';

export function Input({
  className = '',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`h-9 px-3 rounded-lg bg-zinc-950/60 border border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600 ${className}`}
      {...props}
    />
  );
}
