import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Send,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  Copy,
  Check,
  Mail,
  ExternalLink,
  X,
  Sparkles,
} from 'lucide-react';
import { PartRequest } from '../types';
import { useTranslation } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const ADMIN_PAYMENT_EMAIL = 'apexparts45@gmail.com';

interface PartRequestSectionProps {
  onSubmitted?: (request: PartRequest) => void;
}

export const PartRequestSection: React.FC<PartRequestSectionProps> = ({ onSubmitted }) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [year, setYear] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [trimEngine, setTrimEngine] = useState('');
  const [vin, setVin] = useState('');
  const [partName, setPartName] = useState('');
  const [oemNumber, setOemNumber] = useState('');
  const [condition, setCondition] = useState('OEM Genuine');
  const [quantity, setQuantity] = useState(1);
  const [targetBudget, setTargetBudget] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [urgency, setUrgency] = useState<PartRequest['urgency']>('Standard (24-48h)');
  const [notes, setNotes] = useState('');

  // Auto-fill from authenticated user if available
  useEffect(() => {
    if (user) {
      if (user.email && !email) setEmail(user.email);
      if (user.phoneNumber && !phone) setPhone(user.phoneNumber);
    }
  }, [user]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState<PartRequest | null>(null);
  const [showAutomatedModal, setShowAutomatedModal] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const effectiveClientEmail = (email || user?.email || '').trim();

  // Generate automated message content
  const generateAutomatedMessage = (req: PartRequest) => {
    const subject = `ApexParts Sourcing Request (RFQ #${req.id}): ${req.partName} for ${req.year || ''} ${req.make || ''} ${req.model || ''} ${req.trimEngine || ''}`.trim();

    const body = `Hello ApexParts Operations Desk,

I am requesting a sourcing quotation for the following automotive precision component:

==================================================
SOURCING REQUEST DETAILS (RFQ #${req.id})
==================================================
• Vehicle Year: ${req.year || 'N/A'}
• Vehicle Make / Brand: ${req.make || 'N/A'}
• Vehicle Model: ${req.model || 'N/A'}
• Trim or Engine: ${req.trimEngine || 'N/A'}
• VIN (Chassis): ${req.vin || 'Not provided'}
• Part Name / Component: ${req.partName}
• OEM Reference Number: ${req.oemNumber || 'Not provided'}
• Desired Condition: ${req.condition}
• Target Quantity: ${req.quantity} units
• Target Budget: ${req.targetBudget || 'Best Available Quote'}
• Sourcing Urgency: ${req.urgency}

==================================================
CLIENT SENDER DETAILS
==================================================
• Client Email: ${req.email}
• Client Phone / WhatsApp: ${req.phone || 'Not provided'}
• Technical Specifications & Notes:
${req.notes || 'No additional notes provided.'}

==================================================
ACTION REQUIRED:
Please dispatch available factory quotes, dimensional specifications, and estimated transit lead time directly to my email: ${req.email}.

Best regards,
ApexParts Sourcing Client
${req.email}`;

    return { subject, body };
  };

  const automatedData = submittedRequest ? generateAutomatedMessage(submittedRequest) : null;
  const gmailComposeUrl = automatedData
    ? `https://mail.google.com/mail/?view=cm&fs=1&to=${ADMIN_PAYMENT_EMAIL}&su=${encodeURIComponent(
        automatedData.subject
      )}&body=${encodeURIComponent(automatedData.body)}`
    : '#';

  const mailtoUrl = automatedData
    ? `mailto:${ADMIN_PAYMENT_EMAIL}?subject=${encodeURIComponent(
        automatedData.subject
      )}&body=${encodeURIComponent(automatedData.body)}`
    : '#';

  const handleCopyMessage = () => {
    if (!automatedData) return;
    navigator.clipboard.writeText(automatedData.body);
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!partName.trim()) {
      setErrorMsg('Please specify the name or description of the car part you need.');
      return;
    }
    if (!effectiveClientEmail || !effectiveClientEmail.includes('@')) {
      setErrorMsg('Please provide a valid client email address so suppliers can send quotes.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await api.submitRfq({
        year: year.trim() || undefined,
        make: make.trim() || undefined,
        model: model.trim() || undefined,
        trimEngine: trimEngine.trim() || undefined,
        vin: vin.trim() || undefined,
        partName: partName.trim(),
        oemNumber: oemNumber.trim() || undefined,
        condition,
        quantity: Math.max(1, quantity),
        targetBudget: targetBudget.trim() || undefined,
        email: effectiveClientEmail,
        phone: phone.trim() || undefined,
        urgency,
        notes: notes.trim() || undefined,
      });

      setIsSubmitting(false);

      if (result.success && result.rfq) {
        setSubmittedRequest(result.rfq);
        setShowAutomatedModal(true);
        if (onSubmitted) onSubmitted(result.rfq);
      } else if (result.error) {
        setErrorMsg(result.error);
      } else {
        // Fallback local RFQ
        const fallbackReq: PartRequest = {
          id: `RFQ-${Math.floor(100000 + Math.random() * 900000)}`,
          createdAt: 'Just now',
          year: year.trim(),
          make: make.trim(),
          model: model.trim(),
          trimEngine: trimEngine.trim() || undefined,
          vin: vin.trim() || undefined,
          partName: partName.trim(),
          oemNumber: oemNumber.trim() || undefined,
          condition,
          quantity: Math.max(1, quantity),
          targetBudget: targetBudget.trim() || undefined,
          email: effectiveClientEmail,
          phone: phone.trim(),
          urgency,
          notes: notes.trim() || undefined,
          status: 'Received - Sourcing Factories',
        };
        setSubmittedRequest(fallbackReq);
        setShowAutomatedModal(true);
        if (onSubmitted) onSubmitted(fallbackReq);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(
        `There was an error while sending the information to ${ADMIN_PAYMENT_EMAIL}. Please re-input the information and try again.`
      );
    }
  };

  const handleReset = () => {
    setSubmittedRequest(null);
    setShowAutomatedModal(false);
    setPartName('');
    setOemNumber('');
    setTrimEngine('');
    setTargetBudget('');
    setNotes('');
    setVin('');
  };

  return (
    <section id="custom-part-request" className="w-full my-8 scroll-mt-24">
      <div className="bg-linear-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl text-white">
        <div className="p-6 sm:p-8 lg:p-10">
          <div className="max-w-3xl mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ff6600]/20 text-[#ff8533] text-xs font-semibold mb-3 border border-[#ff6600]/30">
              <Wrench className="w-3.5 h-3.5" />
              <span>{t.rfqTag || 'Custom Manufacturing & Sourcing'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {t.rfqTitle || 'Request for Quotation (RFQ)'}
            </h2>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              {t.rfqDesc ||
                'Cannot find your precision component or need custom-tolerance manufacturing? Submit your vehicle specs below. Sourcing requests are automatically dispatched to apexparts45@gmail.com and our network of audited foundries.'}
            </p>
          </div>

          {submittedRequest ? (
            /* Success confirmation card */
            <div className="bg-slate-800/80 border border-emerald-500/40 rounded-xl p-6 sm:p-8 text-center max-w-2xl mx-auto space-y-4">
              <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  {t.rfqSubmittedTitle || 'Sourcing Request Dispatched Successfully!'}
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Request has been routed to{' '}
                  <strong className="text-white font-mono">{ADMIN_PAYMENT_EMAIL}</strong> · Reference:{' '}
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    {submittedRequest.id}
                  </span>
                </p>
              </div>

              <div className="bg-slate-900/90 rounded-lg p-4 border border-slate-700 text-xs text-left space-y-2 text-slate-300">
                <p>
                  <strong className="text-white">Requested Part:</strong> {submittedRequest.partName}
                </p>
                <p>
                  <strong className="text-white">Vehicle:</strong> {submittedRequest.year || ''}{' '}
                  {submittedRequest.make || ''} {submittedRequest.model || ''}{' '}
                  {submittedRequest.trimEngine ? `(${submittedRequest.trimEngine})` : ''}
                </p>
                {submittedRequest.oemNumber && (
                  <p>
                    <strong className="text-white">OEM Reference:</strong> {submittedRequest.oemNumber}
                  </p>
                )}
                {submittedRequest.vin && (
                  <p>
                    <strong className="text-white">VIN:</strong> {submittedRequest.vin}
                  </p>
                )}
                <p>
                  <strong className="text-white">Quantity:</strong> {submittedRequest.quantity} units ·{' '}
                  <strong className="text-white">Condition:</strong> {submittedRequest.condition}
                </p>
                {submittedRequest.targetBudget && (
                  <p>
                    <strong className="text-white">Target Budget:</strong> {submittedRequest.targetBudget}
                  </p>
                )}
                <p>
                  <strong className="text-white">Client Email:</strong> {submittedRequest.email}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAutomatedModal(true)}
                  className="px-4 py-2 bg-[#EA4335] hover:bg-[#d93829] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>View / Send Automated Message via Gmail</span>
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  {t.submitAnotherRfq || 'Submit Another Sourcing Request'}
                </button>
              </div>
            </div>
          ) : (
            /* Interactive RFQ Form */
            <form onSubmit={handleSubmit} className="bg-slate-800/60 p-5 sm:p-7 rounded-xl border border-slate-700/80">
              {/* Notice Banner */}
              <div className="p-3 bg-slate-900/80 border border-slate-700 rounded-lg text-xs text-slate-300 mb-5 flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-[#ff6600] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  When you submit this request, your exact vehicle specifications and component requirements will be automatically dispatched to{' '}
                  <strong className="text-white font-mono">apexparts45@gmail.com</strong>. You will also receive an automated message formatted for your Gmail.
                </p>
              </div>

              {/* Row 1: Vehicle Year, Make, Model, Trim or Engine */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs mb-4">
                {/* Vehicle Year */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {t.vehicleYear || 'Vehicle Year'}
                  </label>
                  <input
                    type="text"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder={t.placeholderYear || 'e.g. 2023'}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-hidden focus:border-[#ff6600] placeholder:text-slate-500"
                  />
                </div>

                {/* Vehicle Make / Brand */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {t.makeBrand || 'Make / Brand'}
                  </label>
                  <input
                    type="text"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    placeholder={t.placeholderMake || 'e.g. Toyota, BMW, Ford'}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-hidden focus:border-[#ff6600] placeholder:text-slate-500"
                  />
                </div>

                {/* Vehicle Model */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {t.modelTrim || 'Model'}
                  </label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder={t.placeholderModel || 'e.g. Camry, M3, F-150'}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-hidden focus:border-[#ff6600] placeholder:text-slate-500"
                  />
                </div>

                {/* Trim or Engine */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Trim or Engine
                  </label>
                  <input
                    type="text"
                    value={trimEngine}
                    onChange={(e) => setTrimEngine(e.target.value)}
                    placeholder={t.placeholderTrim || 'e.g. XSE 2.5L / 3.0L Turbo'}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-hidden focus:border-[#ff6600] placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Row 2: Part Name and OEM Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-4">
                {/* Part Name */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {t.partNameReq || 'Part Name / Description'} <span className="text-[#ff6600]">*</span>
                  </label>
                  <input
                    type="text"
                    value={partName}
                    onChange={(e) => setPartName(e.target.value)}
                    placeholder={t.placeholderPartName || 'e.g. Rear Subframe Bushing, Fuel Rail Sensor...'}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-hidden focus:border-[#ff6600] placeholder:text-slate-500"
                  />
                </div>

                {/* OEM Part Number */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {t.oemNumberOptional || 'OEM Part Number (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={oemNumber}
                    onChange={(e) => setOemNumber(e.target.value)}
                    placeholder={t.placeholderOem || 'e.g. 11115-28040, 04465-33450'}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-hidden focus:border-[#ff6600] placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Row 3: VIN, Quantity, Condition, Target Budget, Urgency */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs mb-4">
                {/* VIN Number */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {t.vinOptional || 'VIN (17-Digit)'}
                  </label>
                  <input
                    type="text"
                    maxLength={17}
                    value={vin}
                    onChange={(e) => setVin(e.target.value.toUpperCase())}
                    placeholder={t.placeholderVin || '17-Digit VIN'}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono uppercase focus:outline-hidden focus:border-[#ff6600] placeholder:text-slate-500"
                  />
                </div>

                {/* Target Quantity */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {t.targetQuantity || 'Target Quantity'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-hidden focus:border-[#ff6600]"
                  />
                </div>

                {/* Condition */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {t.desiredCondition || 'Condition'}
                  </label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-hidden focus:border-[#ff6600]"
                  >
                    <option value="OEM Genuine">{t.condOem || 'OEM Genuine'}</option>
                    <option value="Aftermarket Heavy-Duty">{t.condAftermarket || 'Aftermarket Heavy-Duty'}</option>
                    <option value="Performance Racing">{t.condRacing || 'Performance Racing'}</option>
                    <option value="Remanufactured / Rebuilt">Remanufactured / Rebuilt</option>
                  </select>
                </div>

                {/* Target Budget */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Target Budget
                  </label>
                  <input
                    type="text"
                    value={targetBudget}
                    onChange={(e) => setTargetBudget(e.target.value)}
                    placeholder={t.placeholderTargetPrice || 'e.g. $250 USD'}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-hidden focus:border-[#ff6600] placeholder:text-slate-500"
                  />
                </div>

                {/* Urgency */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {t.sourcingUrgency || 'Urgency'}
                  </label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as PartRequest['urgency'])}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-hidden focus:border-[#ff6600]"
                  >
                    <option value="Standard (24-48h)">Standard (24-48h)</option>
                    <option value="Urgent (Within 4h)">Urgent (Within 4h)</option>
                    <option value="Immediate Sourcing">Immediate Sourcing</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Client Email and Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-4">
                {/* Contact Email */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {t.yourEmail || 'Your Email'} <span className="text-[#ff6600]">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.placeholderEmail || 'your.email@domain.com'}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-hidden focus:border-[#ff6600] placeholder:text-slate-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    This email is used as the sender and destination for factory quotations.
                  </p>
                </div>

                {/* Contact Phone */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {t.phoneWhatsapp || 'Phone / WhatsApp (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t.placeholderPhone || '+1 (xxx) xxx-xxxx'}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-hidden focus:border-[#ff6600] placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Technical Notes / Specs */}
              <div className="text-xs mb-4">
                <label className="block text-slate-300 font-semibold mb-1">
                  {t.techNotes || 'Technical Notes / Dimensions / Tolerances'}
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t.placeholderNotes || 'Include thread size, dimensions, or manufacturer preferences...'}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-hidden focus:border-[#ff6600] placeholder:text-slate-500"
                />
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-950/80 border border-red-700 rounded-lg text-xs text-red-200 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <ShieldCheck className="w-4 h-4 text-[#ff8533]" />
                  <span>Sourcing request routes to {ADMIN_PAYMENT_EMAIL} and verified foundries</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-3 bg-[#ff6600] hover:bg-[#e65c00] active:bg-[#cc5200] disabled:bg-slate-600 text-white font-bold text-xs sm:text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Broadcasting to Foundries & Notifying {ADMIN_PAYMENT_EMAIL}...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{t.submitRfqBtn || 'Submit Sourcing Request'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* AUTOMATED GMAIL POP-UP MODAL */}
      {showAutomatedModal && submittedRequest && automatedData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
            onClick={() => setShowAutomatedModal(false)}
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden z-10 my-auto border border-slate-300 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EA4335] text-white flex items-center justify-center shadow-xs">
                  <Mail className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight flex items-center gap-2">
                    Automated Sourcing Request Message
                    <span className="bg-[#ff6600]/20 text-[#ff8533] text-[10px] px-2 py-0.5 rounded-full font-mono font-medium">
                      Ready to Send
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Prepared for delivery from your Gmail to{' '}
                    <strong className="text-white font-mono">{ADMIN_PAYMENT_EMAIL}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAutomatedModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs text-slate-800">
              {/* Status Banner */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950 flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-xs">
                    Sourcing Request Dispatched to {ADMIN_PAYMENT_EMAIL}
                  </p>
                  <p className="text-[11px] text-slate-700 leading-relaxed">
                    1. A direct sourcing alert has been transmitted to <strong className="font-mono text-slate-900">{ADMIN_PAYMENT_EMAIL}</strong>.<br />
                    2. You can also send the prepared email below using your Gmail account or copy the message.<br />
                    3. Quotations and manufacturing schedules will be delivered directly to your inbox (<strong className="font-mono text-slate-900">{submittedRequest.email}</strong>).
                  </p>
                </div>
              </div>

              {/* Routing metadata card */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2 text-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Recipient Desk:</span>
                  <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {ADMIN_PAYMENT_EMAIL}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Client / Sender Email:</span>
                  <span className="font-mono font-bold text-[#ff6600] bg-white px-2 py-0.5 rounded border border-slate-200">
                    {submittedRequest.email}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500 font-medium shrink-0">Subject:</span>
                  <span className="font-medium text-slate-800 text-right text-[11px] truncate">
                    {automatedData.subject}
                  </span>
                </div>
              </div>

              {/* Message Content Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                    Automated Sourcing Content:
                  </label>
                  <button
                    type="button"
                    onClick={handleCopyMessage}
                    className="text-[11px] text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {emailCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Text</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="relative">
                  <textarea
                    readOnly
                    value={automatedData.body}
                    rows={11}
                    className="w-full bg-slate-900 text-slate-100 font-mono text-[11px] leading-relaxed p-3.5 rounded-lg border border-slate-800 focus:outline-hidden resize-none selection:bg-[#ff6600] selection:text-white"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-1">
                <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                  Choose How to Send:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Send via Gmail */}
                  <a
                    href={gmailComposeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      try {
                        window.open(gmailComposeUrl, '_blank', 'noopener,noreferrer');
                      } catch {}
                    }}
                    className="flex items-center justify-center gap-2 p-2.5 bg-[#EA4335] hover:bg-[#d93829] text-white rounded-lg font-bold text-xs shadow-xs transition-colors cursor-pointer text-center"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Send via Gmail</span>
                    <ExternalLink className="w-3 h-3 opacity-80" />
                  </a>

                  {/* Default Mail App */}
                  <a
                    href={mailtoUrl}
                    className="flex items-center justify-center gap-2 p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer text-center"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Default Mail App</span>
                  </a>

                  {/* Copy Text */}
                  <button
                    type="button"
                    onClick={handleCopyMessage}
                    className="flex items-center justify-center gap-2 p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold text-xs border border-slate-300 transition-colors cursor-pointer text-center"
                  >
                    <Copy className="w-4 h-4" />
                    <span>{emailCopied ? 'Copied!' : 'Copy Message'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Official Sourcing Desk: <strong className="font-mono text-slate-700">{ADMIN_PAYMENT_EMAIL}</strong>
              </span>
              <button
                type="button"
                onClick={() => setShowAutomatedModal(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
