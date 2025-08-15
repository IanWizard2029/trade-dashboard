import * as React from 'react';
export function Button({ className='', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-100 text-zinc-900 hover:bg-white disabled:opacity-50 ${className}`} {...props} />
}
