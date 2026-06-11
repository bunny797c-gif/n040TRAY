import './globals.css';
import { SpeedInsights } from '@vercel/speed-insights/next';

export const metadata = {
  title: 'The Tray Microgreens — Fresh, Farm-Grown Microgreens',
  description:
    'Premium microgreens harvested daily and delivered fresh to your door. Subscribe weekly, fortnightly, or monthly.',
  icons: { icon: '/logo/logo1.png' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}<SpeedInsights /></body>
    </html>
  );
}
