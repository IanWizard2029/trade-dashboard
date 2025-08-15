export const metadata = {
  title: "Trade Marketing Dashboard",
  description: "Ultra-simple Next.js + Supabase app"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="text-zinc-100">{children}</body>
    </html>
  );
}
