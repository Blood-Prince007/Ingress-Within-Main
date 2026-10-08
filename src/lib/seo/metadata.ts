import { ROUTE_INTENT_MAP } from './keywordStrategy';

export interface RouteMetadataOptions {
  slug?: string | string[];
}

const BASE_URL = 'https://ingresswithin.com';
const DEFAULT_IMAGE = '/og-image.png';

/**
 * Generates unique Next.js Metadata for any public route.
 */
export function generatePageMetadata({ slug }: RouteMetadataOptions = {}) {
  let routeKey = 'home';
  let isKnownPublicRoute = false;

  const rawPath = Array.isArray(slug)
    ? slug.join('/').toLowerCase()
    : (typeof slug === 'string' ? slug.toLowerCase() : '');

  const normalizedPath = rawPath.startsWith('v2/')
    ? rawPath.slice(3)
    : (rawPath === 'v2' ? '' : rawPath);

  if (!normalizedPath || normalizedPath === '') {
    routeKey = 'home';
    isKnownPublicRoute = true;
  } else if (normalizedPath === 'what-it-is') {
    routeKey = 'whatItIs';
    isKnownPublicRoute = true;
  } else if (normalizedPath === 'guided-journaling') {
    routeKey = 'guidedJournaling';
    isKnownPublicRoute = true;
  } else if (normalizedPath === 'self-reflection') {
    routeKey = 'selfReflection';
    isKnownPublicRoute = true;
  } else if (normalizedPath === 'emotional-patterns') {
    routeKey = 'emotionalPatterns';
    isKnownPublicRoute = true;
  } else if (normalizedPath === 'self-awareness') {
    routeKey = 'selfAwareness';
    isKnownPublicRoute = true;
  } else if (normalizedPath === 'journaling-prompts-for-self-discovery') {
    routeKey = 'journalingPrompts';
    isKnownPublicRoute = true;
  } else if (normalizedPath === 'how-to-start-journaling') {
    routeKey = 'howToStartJournaling';
    isKnownPublicRoute = true;
  } else if (normalizedPath === 'how-to-practice-self-reflection') {
    routeKey = 'howToPracticeSelfReflection';
    isKnownPublicRoute = true;
  } else if (normalizedPath === 'how-it-works') {
    routeKey = 'howItWorks';
    isKnownPublicRoute = true;
  } else if (normalizedPath === 'about') {
    routeKey = 'about';
    isKnownPublicRoute = true;
  } else if (normalizedPath === 'pricing') {
    routeKey = 'pricing';
    isKnownPublicRoute = true;
  } else if (normalizedPath === 'faq') {
    routeKey = 'faq';
    isKnownPublicRoute = true;
  } else if (normalizedPath === 'ai-data') {
    routeKey = 'aiData';
    isKnownPublicRoute = true;
  } else if (normalizedPath === 'contact') {
    routeKey = 'contact';
    isKnownPublicRoute = true;
  } else if (normalizedPath === 'auth' || normalizedPath === 'login' || normalizedPath === 'user/auth' || normalizedPath === 'user/login') {
    routeKey = 'auth';
    isKnownPublicRoute = true;
  } else if (normalizedPath === 'therapist' || normalizedPath === 'therapist/auth' || normalizedPath === 'therapist/login') {
    routeKey = 'therapistAuth';
    isKnownPublicRoute = true;
  }

  const intent = ROUTE_INTENT_MAP[routeKey] || ROUTE_INTENT_MAP.home;
  const canonicalPath = routeKey === 'home' ? '/' : `/${rawPath}`;
  const canonicalUrl = `${BASE_URL}${canonicalPath}`;

  const robots = isKnownPublicRoute
    ? {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      }
    : {
        index: false,
        follow: false,
        googleBot: {
          index: false,
          follow: false,
        },
      };

  const googleVerification = process.env.GOOGLE_SITE_VERIFICATION || process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
  const bingVerification = process.env.BING_SITE_VERIFICATION || process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION;
  const verification = (googleVerification || bingVerification)
    ? {
        ...(googleVerification ? { google: googleVerification } : {}),
        ...(bingVerification ? { other: { 'msvalidate.01': bingVerification } } : {}),
      }
    : undefined;

  return {
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: canonicalUrl,
    },
    title: intent.title,
    description: intent.description,
    robots,
    ...(verification ? { verification } : {}),
    openGraph: {
      title: intent.title,
      description: intent.description,
      url: canonicalUrl,
      siteName: 'Ingress Within',
      locale: 'en_US',
      type: 'website',
      images: [
        {
          url: DEFAULT_IMAGE,
          width: 1200,
          height: 630,
          alt: intent.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: intent.title,
      description: intent.description,
      images: [DEFAULT_IMAGE],
      creator: '@ingresswithin',
    },
  };
}
