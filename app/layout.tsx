import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BloomBox — Let Nature Bloom',
  description: 'BloomBox: Regenerative floral design studio, seasonal flower shop catalog, and precision billing management engine.',
  openGraph: {
    title: 'BloomBox — Let Nature Bloom',
    description: 'Beautiful flowers. Thoughtful moments. Naturally unforgettable.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-black text-[#f5efe2]">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Antonio:wght@400&family=Manrope:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-black font-manrope antialiased selection:bg-[#f5efe2] selection:text-[#151510] min-h-screen">
        {children}
        <div className="vignette-overlay" aria-hidden="true" />
        <div className="cinema-grain" aria-hidden="true" />
      </body>
    </html>
  );
}
