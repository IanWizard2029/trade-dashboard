// ✅ Import Tailwind first so it’s available everywhere
import './globals.css';

export const metadata = {
  title: 'Trade Marketing Dashboard',
  description: 'Lightweight dashboard powered by Supabase + Next.js',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-[#0b0b0c] text-zinc-100">
        {children}
      </body>
    </html>
  );
}
