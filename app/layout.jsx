import './globals.css';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { CartProvider } from '@/lib/cart';

export const metadata = {
  title: '№40 TRAY — Nature\'s Finest. 40 Times Over.',
  description:
    'Premium microgreens harvested daily and delivered fresh to your door. Nature\'s finest nutrition, 40 times over.',
  icons: { icon: '/logo/logo1.png' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Black+Ops+One&display=swap" rel="stylesheet" />
      </head>
      <body>
        <CartProvider>
          {children}
        </CartProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
