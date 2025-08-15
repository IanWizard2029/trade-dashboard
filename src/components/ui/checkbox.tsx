import * as React from 'react';
export function Checkbox({
  checked,
  onChange,
  className = ''
}: { checked?: boolean; onChange?: () => void; className?: string }) {
  return (
    <input
      type="checkbox"
      checked={!!checked}
      onChange={onChange}
      className={`h-4 w-4 rounded border-zinc-600 bg-zinc-950/60 focus:ring-zinc-600 ${className}`}
    />
  );
}
