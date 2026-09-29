import TermsOfServiceView from '../../views/TermsOfServiceView';

export const metadata = {
  title: 'Terms of Service | Ingress Within',
  description: 'Terms of Service and Conditions of Use for Ingress Within mental wellness platform, guided journaling, and teletherapy services.',
  alternates: {
    canonical: 'https://ingresswithin.com/terms',
  },
};

export default function TermsOfServiceAliasPage() {
  return <TermsOfServiceView />;
}
