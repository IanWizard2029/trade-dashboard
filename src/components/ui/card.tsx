import * as React from 'react';
export function Card({ className='', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-2xl border border-zinc-800 bg-zinc-900/60 ${className}`} {...props} />
}
export function CardContent({ className='', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`p-6 ${className}`} {...props} />
}
