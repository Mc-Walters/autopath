import React, { useState } from 'react';
import {
  X,
  HelpCircle,
  ShieldCheck,
  Truck,
  RotateCcw,
  MessageSquare,
  Search,
  ChevronDown,
  ChevronRight,
  FileText,
  PhoneCall,
  Mail,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';

interface HelpCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestCustomPart?: () => void;
}

export const HelpCenterModal: React.FC<HelpCenterModalProps> = ({
  isOpen,
  onClose,
  onRequestCustomPart,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'faq' | 'payment' | 'shipping' | 'returns' | 'contact'>('faq');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Contact form
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSent, setContactSent] = useState(false);

  if (!isOpen) return null;

  const faqs = [
    {
      q: 'How does the payment process work on ApexParts?',
      a: 'When you place an order, choose your preferred payment method: PayPal, Venmo, Zelle, Apple Pay, or Google Pay. A direct payment request is immediately transmitted to our finance operations team at apexparts45@gmail.com. Specific payment coordinates and instructions for your selected channel will be dispatched directly to your registered email.',
    },
    {
      q: 'What do I do after sending money to the payment address?',
      a: 'After transferring funds through your chosen payment provider out of the system, take a screenshot of your payment confirmation. Upload this screenshot in your order window or via "Pending Orders" in the top navigation bar. Our verification engine validates the payment details, marks your order as "Payment Verified", and issues your official downloadable and printable commercial invoice with barcode.',
    },
    {
      q: 'Where do I find my pending orders and payment status?',
      a: 'Click "Pending Orders" in the top navigation bar. Every order whose payment screenshot has not been verified yet is listed there; click an order to return to its payment page and upload your screenshot. Once the payment is verified as successful, the order leaves Pending Orders and appears under "Payment History" with its official receipt.',
    },
    {
      q: 'How does custom automotive part sourcing (RFQ) work?',
      a: 'If a component is not in our standard catalog, fill out the "Request Custom Part" sourcing form with your vehicle Year, Make, Model, Trim or Engine, Part Name, and optional OEM or VIN. Your sourcing request is sent directly to apexparts45@gmail.com, and an automated Gmail message is generated so you can track the communication directly from your personal inbox.',
    },
    {
      q: 'How do minimum order quantities (MOQ) and tier discounts work?',
      a: 'Each component lists its factory MOQ. Micro-parts like nylon clips or copper crush washers are sold in small packs (e.g. 20–50 pcs) for factory wholesale pricing. Assemblies like calipers or turbos have an MOQ of 1. Wholesale tier discounts (5% to 15% off) are automatically applied at higher volume quantities.',
    },
    {
      q: 'What shipping carriers are used for delivery?',
      a: 'We partner with DHL Express (3–5 business days), Standard Air Cargo (7–10 days), and Ocean Freight Pallet lines (20–30 days for heavy assemblies like engines and transmissions). Live tracking numbers are updated in your order dashboard upon carrier handover.',
    },
  ];

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactEmail || !contactMessage) return;
    setContactSent(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl overflow-hidden z-10 my-auto border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#ff6600] flex items-center justify-center text-white">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{t.helpCenterTitle}</h2>
              <p className="text-[11px] text-slate-400">
                {t.helpCenterSubtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-100 px-5 pt-3 border-b border-slate-200 flex gap-2 shrink-0 overflow-x-auto no-scrollbar text-xs font-semibold">
          <button
            onClick={() => setActiveTab('faq')}
            className={`pb-2.5 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'faq'
                ? 'border-[#ff6600] text-[#ff6600]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.tabFaq}
          </button>
          <button
            onClick={() => setActiveTab('payment')}
            className={`pb-2.5 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'payment'
                ? 'border-[#ff6600] text-[#ff6600]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Payment & Verification
          </button>
          <button
            onClick={() => setActiveTab('shipping')}
            className={`pb-2.5 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'shipping'
                ? 'border-[#ff6600] text-[#ff6600]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.tabShipping}
          </button>
          <button
            onClick={() => setActiveTab('returns')}
            className={`pb-2.5 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'returns'
                ? 'border-[#ff6600] text-[#ff6600]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.tabReturns}
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            className={`pb-2.5 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'contact'
                ? 'border-[#ff6600] text-[#ff6600]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.tabContact}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 text-xs text-slate-700 bg-slate-50/50">
          {/* FAQ Tab */}
          {activeTab === 'faq' && (
            <div className="space-y-3">
              {faqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className="bg-white border border-slate-200 rounded-lg overflow-hidden transition-all shadow-2xs"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full text-left p-3.5 flex items-center justify-between gap-3 font-bold text-slate-900 hover:text-[#ff6600] transition-colors"
                    >
                      <span className="text-xs sm:text-sm">{faq.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                          isOpen ? 'rotate-180 text-[#ff6600]' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-3.5 pb-3.5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-2 bg-slate-50/50">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#ff6600] shrink-0" />
                  <div>
                    <p className="font-bold text-slate-900">Looking for a custom manufactured car part?</p>
                    <p className="text-[11px] text-slate-600">
                      Submit an RFQ with your vehicle specifications.
                    </p>
                  </div>
                </div>
                {onRequestCustomPart && (
                  <button
                    onClick={() => {
                      onClose();
                      onRequestCustomPart();
                    }}
                    className="px-3 py-1.5 bg-[#ff6600] text-white font-bold rounded text-xs whitespace-nowrap shadow-xs hover:bg-[#e65c00]"
                  >
                    Request a Part (RFQ)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Payment & Verification Tab */}
          {activeTab === 'payment' && (
            <div className="space-y-4">
              <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <ShieldCheck className="w-5 h-5 text-[#ff6600]" />
                  <span>Direct Email Payment Workflow</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Every payment method you choose, the information of the payment method is sent to you via email from our finance desk at{' '}
                  <strong className="text-slate-900">apexparts45@gmail.com</strong>. The payment request is automatically transmitted when you click order.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <strong className="text-slate-900 block mb-1">Supported Channels</strong>
                  <p className="text-slate-500">
                    PayPal (Buyer Protected), Venmo, Zelle instant bank transfer, Apple Pay and Google Pay.
                  </p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <strong className="text-slate-900 block mb-1">Pending Orders Tracker</strong>
                  <p className="text-slate-500">
                    Unpaid orders stay in the "Pending Orders" button in the top navbar until your payment screenshot is verified. Paid orders move to "Payment History".
                  </p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <strong className="text-slate-900 block mb-1">Proof Screenshot OCR</strong>
                  <p className="text-slate-500">
                    Upload your payment transfer screenshot. Our OCR verification automatically validates transaction coordinates and unlocks your invoice.
                  </p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <strong className="text-slate-900 block mb-1">Printable Commercial Invoice</strong>
                  <p className="text-slate-500">
                    Download and print authentic receipts complete with barcode, itemized price tiers, and customs declaration numbers.
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-orange-50 border border-orange-200 rounded-lg text-slate-700">
                <p className="font-bold text-slate-900 text-xs">Need instant payment assistance?</p>
                <p className="text-[11px] mt-0.5">
                  Direct inquiries regarding wire verification or merchant coordinates should be directed to{' '}
                  <a href="mailto:apexparts45@gmail.com" className="text-[#ff6600] font-semibold underline">
                    apexparts45@gmail.com
                  </a>.
                </p>
              </div>
            </div>
          )}

          {/* Shipping & Logistics Tab */}
          {activeTab === 'shipping' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-white border border-slate-200 rounded-lg text-center">
                  <Truck className="w-6 h-6 text-[#ff6600] mx-auto mb-2" />
                  <p className="font-bold text-slate-900 text-sm">DHL Express</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">3 – 5 Business Days</p>
                  <p className="text-[10px] text-slate-400 mt-2">Best for fasteners, sensors, and spark plugs.</p>
                </div>
                <div className="p-4 bg-white border border-slate-200 rounded-lg text-center">
                  <Truck className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <p className="font-bold text-slate-900 text-sm">Standard Air Cargo</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">7 – 10 Business Days</p>
                  <p className="text-[10px] text-slate-400 mt-2">Optimal balance for brake rotors and calipers.</p>
                </div>
                <div className="p-4 bg-white border border-slate-200 rounded-lg text-center">
                  <Truck className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                  <p className="font-bold text-slate-900 text-sm">Ocean Freight Pallet</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">20 – 30 Days</p>
                  <p className="text-[10px] text-slate-400 mt-2">Heavy wholesale lots, engine blocks, tires.</p>
                </div>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-2 leading-relaxed">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                  Customs Clearance & Export Documentation
                </h4>
                <p className="text-slate-600">
                  All international shipments include verified commercial invoices, HS commodity code declarations, and manufacturer Certificates of Origin (COO). Our logistics team manages export customs clearance to prevent port demurrage delays.
                </p>
              </div>
            </div>
          )}

          {/* Returns & Protection Tab */}
          {activeTab === 'returns' && (
            <div className="space-y-4">
              <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-emerald-700 font-bold">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>100% Fitment & Defect Guarantee</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  If an automotive component arrives damaged, out-of-spec, or fails dimensional tolerances compared to the listed OEM specifications, you are eligible for an immediate full refund or complimentary express replacement under our Buyer Protection Agreement.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <strong className="text-slate-900 block mb-1">30-Day Hassle-Free Returns</strong>
                  <p className="text-slate-500">
                    Unused parts in original factory packaging can be returned within 30 days of carrier delivery.
                  </p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <strong className="text-slate-900 block mb-1">Pre-Shipment Video Inspection</strong>
                  <p className="text-slate-500">
                    For high-value assemblies (turbos, calipers, forged wheels), factories record dimensional caliper verification before packing.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Contact Tab */}
          {activeTab === 'contact' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-900 text-white rounded-lg flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <Mail className="w-5 h-5 text-[#ff6600] shrink-0" />
                  <div>
                    <p className="font-bold">Official Operations Desk</p>
                    <p className="text-slate-400 text-[11px]">Orders, Payments & RFQ Sourcing</p>
                  </div>
                </div>
                <a
                  href="mailto:apexparts45@gmail.com"
                  className="font-mono text-[#ff8533] hover:underline font-bold text-xs bg-slate-800 px-2.5 py-1 rounded"
                >
                  apexparts45@gmail.com
                </a>
              </div>

              {contactSent ? (
                <div className="bg-white p-6 rounded-lg border border-emerald-300 text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-900">Support Ticket Dispatched!</h4>
                  <p className="text-slate-600">
                    Our technical automotive support desk has received your message. A specialist will reply to{' '}
                    <strong className="text-slate-900">{contactEmail}</strong> within 1 hour.
                  </p>
                  <button
                    onClick={() => {
                      setContactSent(false);
                      setContactMessage('');
                    }}
                    className="px-4 py-1.5 bg-[#ff6600] text-white text-xs font-bold rounded"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                    Direct Inquiry to Sourcing Engineers
                  </h4>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Your Email</label>
                    <input
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="buyer@domain.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 focus:outline-hidden focus:border-[#ff6600]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Topic / Order ID</label>
                    <input
                      type="text"
                      value={contactSubject}
                      onChange={(e) => setContactSubject(e.target.value)}
                      placeholder="e.g. Fitment question on 6-Piston Caliper / Order #ALB-12345"
                      className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 focus:outline-hidden focus:border-[#ff6600]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Message</label>
                    <textarea
                      rows={3}
                      required
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Describe what you need help with..."
                      className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 focus:outline-hidden focus:border-[#ff6600]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#ff6600] hover:bg-[#e65c00] text-white font-bold rounded flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send to Engineering Support Desk</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
