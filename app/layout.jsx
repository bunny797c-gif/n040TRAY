import './globals.css';
import { Lora, Raleway } from 'next/font/google';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { CartProvider } from '@/lib/cart';

const lora = Lora({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-heading',
  display: 'swap',
});

const raleway = Raleway({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata = {
  title: '№40 TRAY — Nature\'s Finest. 40 Times Over.',
  description:
    'Premium microgreens harvested daily and delivered fresh to your door. Nature\'s finest nutrition, 40 times over.',
  icons: { icon: '/logo/sprout.png' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${lora.variable} ${raleway.variable}`}>
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
