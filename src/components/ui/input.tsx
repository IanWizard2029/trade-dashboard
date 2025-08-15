import * as React from 'react';
export function Input({ className='', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-500 ${className}`} {...props} />
}
