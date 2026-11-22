import React from 'react';
import { ShieldCheck, Truck, Lock, Award } from 'lucide-react';
import { PolicyModalData } from './FooterPolicyModal';
import { useTranslation } from '../context/LanguageContext';

interface FooterProps {
  onSelectCategory: (categoryId: string) => void;
  onOpenPolicy: (data: PolicyModalData) => void;
  onOpenPartRequest: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onSelectCategory,
  onOpenPolicy,
  onOpenPartRequest,
}) => {
  const { t } = useTranslation();

  const openPolicyModal = (title: string, category: 'protection' | 'payment' | 'legal', content: string[]) => {
    onOpenPolicy({ title, category, content });
  };

  return (
    <footer className="w-full bg-[#1b1f24] text-slate-300 border-t border-slate-800 text-xs mt-12">
      {/* Top Value Assurance Strip */}
      <div className="bg-[#14181c] border-b border-slate-800 py-6">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-6 h-6 text-[#ff6600] shrink-0" />
            <div>
              <p className="font-bold text-white text-sm">{t.footerValue1Title}</p>
              <p className="text-slate-400 text-xs mt-0.5">
                {t.footerValue1Desc}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Award className="w-6 h-6 text-[#ff6600] shrink-0" />
            <div>
              <p className="font-bold text-white text-sm">{t.footerValue2Title}</p>
              <p className="text-slate-400 text-xs mt-0.5">
                {t.footerValue2Desc}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Truck className="w-6 h-6 text-[#ff6600] shrink-0" />
            <div>
              <p className="font-bold text-white text-sm">{t.footerValue3Title}</p>
              <p className="text-slate-400 text-xs mt-0.5">
                {t.footerValue3Desc}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Lock className="w-6 h-6 text-[#ff6600] shrink-0" />
            <div>
              <p className="font-bold text-white text-sm">{t.footerValue4Title}</p>
              <p className="text-slate-400 text-xs mt-0.5">
                {t.footerValue4Desc}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <h4 className="font-bold text-white text-sm uppercase tracking-wider mb-3">
            {t.footerColCategories}
          </h4>
          <ul className="space-y-2 text-slate-400">
            <li>
              <button
                type="button"
                onClick={() => onSelectCategory('micro-hardware')}
                className="hover:text-[#ff8533] transition-colors cursor-pointer text-left"
              >
                {t.catMicro}
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onSelectCategory('tires-wheels')}
                className="hover:text-[#ff8533] transition-colors cursor-pointer text-left"
              >
                {t.catTires}
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onSelectCategory('body-exterior')}
                className="hover:text-[#ff8533] transition-colors cursor-pointer text-left"
              >
                {t.catBody}
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onSelectCategory('cabin-interior')}
                className="hover:text-[#ff8533] transition-colors cursor-pointer text-left"
              >
                {t.catInterior}
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onSelectCategory('braking-suspension')}
                className="hover:text-[#ff8533] transition-colors cursor-pointer text-left"
              >
                {t.catBrakes}
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onSelectCategory('engine-transmission')}
                className="hover:text-[#ff8533] transition-colors cursor-pointer text-left"
              >
                {t.catEngine}
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onSelectCategory('electrical-sensors')}
                className="hover:text-[#ff8533] transition-colors cursor-pointer text-left"
              >
                {t.catElectrical}
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onSelectCategory('cooling-exhaust')}
                className="hover:text-[#ff8533] transition-colors cursor-pointer text-left"
              >
                {t.catCooling}
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-white text-sm uppercase tracking-wider mb-3">
            {t.footerColProtection}
          </h4>
          <ul className="space-y-2 text-slate-400">
            <li>
              <button
                type="button"
                onClick={() =>
                  openPolicyModal('Buyer Protection Escrow Policy', 'protection', [
                    'Our Escrow Service holds client payment securely in third-party bank escrow until the goods are received and verified at your workshop or delivery address.',
                    'If items do not match advertised OEM dimensions or fail to dispatch by the promised date, full refunds are processed automatically.',
                  ])
                }
                className="hover:text-[#ff8533] transition-colors cursor-pointer text-left"
              >
                Buyer Protection Escrow
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() =>
                  openPolicyModal('Production Quality Inspection Standards', 'protection', [
                    'All automotive parts manufacturers are audited annually under ISO 9001 and IATF 16949 automotive standards.',
                    'Critical tolerance items (calipers, pistons, electronic sensors, wheel bearings) undergo 100% video caliper and pressure testing before outbound packaging.',
                  ])
                }
                className="hover:text-[#ff8533] transition-colors cursor-pointer text-left"
              >
                Production Quality Inspection
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() =>
                  openPolicyModal('100% Vehicle Fitment Guarantee', 'protection', [
                    'When you enter your vehicle’s Year, Make, Model, or 17-digit VIN, our compatibility engine cross-references OEM interchange numbers.',
                    'If a part confirmed as compatible fails to fit your car, return shipping is fully covered by our guarantee.',
                  ])
                }
                className="hover:text-[#ff8533] transition-colors cursor-pointer text-left"
              >
                Vehicle Compatibility Guarantee
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() =>
                  openPolicyModal('On-Time Dispatch SLA & Delay Compensation', 'protection', [
                    'Every listing displays an exact dispatch window (e.g. 2–5 days or Ready to Ship < 48 hours).',
                    'If a factory fails to provide tracking within the committed timeline, a 10% late voucher is automatically credited to your order balance.',
                  ])
                }
                className="hover:text-[#ff8533] transition-colors cursor-pointer text-left"
              >
                Dispatch Delay Compensation
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() =>
                  openPolicyModal('Refund Policy & Dispute Resolution', 'protection', [
                    'You have 30 calendar days from delivery to inspect and test parts. Initiate a claim in your Orders tab with photos for expedited mediation.',
                    'Disputes are resolved within 48 business hours by our dedicated automotive engineering arbitration desk.',
                  ])
                }
                className="hover:text-[#ff8533] transition-colors cursor-pointer text-left"
              >
                Refund Policy & Disputes
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-white text-sm uppercase tracking-wider mb-3">
            Payment & Verification
          </h4>
          <ul className="space-y-2 text-slate-400">
            <li>
              <button
                type="button"
                onClick={() =>
                  openPolicyModal('Direct Payment Request Workflow', 'payment', [
                    'Every payment method you choose, the information of the payment method is sent to you via email from our finance desk (apexparts45@gmail.com).',
                    'Once your request is received, payment coordinates for your selected provider are transmitted to your registered email address.',
                  ])
                }
                className="hover:text-[#ff8533] transition-colors cursor-pointer text-left"
              >
                Payment Request Workflow
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() =>
                  openPolicyModal('Supported Payment Channels', 'payment', [
                    'We support PayPal (Goods & Services with Buyer Protection), Venmo, Zelle instant bank transfer, Apple Pay and Google Pay.',
                    'Select your preferred provider at checkout to receive tailored payment coordinates.',
                  ])
                }
                className="hover:text-[#ff8533] transition-colors cursor-pointer text-left"
              >
                Supported Payment Methods
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() =>
                  openPolicyModal('Proof Screenshot Verification', 'payment', [
                    'After completing the transfer via your chosen provider, upload a transaction screenshot.',
                    'Our backend verifies payment authenticity and automatically generates your downloadable, printable commercial invoice with barcode.',
                  ])
                }
                className="hover:text-[#ff8533] transition-colors cursor-pointer text-left"
              >
                Screenshot Verification & Receipt
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={onOpenPartRequest}
                className="text-[#ff8533] hover:underline font-semibold cursor-pointer text-left flex items-center gap-1"
              >
                <span>Request for Quotation (RFQ)</span>
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-white text-sm uppercase tracking-wider mb-3">
            {t.footerColAcceptedPay}
          </h4>
          <p className="text-slate-400 mb-3 text-[11px]">
            Verified settlement & instant receipt generation:
          </p>
          <div className="flex flex-wrap gap-2 text-[10px] font-mono font-bold text-slate-300">
            <span
              onClick={() =>
                openPolicyModal('PayPal', 'payment', [
                  'PayPal buyer protection supported for all verified customer orders.',
                ])
              }
              className="bg-slate-800 border border-slate-700 px-2.5 py-1 rounded cursor-pointer hover:border-[#ff6600] text-sky-400 font-semibold"
            >
              PayPal
            </span>
            <span
              onClick={() =>
                openPolicyModal('Venmo', 'payment', [
                  'Fast, secure Venmo payments direct to verified ApexParts merchant coordinates.',
                ])
              }
              className="bg-slate-800 border border-slate-700 px-2.5 py-1 rounded cursor-pointer hover:border-[#ff6600] text-blue-400 font-semibold"
            >
              Venmo
            </span>
            <span
              onClick={() =>
                openPolicyModal('Zelle', 'payment', [
                  'Direct zero-fee bank transfer with instant confirmation via Zelle.',
                ])
              }
              className="bg-slate-800 border border-slate-700 px-2.5 py-1 rounded cursor-pointer hover:border-[#ff6600] text-purple-400 font-semibold"
            >
              Zelle
            </span>
            <span
              onClick={() =>
                openPolicyModal('Apple Pay', 'payment', [
                  'Biometric authentication and Apple Cash support for iOS and Mac clients.',
                ])
              }
              className="bg-slate-800 border border-slate-700 px-2.5 py-1 rounded cursor-pointer hover:border-[#ff6600] text-white font-semibold"
            >
              Apple Pay
            </span>
            <span
              onClick={() =>
                openPolicyModal('Google Pay', 'payment', [
                  'One-touch Google Pay settlement with tokenized device security.',
                ])
              }
              className="bg-slate-800 border border-slate-700 px-2.5 py-1 rounded cursor-pointer hover:border-[#ff6600] text-emerald-400 font-semibold"
            >
              Google Pay
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Legal & Copyright */}
      <div className="bg-[#14181c] py-4 border-t border-slate-800/80 text-center text-[11px] text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            {t.allRightsReserved}
          </span>
          <div className="flex items-center gap-4">
            <button
              onClick={() =>
                openPolicyModal('Privacy Policy', 'legal', [
                  'ApexParts Global respects your confidentiality. Customer information, shipping details, and vehicle VIN numbers are encrypted and strictly used for order fulfillment and customs clearance.',
                  'We do not sell or rent customer data to third-party marketing firms.',
                ])
              }
              className="hover:text-slate-300 cursor-pointer"
            >
              {t.privacyPolicy}
            </button>
            <button
              onClick={() =>
                openPolicyModal('Terms of Sourcing & Supply', 'legal', [
                  'All parts are manufactured according to standard international automotive tolerances.',
                  'Buyers agree to verify part fitment using OEM part codes or VIN match prior to installation.',
                ])
              }
              className="hover:text-slate-300 cursor-pointer"
            >
              {t.termsSourcing}
            </button>
            <button
              onClick={() =>
                openPolicyModal('OEM Certification Standards', 'legal', [
                  'Our components meet or exceed original equipment manufacturer dimensional and metallurgical specifications.',
                  'Each production batch undergoes tensile, hardness, and thermal endurance testing.',
                ])
              }
              className="hover:text-slate-300 cursor-pointer"
            >
              {t.oemStandards}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
