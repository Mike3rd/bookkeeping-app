// app/layout.tsx
import './globals.css';

export const metadata = {
  title: 'Bookkeeping App',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-800 min-h-screen">{children}</body>
    </html>
  );
}
