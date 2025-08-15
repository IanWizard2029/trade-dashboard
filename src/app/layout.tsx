export const metadata = {
  title: 'Trade Marketing Dashboard',
  description: 'Lightweight dashboard powered by Supabase + Next.js',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // IMPORTANT: import the global Tailwind CSS here
  // (Keep import inside the file, top-level is fine.)
  return (
    <html lang="en">
      <head />
      <body>{children}</body>
    </html>
  );
}

// This import MUST be at module scope (top of the file or below metadata)
import './globals.css';
