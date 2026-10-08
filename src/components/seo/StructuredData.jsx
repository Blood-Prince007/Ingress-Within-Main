import React from 'react';

/**
 * StructuredData component renders production-safe JSON-LD scripts
 * for Organization, WebSite, and WebApplication schemas.
 * 
 * Complies with strict non-clinical guidelines (no medical/therapy claims).
 */
export default function StructuredData() {
  const baseUrl = 'https://ingresswithin.com';

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'Ingress Within',
    'url': baseUrl,
    'logo': `${baseUrl}/logo-mark.png`,
    'sameAs': [
      'https://twitter.com/ingresswithin'
    ]
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': 'Ingress Within',
    'url': baseUrl
  };

  const webApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    'name': 'Ingress Within',
    'url': baseUrl,
    'applicationCategory': 'LifestyleApplication',
    'operatingSystem': 'All',
    'description': 'Start on your own, work with a therapist, or move between the two. Ingress Within is one connected space for self-guided work and professional support.'
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationSchema) }}
      />
    </>
  );
}
