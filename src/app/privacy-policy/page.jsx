import PrivacyPolicyView from '../../views/PrivacyPolicyView';

export const metadata = {
  title: 'Privacy Policy | Ingress Within',
  description: 'Learn how Ingress Within protects your personal data, journal entries, and Google user data in compliance with Google API User Data Policy and Indian data protection laws.',
  alternates: {
    canonical: 'https://ingresswithin.com/privacy-policy',
  },
  openGraph: {
    title: 'Privacy Policy | Ingress Within',
    description: 'Learn how Ingress Within protects your personal data, journal entries, and Google user data in compliance with Google API User Data Policy and Indian data protection laws.',
    url: 'https://ingresswithin.com/privacy-policy',
  },
};

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyView />;
}
