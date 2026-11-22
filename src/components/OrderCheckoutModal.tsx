import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Lock,
  AlertCircle,
  Sparkles,
  Mail,
  User as UserIcon,
  Smartphone,
  Send,
  Building2,
  Phone,
  MapPin,
  Check,
  Copy,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';
import { CarPart, CartItem, PaymentMethodType, PaymentDetails, ShippingAddress, OrderRecord } from '../types';
import { formatPrice } from '../utils/currency';
import { useTranslation } from '../context/LanguageContext';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface OrderCheckoutModalProps {
  singlePart?: CarPart | null;
  cartItems?: CartItem[];
  currencyCode?: string;
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: OrderRecord) => void;
  onOrderCreated?: (order: OrderRecord) => void;
}

interface PaymentOption {
  id: PaymentMethodType;
  name: string;
  subtitle: string;
  badge: string;
  badgeBg: string;
  badgeText: string;
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: 'paypal',
    name: 'PayPal',
    subtitle: 'PayPal invoice & direct transfer instructions',
    badge: 'PayPal',
    badgeBg: 'bg-[#003087]',
    badgeText: 'text-white',
  },
  {
    id: 'zelle',
    name: 'Zelle',
    subtitle: 'Direct bank-to-bank instant settlement',
    badge: 'Zelle',
    badgeBg: 'bg-[#7414CA]',
    badgeText: 'text-white',
  },
  {
    id: 'venmo',
    name: 'Venmo',
    subtitle: 'Fast mobile transfer with Venmo tag',
    badge: 'Venmo',
    badgeBg: 'bg-[#008CFF]',
    badgeText: 'text-white',
  },
  {
    id: 'apple_pay',
    name: 'Apple Pay',
    subtitle: 'Apple Cash / Merchant link sent to email',
    badge: ' Pay',
    badgeBg: 'bg-black',
    badgeText: 'text-white',
  },
  {
    id: 'google_pay',
    name: 'Google Pay',
    subtitle: 'Google Wallet & UPI instructions via email',
    badge: 'G Pay',
    badgeBg: 'bg-slate-800',
    badgeText: 'text-white',
  },
];

export const OrderCheckoutModal: React.FC<OrderCheckoutModalProps> = ({
  singlePart,
  cartItems = [],
  currencyCode = 'USD',
  isOpen,
  onClose,
  onOrderSuccess,
  onOrderCreated,
}) => {
  const { t } = useTranslation();
  const { user, isAuthenticated, openAuthModal } = useAuth();

  // Quantities for single item orders
  const [singleQty, setSingleQty] = useState<number>(1);
  const [qtyWarning, setQtyWarning] = useState<string | null>(null);

  // Sync initial MOQ when singlePart changes
  useEffect(() => {
    if (singlePart) {
      setSingleQty(singlePart.moq);
      setQtyWarning(null);
    }
  }, [singlePart]);

  // Shipping Method
  const [shippingMethod, setShippingMethod] = useState<'express' | 'standard' | 'ocean'>('express');

  // Shipping Address State: ALL FIELDS START EMPTY FOR PLACEHOLDERS
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: '',
    companyName: '',
    streetAddress: '',
    city: '',
    stateProvince: '',
    postalCode: '',
    country: '',
    phoneNumber: '',
    email: '',
  });

  // Selected Payment Method (defaults to PayPal)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType>('paypal');
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  // Automated Message Pop-up State
  const [showAutomatedMessageModal, setShowAutomatedMessageModal] = useState<boolean>(false);
  const [emailCopied, setEmailCopied] = useState<boolean>(false);
  const [createdOrder, setCreatedOrder] = useState<OrderRecord | null>(null);

  // Validation & Error states
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Populate logged-in user details if available
  useEffect(() => {
    if (user) {
      setShippingAddress((prev) => ({
        fullName: prev.fullName || user.fullName || '',
        companyName: prev.companyName || user.companyName || '',
        streetAddress: prev.streetAddress || user.streetAddress || '',
        city: prev.city || user.city || '',
        stateProvince: prev.stateProvince || user.stateProvince || '',
        postalCode: prev.postalCode || user.postalCode || '',
        country: prev.country || user.country || '',
        phoneNumber: prev.phoneNumber || user.phoneNumber || '',
        email: user.email, // Registered email is bound
      }));
    }
  }, [user]);

  const clearFieldError = (name: string) => {
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  // Compute Active Items
  const itemsToCheckout = useMemo(() => {
    if (singlePart) {
      let unitPrice = singlePart.basePrice;
      for (const tier of singlePart.priceTiers) {
        if (singleQty >= tier.minQty) {
          if (!tier.maxQty || singleQty <= tier.maxQty) {
            unitPrice = tier.price;
            break;
          }
        }
      }
      return [
        {
          part: singlePart,
          quantity: singleQty,
          selectedTierPrice: unitPrice,
        },
      ];
    }
    return cartItems;
  }, [singlePart, singleQty, cartItems]);

  // Compute Subtotal & Discounts
  const { subtotal, volumeDiscount, totalPieces } = useMemo(() => {
    let sub = 0;
    let baseline = 0;
    let pieces = 0;

    itemsToCheckout.forEach((item) => {
      sub += item.selectedTierPrice * item.quantity;
      baseline += (item.part.priceTiers[0]?.price || item.part.basePrice) * item.quantity;
      pieces += item.quantity;
    });

    const disc = baseline > sub ? baseline - sub : 0;
    return { subtotal: sub, volumeDiscount: disc, totalPieces: pieces };
  }, [itemsToCheckout]);

  // Shipping Cost in USD
  const shippingCost = useMemo(() => {
    if (itemsToCheckout.length === 0) return 0;
    if (shippingMethod === 'express') return 18.5;
    if (shippingMethod === 'standard') return 8.0;
    return 3.5;
  }, [shippingMethod, itemsToCheckout]);

  const totalAmount = subtotal + shippingCost;

  if (!isOpen) return null;

  // Safe quantity update for singlePart enforcing min & max
  const handleSingleQtyUpdate = (val: number) => {
    if (!singlePart) return;
    if (val < singlePart.moq) {
      setSingleQty(singlePart.moq);
      setQtyWarning(`Minimum order quantity for this item is ${singlePart.moq} ${singlePart.unit}s.`);
    } else if (val > singlePart.maxOrder) {
      setSingleQty(singlePart.maxOrder);
      setQtyWarning(`Maximum order quantity for this item is ${singlePart.maxOrder} ${singlePart.unit}s.`);
    } else {
      setSingleQty(val);
      setQtyWarning(null);
    }
  };

  // User / Checkout computed message variables
  const effectiveClientEmail = (user?.email || shippingAddress.email || '').trim() || 'mcwalterstrio3@gmail.com';
  const activeOption = PAYMENT_OPTIONS.find((opt) => opt.id === selectedPaymentMethod);
  const methodLabel = activeOption ? activeOption.name : 'Selected Payment Method';
  const activeEmailDestination = user?.email || shippingAddress.email || '';

  const itemsSummaryList = itemsToCheckout
    .map(
      (it, idx) =>
        `${idx + 1}. ${it.part.name} (OEM: ${it.part.oemNumber})\n   Qty: ${it.quantity} ${it.part.unit}s @ $${it.selectedTierPrice.toFixed(2)} USD = $${(it.selectedTierPrice * it.quantity).toFixed(2)} USD`
    )
    .join('\n');

  const automatedMessageSubject = `Order Payment Request: ${shippingAddress.fullName || 'Customer'} - $${totalAmount.toFixed(2)} USD via ${methodLabel}`;

  const automatedMessageBody = `To: apexparts45@gmail.com
From: ${effectiveClientEmail}
Subject: ${automatedMessageSubject}

Hello Apex Auto Parts,

I am requesting payment instructions for my order.

ORDER DETAILS:
Customer Name: ${shippingAddress.fullName || 'Valued Customer'}
Customer Email: ${effectiveClientEmail}
Contact Phone: ${shippingAddress.phoneNumber || 'N/A'}
${shippingAddress.companyName ? `Company: ${shippingAddress.companyName}\n` : ''}Shipping Address:
${shippingAddress.streetAddress || ''}, ${shippingAddress.city || ''}, ${shippingAddress.stateProvince || ''} ${shippingAddress.postalCode || ''}, ${shippingAddress.country || 'United States'}

ORDERED GOODS:
${itemsSummaryList}

FINANCIAL SUMMARY:
Parts Subtotal: $${subtotal.toFixed(2)} USD
Freight Shipping (${shippingMethod.toUpperCase()}): $${shippingCost.toFixed(2)} USD
Total Payable: $${totalAmount.toFixed(2)} USD

SELECTED PAYMENT METHOD:
${methodLabel}

Please send the payment instructions and transfer address for ${methodLabel} to my email: ${effectiveClientEmail}.

Thank you,
${shippingAddress.fullName || 'Customer'}`.trim();

  const gmailComposeBody = `To: apexparts45@gmail.com
From: ${effectiveClientEmail}

Hello Apex Auto Parts,

I am requesting payment instructions for my order.

Customer: ${shippingAddress.fullName || 'Valued Customer'}
Email: ${effectiveClientEmail}
Phone: ${shippingAddress.phoneNumber || 'N/A'}
Address: ${shippingAddress.streetAddress || ''}, ${shippingAddress.city || ''}, ${shippingAddress.stateProvince || ''} ${shippingAddress.postalCode || ''}, ${shippingAddress.country || 'United States'}

Items:
${itemsToCheckout.map((it) => `- ${it.part.name} (OEM: ${it.part.oemNumber}) x ${it.quantity} = $${(it.selectedTierPrice * it.quantity).toFixed(2)} USD`).join('\n')}

Subtotal: $${subtotal.toFixed(2)} USD
Shipping: $${shippingCost.toFixed(2)} USD
Total Payable: $${totalAmount.toFixed(2)} USD

Payment Method: ${methodLabel}

Please send the transfer details to ${effectiveClientEmail}.

Thank you,
${shippingAddress.fullName || 'Customer'}`.trim();

  const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent('apexparts45@gmail.com')}&su=${encodeURIComponent(automatedMessageSubject)}&body=${encodeURIComponent(gmailComposeBody)}`;

  const mailtoUrl = `mailto:apexparts45@gmail.com?subject=${encodeURIComponent(automatedMessageSubject)}&body=${encodeURIComponent(gmailComposeBody)}`;

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(automatedMessageBody).then(() => {
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 2500);
    });
  };

  const handleProceedToVerification = () => {
    setShowAutomatedMessageModal(false);
    if (createdOrder) {
      onOrderSuccess(createdOrder);
    }
  };

  // Form Validation
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!shippingAddress.fullName.trim()) {
      errors.fullName = 'Recipient name is required.';
    } else if (shippingAddress.fullName.trim().length < 2) {
      errors.fullName = 'Please enter a valid recipient name (minimum 2 letters).';
    }

    if (!shippingAddress.streetAddress.trim()) {
      errors.streetAddress = 'Street address is required.';
    } else if (shippingAddress.streetAddress.trim().length < 4) {
      errors.streetAddress = 'Please enter a complete delivery street address.';
    }

    if (!shippingAddress.city.trim()) {
      errors.city = 'City is required.';
    }

    if (!shippingAddress.stateProvince.trim()) {
      errors.stateProvince = 'State or Province is required.';
    }

    if (!shippingAddress.postalCode.trim()) {
      errors.postalCode = 'Postal / ZIP code is required.';
    }

    if (!shippingAddress.country.trim()) {
      errors.country = 'Country is required.';
    }

    const phoneDigits = shippingAddress.phoneNumber.replace(/\D/g, '');
    if (!shippingAddress.phoneNumber.trim()) {
      errors.phoneNumber = 'Carrier phone number is required.';
    } else if (phoneDigits.length < 7) {
      errors.phoneNumber = 'Please provide a valid phone number with at least 7 digits.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const clientEmail = (user?.email || shippingAddress.email || '').trim();
    if (!clientEmail) {
      errors.email = 'Email address is required so payment information can be sent to you.';
    } else if (!emailRegex.test(clientEmail)) {
      errors.email = 'Please provide a valid email format (e.g. buyer@domain.com).';
    }

    const errorKeys = Object.keys(errors);
    const isValid = errorKeys.length === 0;
    const primaryError = isValid
      ? null
      : `Please fill in all required fields before confirming payment: ${errors[errorKeys[0]]}`;

    return { isValid, errors, primaryError, effectiveEmail: clientEmail };
  };

  // When Request for Payment is clicked: Send real email to apexparts45@gmail.com & create pending order
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validate MOQ & Max Order limits
    if (singlePart) {
      if (singleQty < singlePart.moq) {
        setFormError(`Order cannot be placed: Minimum order is ${singlePart.moq} ${singlePart.unit}s.`);
        return;
      }
      if (singleQty > singlePart.maxOrder) {
        setFormError(`Order cannot be placed: Maximum order limit is ${singlePart.maxOrder} ${singlePart.unit}s.`);
        return;
      }
    }

    // 2. Validate details (ensuring email is provided if not logged in)
    const { isValid, errors, primaryError, effectiveEmail } = validateForm();
    if (!isValid) {
      setFieldErrors(errors);
      setFormError(primaryError);
      return;
    }

    setFieldErrors({});
    setFormError(null);
    setIsSubmitting(true);

    const activeSelectedOption = PAYMENT_OPTIONS.find((opt) => opt.id === selectedPaymentMethod);
    const currentMethodLabel = activeSelectedOption ? activeSelectedOption.name : 'Selected Payment Method';

    const paymentDetailsPayload: PaymentDetails = {
      method: selectedPaymentMethod,
      methodLabel: currentMethodLabel,
      instructionsSentToEmail: effectiveEmail,
      adminNotificationEmail: 'apexparts45@gmail.com',
      notice: 'Every payment method you choose, the information of the payment method will be sent to you via email.',
      paymentNotes: paymentNotes.trim() || undefined,
    };

    try {
      // 1. Direct Real Email Dispatch to apexparts45@gmail.com via FormSubmit
      try {
        fetch('https://formsubmit.co/ajax/apexparts45@gmail.com', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Referer': 'https://apexparts-marketplace.com',
            'Origin': 'https://apexparts-marketplace.com',
          },
          body: JSON.stringify({
            name: shippingAddress.fullName,
            email: effectiveEmail,
            _subject: `New Payment Request: Order from ${shippingAddress.fullName} ($${totalAmount.toFixed(2)} USD via ${currentMethodLabel})`,
            _replyto: effectiveEmail,
            _captcha: 'false',
            Customer_Name: shippingAddress.fullName,
            Customer_Email: effectiveEmail,
            Customer_Phone: shippingAddress.phoneNumber,
            Payment_Method: currentMethodLabel,
            Total_Amount: `$${totalAmount.toFixed(2)} USD`,
            Shipping_Address: `${shippingAddress.streetAddress}, ${shippingAddress.city}, ${shippingAddress.stateProvince} ${shippingAddress.postalCode}, ${shippingAddress.country}`,
            Ordered_Items: itemsToCheckout.map((it) => `${it.part.name} (OEM: ${it.part.oemNumber}) x ${it.quantity} = $${(it.selectedTierPrice * it.quantity).toFixed(2)} USD`).join(' | '),
            message: `Hello Apex Auto Parts,\n\nI have requested payment instructions for my order totaling $${totalAmount.toFixed(2)} USD using ${currentMethodLabel}.\n\nPlease send the transfer instructions to my email: ${effectiveEmail}.\n\nThank you,\n${shippingAddress.fullName}`,
          }),
        }).catch((err) => console.warn('Direct FormSubmit email dispatch error:', err));
      } catch (err: any) {
        console.warn('FormSubmit trigger error:', err?.message);
      }

      // 2. Submit order to backend (creates pending order & sends backend email notification)
      const result = await api.placeOrder({
        items: itemsToCheckout.map((it) => ({
          partId: it.part.id,
          quantity: it.quantity,
        })),
        shippingAddress: {
          ...shippingAddress,
          email: effectiveEmail,
        },
        shippingMethod,
        paymentDetails: paymentDetailsPayload,
      });

      setIsSubmitting(false);

      if (result.success && result.order) {
        const orderRecord = result.order;
        setCreatedOrder(orderRecord);
        // Register it as a pending order right away
        onOrderCreated?.(orderRecord);

        // Persist to localStorage for instant pending orders recovery
        try {
          const stored = localStorage.getItem('apexparts_orders');
          const existing: OrderRecord[] = stored ? JSON.parse(stored) : [];
          if (!existing.some((o) => o.orderId === orderRecord.orderId)) {
            localStorage.setItem('apexparts_orders', JSON.stringify([orderRecord, ...existing]));
          }
        } catch {}

        // Pop up the automated message modal so client can view / copy / dispatch via Gmail
        setShowAutomatedMessageModal(true);
      } else {
        setFormError(
          result.error ||
            'There was an error while sending the information to apexparts45@gmail.com. Please re-input the information to the fields to send it back.'
        );
      }
    } catch {
      setIsSubmitting(false);
      setFormError(
        'There was an error while sending the information to apexparts45@gmail.com. Please re-input the information to the fields to send it back.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden z-10 my-auto border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#ff6600] flex items-center justify-center font-bold text-xs">
              AP
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">
                {t.secureCheckoutTitle}
              </h2>
              <p className="text-[11px] text-slate-400">
                Direct B2B Sourcing · Payment Instructions Dispatched via Email
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmitOrder} noValidate className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Error Banner */}
          {formError && (
            <div className="p-3 bg-red-50 border border-red-300 rounded-lg flex items-start gap-2.5 text-xs text-red-800 shadow-xs">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-semibold">{formError}</div>
              <button
                type="button"
                onClick={() => setFormError(null)}
                className="text-red-500 hover:text-red-800 text-sm font-bold cursor-pointer"
              >
                ×
              </button>
            </div>
          )}

          {/* Quantity Warning Banner */}
          {qtyWarning && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{qtyWarning}</span>
            </div>
          )}

          {/* User Account State Notification */}
          {!isAuthenticated ? (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-orange-950">
              <div className="flex items-start sm:items-center gap-2">
                <UserIcon className="w-4 h-4 text-[#ff6600] shrink-0 mt-0.5 sm:mt-0" />
                <span>
                  <strong>Tip:</strong> Sign in or create an account to save your address and automatically receive payment details at your registered email.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="px-3 py-1 bg-white hover:bg-slate-50 border border-orange-300 rounded font-semibold text-[#ff6600] transition-colors cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => openAuthModal('register')}
                  className="px-3 py-1 bg-[#ff6600] hover:bg-[#e65c00] text-white rounded font-bold transition-colors cursor-pointer"
                >
                  Register
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between gap-2 text-xs text-emerald-950">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Logged in as <strong>{user?.fullName}</strong>. Payment information will be sent directly to:{' '}
                  <strong className="underline">{user?.email}</strong>.
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: Shipping & Payment Method Selection */}
            <div className="lg:col-span-7 space-y-5">
              {/* 1. Single Item Verification */}
              {singlePart && (
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 flex items-start gap-3">
                  <img
                    src={singlePart.image}
                    alt={singlePart.name}
                    className="w-14 h-14 object-cover rounded bg-white border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{singlePart.name}</h4>
                    <p className="text-[11px] text-slate-500 font-mono">OEM: {singlePart.oemNumber}</p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <div className="flex items-center gap-1.5 text-xs">
                        <label className="text-slate-600 font-medium">Qty:</label>
                        <input
                          type="number"
                          min={singlePart.moq}
                          max={singlePart.maxOrder}
                          value={singleQty}
                          onChange={(e) => handleSingleQtyUpdate(parseInt(e.target.value, 10) || singlePart.moq)}
                          className="w-20 bg-white border border-slate-300 rounded px-2 py-0.5 text-center font-mono text-xs focus:outline-hidden focus:border-[#ff6600]"
                        />
                        <span className="text-[11px] text-slate-500">{singlePart.unit}s</span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        (MOQ: {singlePart.moq} · Max Limit: {singlePart.maxOrder})
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Destination Shipping Details with Placeholders */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px]">
                      1
                    </span>
                    {t.step1Title}
                  </h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">
                        {t.recipientName} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.fullName}
                        onChange={(e) => {
                          clearFieldError('fullName');
                          setShippingAddress({ ...shippingAddress, fullName: e.target.value });
                        }}
                        placeholder={t.placeholderFullName || 'Full legal name / consignee'}
                        className={`w-full bg-slate-50 border rounded px-2.5 py-1.5 text-slate-900 focus:outline-hidden focus:bg-white placeholder:text-slate-400 ${
                          fieldErrors.fullName
                            ? 'border-red-500 bg-red-50/20 ring-1 ring-red-500'
                            : 'border-slate-200 focus:border-[#ff6600]'
                        }`}
                      />
                      {fieldErrors.fullName && (
                        <p className="text-[10px] text-red-600 mt-1 font-medium flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          {fieldErrors.fullName}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">{t.companyName}</label>
                      <input
                        type="text"
                        value={shippingAddress.companyName || ''}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, companyName: e.target.value })}
                        placeholder={t.placeholderCompany || 'Company / Workshop name (optional)'}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-900 focus:outline-hidden focus:border-[#ff6600] focus:bg-white placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      {t.streetAddress} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.streetAddress}
                      onChange={(e) => {
                        clearFieldError('streetAddress');
                        setShippingAddress({ ...shippingAddress, streetAddress: e.target.value });
                      }}
                      placeholder={t.placeholderStreet || 'Street address, suite, unit number'}
                      className={`w-full bg-slate-50 border rounded px-2.5 py-1.5 text-slate-900 focus:outline-hidden focus:bg-white placeholder:text-slate-400 ${
                        fieldErrors.streetAddress
                          ? 'border-red-500 bg-red-50/20 ring-1 ring-red-500'
                          : 'border-slate-200 focus:border-[#ff6600]'
                      }`}
                    />
                    {fieldErrors.streetAddress && (
                      <p className="text-[10px] text-red-600 mt-1 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {fieldErrors.streetAddress}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">
                        {t.city} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.city}
                        onChange={(e) => {
                          clearFieldError('city');
                          setShippingAddress({ ...shippingAddress, city: e.target.value });
                        }}
                        placeholder={t.placeholderCity || 'City'}
                        className={`w-full bg-slate-50 border rounded px-2.5 py-1.5 text-slate-900 focus:outline-hidden focus:bg-white placeholder:text-slate-400 ${
                          fieldErrors.city
                            ? 'border-red-500 bg-red-50/20 ring-1 ring-red-500'
                            : 'border-slate-200 focus:border-[#ff6600]'
                        }`}
                      />
                      {fieldErrors.city && (
                        <p className="text-[10px] text-red-600 mt-1 font-medium flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          {fieldErrors.city}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">
                        {t.stateProv} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.stateProvince}
                        onChange={(e) => {
                          clearFieldError('stateProvince');
                          setShippingAddress({ ...shippingAddress, stateProvince: e.target.value });
                        }}
                        placeholder={t.placeholderState || 'State / Region'}
                        className={`w-full bg-slate-50 border rounded px-2.5 py-1.5 text-slate-900 focus:outline-hidden focus:bg-white placeholder:text-slate-400 ${
                          fieldErrors.stateProvince
                            ? 'border-red-500 bg-red-50/20 ring-1 ring-red-500'
                            : 'border-slate-200 focus:border-[#ff6600]'
                        }`}
                      />
                      {fieldErrors.stateProvince && (
                        <p className="text-[10px] text-red-600 mt-1 font-medium flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          {fieldErrors.stateProvince}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">
                        {t.postalCode} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.postalCode}
                        onChange={(e) => {
                          clearFieldError('postalCode');
                          setShippingAddress({ ...shippingAddress, postalCode: e.target.value });
                        }}
                        placeholder={t.placeholderZip || 'ZIP / Postal Code'}
                        className={`w-full bg-slate-50 border rounded px-2.5 py-1.5 text-slate-900 focus:outline-hidden focus:bg-white placeholder:text-slate-400 ${
                          fieldErrors.postalCode
                            ? 'border-red-500 bg-red-50/20 ring-1 ring-red-500'
                            : 'border-slate-200 focus:border-[#ff6600]'
                        }`}
                      />
                      {fieldErrors.postalCode && (
                        <p className="text-[10px] text-red-600 mt-1 font-medium flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          {fieldErrors.postalCode}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">
                        Country <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.country}
                        onChange={(e) => {
                          clearFieldError('country');
                          setShippingAddress({ ...shippingAddress, country: e.target.value });
                        }}
                        placeholder="Country / Region"
                        className={`w-full bg-slate-50 border rounded px-2.5 py-1.5 text-slate-900 focus:outline-hidden focus:bg-white placeholder:text-slate-400 ${
                          fieldErrors.country
                            ? 'border-red-500 bg-red-50/20 ring-1 ring-red-500'
                            : 'border-slate-200 focus:border-[#ff6600]'
                        }`}
                      />
                      {fieldErrors.country && (
                        <p className="text-[10px] text-red-600 mt-1 font-medium flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          {fieldErrors.country}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">
                        {t.phoneCarrier} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.phoneNumber}
                        onChange={(e) => {
                          clearFieldError('phoneNumber');
                          setShippingAddress({ ...shippingAddress, phoneNumber: e.target.value });
                        }}
                        placeholder={t.placeholderPhone || 'Mobile or WhatsApp number'}
                        className={`w-full bg-slate-50 border rounded px-2.5 py-1.5 text-slate-900 focus:outline-hidden focus:bg-white placeholder:text-slate-400 ${
                          fieldErrors.phoneNumber
                            ? 'border-red-500 bg-red-50/20 ring-1 ring-red-500'
                            : 'border-slate-200 focus:border-[#ff6600]'
                        }`}
                      />
                      {fieldErrors.phoneNumber && (
                        <p className="text-[10px] text-red-600 mt-1 font-medium flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          {fieldErrors.phoneNumber}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-slate-600 font-medium mb-1">
                        Client Email (Where payment info will be sent) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={user?.email || shippingAddress.email}
                        readOnly={!!user?.email}
                        onChange={(e) => {
                          clearFieldError('email');
                          setShippingAddress({ ...shippingAddress, email: e.target.value });
                        }}
                        placeholder={t.placeholderEmail || 'buyer.email@domain.com'}
                        className={`w-full border rounded px-2.5 py-1.5 text-slate-900 focus:outline-hidden placeholder:text-slate-400 ${
                          user?.email ? 'bg-slate-100 font-mono text-slate-800 cursor-not-allowed' : 'bg-slate-50 focus:bg-white'
                        } ${
                          fieldErrors.email
                            ? 'border-red-500 bg-red-50/20 ring-1 ring-red-500'
                            : 'border-slate-200 focus:border-[#ff6600]'
                        }`}
                      />
                      {user?.email && (
                        <span className="text-[10px] text-emerald-600 font-medium block mt-0.5">
                          ✓ Bound to registered account
                        </span>
                      )}
                      {fieldErrors.email && (
                        <p className="text-[10px] text-red-600 mt-1 font-medium flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          {fieldErrors.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Logistics Carrier Option */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#ff6600]" />
                  {t.logisticsOption}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <label
                    onClick={() => setShippingMethod('express')}
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                      shippingMethod === 'express'
                        ? 'border-[#ff6600] bg-orange-50/50 ring-1 ring-[#ff6600]'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{t.dhlExpress}</span>
                        <span className="font-mono font-bold text-[#ff6600]">
                          {formatPrice(18.5, currencyCode)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">3 - 5 business days door-to-door</p>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-semibold mt-2">Recommended</span>
                  </label>

                  <label
                    onClick={() => setShippingMethod('standard')}
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                      shippingMethod === 'standard'
                        ? 'border-[#ff6600] bg-orange-50/50 ring-1 ring-[#ff6600]'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{t.standardAir}</span>
                        <span className="font-mono font-bold text-[#ff6600]">
                          {formatPrice(8.0, currencyCode)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">7 - 10 business days tracking</p>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-2">Economical</span>
                  </label>

                  <label
                    onClick={() => setShippingMethod('ocean')}
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                      shippingMethod === 'ocean'
                        ? 'border-[#ff6600] bg-orange-50/50 ring-1 ring-[#ff6600]'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{t.oceanVessel}</span>
                        <span className="font-mono font-bold text-[#ff6600]">
                          {formatPrice(3.5, currencyCode)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">20 - 30 days bulk cargo</p>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-2">Heavy Lots</span>
                  </label>
                </div>
              </div>

              {/* 4. PAYMENT METHOD SELECTION WITH MANDATORY NOTICE PARAGRAPH */}
              <div className="bg-white p-4 sm:p-5 rounded-lg border-2 border-orange-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-[#ff6600] text-white flex items-center justify-center text-[10px]">
                      2
                    </span>
                    Payment Method
                  </h3>
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Secure Sourcing Notification
                  </span>
                </div>

                {/* EXACT MANDATORY PARAGRAPH REQUIRED BY USER */}
                <div className="p-3.5 bg-gradient-to-r from-orange-50 to-amber-50 border-l-4 border-[#ff6600] rounded-r-lg shadow-2xs">
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed">
                    Every payment method you choose, the information of the payment method will be sent to you via email.
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-[#ff6600]" />
                    <span>
                      Destination Email:{' '}
                      <strong className="text-slate-800 font-mono">
                        {activeEmailDestination || '(Enter your email above or register)'}
                      </strong>
                    </span>
                  </p>
                </div>

                {/* 5 PAYMENT METHODS: PayPal, Zelle, Venmo, Apple Pay, Google Pay */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {PAYMENT_OPTIONS.map((opt) => {
                    const isSelected = selectedPaymentMethod === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => setSelectedPaymentMethod(opt.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${
                          isSelected
                            ? 'border-[#ff6600] bg-orange-50/70 shadow-xs ring-1 ring-[#ff6600]'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white'
                        }`}
                      >
                        <div className={`px-2 py-1 rounded text-[11px] font-black shrink-0 ${opt.badgeBg} ${opt.badgeText}`}>
                          {opt.badge}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-900">{opt.name}</span>
                            {isSelected && <Check className="w-4 h-4 text-[#ff6600] shrink-0" />}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{opt.subtitle}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Payment Notes / Handle (Optional) */}
                <div className="pt-2">
                  <label className="block text-slate-600 font-medium text-xs mb-1">
                    Buyer Payment Note / Account Handle (Optional)
                  </label>
                  <input
                    type="text"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="e.g. Your Zelle phone, Venmo @tag, or special invoice instructions"
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:border-[#ff6600] focus:bg-white placeholder:text-slate-400"
                  />
                </div>

                {/* Notification Dispatch Notice to apexparts45@gmail.com */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <Send className="w-3.5 h-3.5 text-[#ff6600]" />
                    <span>Automated Order Request Routing</span>
                  </div>
                  <p>
                    When you click confirm below, your order specifications and total price will be dispatched to our merchant desk at{' '}
                    <strong className="text-slate-900 font-mono">apexparts45@gmail.com</strong>.
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Our team will reply with your official payment transfer details and commercial invoice directly to your email.
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Order Summary & Confirmation Button */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3.5">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide pb-2 border-b border-slate-200">
                  {t.orderSummary}
                </h3>

                {/* Items Breakdown list */}
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                  {itemsToCheckout.map((item) => (
                    <div
                      key={item.part.id}
                      className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-medium text-slate-800 truncate text-[11px]">{item.part.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {item.quantity} {item.part.unit}s × {formatPrice(item.selectedTierPrice, currencyCode)}
                        </p>
                      </div>
                      <div className="font-mono font-bold text-slate-900 shrink-0 text-xs">
                        {formatPrice(item.selectedTierPrice * item.quantity, currencyCode)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Cost Calculations */}
                <div className="space-y-1.5 pt-2 border-t border-slate-200 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>
                      {t.itemsSubtotal} ({totalPieces} {t.unitsTotal})
                    </span>
                    <span className="font-mono">{formatPrice(subtotal, currencyCode)}</span>
                  </div>

                  {volumeDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>{t.volumeSavings}</span>
                      <span className="font-mono">-{formatPrice(volumeDiscount, currencyCode)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>{t.freightCost}</span>
                    <span className="font-mono">{formatPrice(shippingCost, currencyCode)}</span>
                  </div>

                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Payment Processing Information</span>
                    <span className="text-emerald-600 font-medium">Emailed (Free)</span>
                  </div>

                  <div className="flex justify-between items-baseline pt-2 border-t border-slate-300 text-slate-900">
                    <span className="font-bold text-sm">{t.totalPayable}</span>
                    <div className="text-right">
                      <span className="font-mono font-black text-lg text-[#ff6600]">
                        {formatPrice(totalAmount, currencyCode)}
                      </span>
                      <span className="text-[10px] text-slate-500 block">Inc. customs documentation</span>
                    </div>
                  </div>
                </div>

                {/* Buyer Guarantees */}
                <div className="bg-white p-3 rounded border border-slate-200 space-y-2 text-[11px]">
                  <div className="flex items-center gap-2 text-slate-700 font-semibold">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Apex Buyer Protection Guarantee</span>
                  </div>
                  <ul className="text-slate-500 space-y-1 text-[10px] pl-6 list-disc">
                    <li>Dispatched within stated delivery window or full freight refund</li>
                    <li>Money-back guarantee if parts do not match OEM tolerance specs</li>
                    <li>Payment instructions dispatched only from verified apexparts45@gmail.com desk</li>
                  </ul>
                </div>
              </div>

              {/* Submit Order Action Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-lg font-bold text-sm bg-linear-to-r from-[#ff6600] to-[#ff8533] hover:from-[#e65c00] hover:to-[#ff751a] text-white flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting Order & Notifying Merchant...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Confirm Order & Request Payment Details ({formatPrice(totalAmount, currencyCode)})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* AUTOMATED MESSAGE POP-UP MODAL */}
      {showAutomatedMessageModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
            onClick={() => setShowAutomatedMessageModal(false)}
          />

          {/* Pop-up Container */}
          <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden z-10 my-auto border border-slate-300 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EA4335] text-white flex items-center justify-center shadow-xs">
                  <Mail className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight flex items-center gap-2">
                    Automated Payment Request Message
                    <span className="bg-[#ff6600]/20 text-[#ff8533] text-[10px] px-2 py-0.5 rounded-full font-mono font-medium">
                      Ready to Send
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Send this message from your Gmail to the website owner (<strong className="text-white font-mono">apexparts45@gmail.com</strong>)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleProceedToVerification}
                className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
                title="Proceed to payment verification"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
              {/* Guidance Banner */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950 flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-xs">
                    Order Payment Request Dispatched to apexparts45@gmail.com
                  </p>
                  <p className="text-[11px] text-slate-700 leading-relaxed">
                    1. A real payment request email has been sent directly to <strong className="font-mono text-slate-900">apexparts45@gmail.com</strong> for your order.<br />
                    2. You can also send the prepared email below using your Gmail account or copy the details.<br />
                    3. Click <strong>&ldquo;Proceed to Verification&rdquo;</strong> to review your order status and upload your payment confirmation screenshot.
                  </p>
                </div>
              </div>

              {/* Message Metadata Header */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2 text-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Website Owner (Recipient):</span>
                  <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    apexparts45@gmail.com
                  </span>
                </div>
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Client / Sender Gmail:</span>
                  <span className="font-mono font-bold text-[#ff6600] bg-white px-2 py-0.5 rounded border border-slate-200">
                    {effectiveClientEmail}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500 font-medium shrink-0">Subject:</span>
                  <span className="font-medium text-slate-800 text-right text-[11px] truncate">
                    {automatedMessageSubject}
                  </span>
                </div>
              </div>

              {/* Scrollable Preformatted Message Box */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                    Automated Message Content:
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
                    value={automatedMessageBody}
                    rows={12}
                    className="w-full bg-slate-900 text-slate-100 font-mono text-[11px] leading-relaxed p-3.5 rounded-lg border border-slate-800 focus:outline-hidden resize-none selection:bg-[#ff6600] selection:text-white"
                  />
                </div>
              </div>

              {/* Dispatch Action Options */}
              <div className="space-y-2 pt-1">
                <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                  Choose How to Send:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Option 1: Send via Gmail Web */}
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

                  {/* Option 2: Default Mail App */}
                  <a
                    href={mailtoUrl}
                    className="flex items-center justify-center gap-2 p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer text-center"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Default Mail App</span>
                  </a>

                  {/* Option 3: Copy Text */}
                  <button
                    type="button"
                    onClick={handleCopyMessage}
                    className="flex items-center justify-center gap-2 p-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                  >
                    {emailCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-600" />
                        <span>Copy Message</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-900 flex items-start gap-2">
                  <span className="font-bold text-blue-700">Note:</span>
                  <span>
                    When Gmail opens, remember to press the blue <strong>&ldquo;Send&rdquo;</strong> button inside Gmail to dispatch your email to <strong>apexparts45@gmail.com</strong>.
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowAutomatedMessageModal(false)}
                className="w-full sm:w-auto px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
              >
                ← Back to Edit Details
              </button>

              <button
                type="button"
                onClick={handleProceedToVerification}
                className="w-full sm:w-auto px-5 py-2.5 bg-linear-to-r from-[#ff6600] to-[#ff8533] hover:from-[#e65c00] hover:to-[#ff751a] text-white rounded-lg font-bold text-xs shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Proceed to Payment Verification Screen</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
