import type { Metadata } from 'next';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Ethos AI — Study Abroad, Without the Fear',
    template: '%s | Ethos AI',
  },
  description:
    'Ethos AI protects Bangladeshi students from fraudulent study-abroad consultancies through agency verification, escrow payments, and AI-powered document fraud detection.',
  keywords: ['study abroad', 'Bangladesh', 'consultancy verification', 'escrow payments', 'fraud detection', 'বিদেশে পড়াশোনা'],
  openGraph: {
    title: 'Ethos AI — Study Abroad, Without the Fear',
    description: 'Verified consultancies. Escrow payments. AI fraud protection.',
    siteName: 'Ethos AI',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#15141B" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#FBF3E3" media="(prefers-color-scheme: light)" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700;800&family=Inter:wght@400;500;600;700;800;900&family=Hind+Siliguri:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
