import { Instrument_Sans, Lora, Zen_Maru_Gothic, IBM_Plex_Mono, Kalam } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import StructuredData from "../components/seo/StructuredData";
import '../index.css';
import '../v2/styles/v2.css';

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ui',
  display: 'swap',
});

const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-reflective',
  display: 'swap',
});

const zenMaruGothic = Zen_Maru_Gothic({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-zen-maru',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

const kalam = Kalam({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-hand',
  display: 'swap',
});

const googleVerification = process.env.GOOGLE_SITE_VERIFICATION || process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
const bingVerification = process.env.BING_SITE_VERIFICATION || process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION;

export const metadata = {
  metadataBase: new URL('https://ingresswithin.com'),
  alternates: {
    canonical: 'https://ingresswithin.com',
  },
  verification: {
    ...(googleVerification ? { google: googleVerification } : {}),
    ...(bingVerification ? { other: { 'msvalidate.01': bingVerification } } : {}),
  },
  title: {
    default: 'Ingress Within | Guided Journaling for Mental Wellness & Self-Understanding',
    template: '%s'
  },
  description: 'Ingress Within helps you understand yourself through guided journaling, psychology-informed exercises, emotional pattern insights, and structured self-reflection.',
  keywords: [
    'Ingress Within',
    'Guided Journaling',
    'Mental Wellness',
    'Self Reflection',
    'Personal Growth',
    'Psychometric Exercises',
    'Emotional Granularity',
    'Personalized Reports',
    'Cognitive Behavioral Journal',
    'Emotional Balance',
    'Pattern Intelligence'
  ],
  authors: [{ name: 'Ingress Within' }],
  creator: 'Ingress Within',
  publisher: 'Ingress Within',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'Ingress Within | Guided Journaling for Mental Wellness & Self-Understanding',
    description: 'Ingress Within helps you understand yourself through guided journaling, psychology-informed exercises, emotional pattern insights, and structured self-reflection.',
    url: 'https://ingresswithin.com',
    siteName: 'Ingress Within',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Ingress Within — Guided Journaling for Mental Wellness & Self-Understanding',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ingress Within | Guided Journaling for Mental Wellness & Self-Understanding',
    description: 'Ingress Within helps you understand yourself through guided journaling, psychology-informed exercises, emotional pattern insights, and structured self-reflection.',
    images: ['/og-image.png'],
    creator: '@ingresswithin',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
};

export const viewport = {
  themeColor: '#ECEFF0',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={`scroll-smooth ${instrumentSans.variable} ${lora.variable} ${zenMaruGothic.variable} ${ibmPlexMono.variable} ${kalam.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <StructuredData />
      </head>
      <body className="selection:bg-accent/40 selection:text-primary font-sans">
        <div id="root">
          {children}
        </div>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
