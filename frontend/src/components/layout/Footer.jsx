import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';

const quickLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/resources', label: 'Resources' },
  { to: '/faq', label: 'FAQs' },
];

const resourceLinks = [
  { href: '#', label: 'Startup India' },
  { href: '#', label: 'Ministry of AYUSH' },
  { href: '#', label: 'DPIIT' },
  { href: '#', label: 'FSSAI' },
];

const legalLinks = [
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/terms', label: 'Terms of Service' },
  { to: '/disclaimer', label: 'Disclaimer' },
];

export default function Footer() {
  return (
    <footer className="bg-[#0D3B2E] text-white">
      {/* Main Footer */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Branding Column */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                <Leaf className="h-5 w-5 text-[#E99B35]" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                AYUSH Setu
              </span>
            </Link>
            <p className="text-sm text-gray-300 leading-relaxed max-w-xs">
              A unified digital platform facilitating AYUSH startup onboarding,
              registration, and regulatory guidance.
            </p>
            <div className="mt-6 flex items-center gap-1.5">
              <span className="h-1.5 w-6 rounded-full bg-[#E99B35]" />
              <span className="h-1.5 w-6 rounded-full bg-[#E99B35]/60" />
              <span className="h-1.5 w-6 rounded-full bg-[#E99B35]/30" />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-gray-300 hover:text-[#E99B35] transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Resources
            </h3>
            <ul className="space-y-2.5">
              {resourceLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-gray-300 hover:text-[#E99B35] transition-colors duration-200"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Legal
            </h3>
            <ul className="space-y-2.5">
              {legalLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-gray-300 hover:text-[#E99B35] transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-xs text-gray-400 leading-relaxed text-center">
            <span className="font-medium text-gray-300">Disclaimer:</span>{' '}
            AYUSH Setu is a startup facilitation platform. It does not
            independently issue statutory licences or certifications.
          </p>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10 bg-[#092e23]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} AYUSH Setu. A Government of India
            Initiative.
          </p>
          <p className="text-xs text-gray-500">
            This is a demonstration platform.
          </p>
        </div>
      </div>
    </footer>
  );
}
