import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle,
  Printer,
  ArrowRight,
  Truck,
  X,
  Download,
  Copy,
  Check,
  Upload,
  Clock,
  AlertCircle,
  ShieldCheck,
  FileCheck,
  PackageCheck,
  Plane,
  Box,
  Image as ImageIcon,
} from 'lucide-react';
import { OrderRecord } from '../types';
import { formatPrice } from '../utils/currency';
import { useTranslation } from '../context/LanguageContext';
import { api } from '../services/api';

interface OrderConfirmationModalProps {
  order: OrderRecord | null;
  currencyCode?: string;
  isOpen: boolean;
  onClose: () => void;
  onContinueShopping: () => void;
  onOrderUpdated?: (order: OrderRecord) => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  order,
  currencyCode = 'USD',
  isOpen,
  onClose,
  onContinueShopping,
  onOrderUpdated,
}) => {
  const { t } = useTranslation();
  const [currentOrder, setCurrentOrder] = useState<OrderRecord | null>(order);

  // Sync with prop when order changes
  useEffect(() => {
    setCurrentOrder(order);
  }, [order]);

  const [copied, setCopied] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Verification Upload State
  const [screenshotData, setScreenshotData] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState<string>('');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [buyerNotes, setBuyerNotes] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationSuccess, setVerificationSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Start clean whenever a different order is opened (no screenshot carried over)
  useEffect(() => {
    setScreenshotData(null);
    setScreenshotName('');
    setTransactionRef('');
    setBuyerNotes('');
    setVerificationError(null);
    setVerificationSuccess(null);
  }, [order?.orderId]);

  if (!isOpen || !currentOrder) return null;

  const isPaymentSuccessful =
    currentOrder.status === 'Payment Successful' ||
    currentOrder.paymentVerified === true;

  const getPaymentSummary = () => {
    const p = currentOrder.paymentDetails;
    return p.methodLabel || 'Selected Payment Method';
  };

  // Handle Image File Selection and convert to base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setVerificationError('Please select a valid image file (PNG, JPG, or WebP).');
      return;
    }

    setScreenshotName(file.name);
    setVerificationError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setScreenshotData(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit Screenshot for Verification
  const handleVerifyPayment = async () => {
    if (!screenshotData) {
      setVerificationError('Please select or drag-and-drop a payment confirmation screenshot first.');
      return;
    }

    setIsVerifying(true);
    setVerificationError(null);
    setVerificationSuccess(null);

    const res = await api.verifyPaymentScreenshot(currentOrder.orderId, {
      screenshot: screenshotData,
      transactionId: transactionRef.trim() || undefined,
      notes: buyerNotes.trim() || undefined,
    });

    setIsVerifying(false);

    if (res.success && res.order) {
      setCurrentOrder(res.order);
      setVerificationSuccess('Payment verified successfully as authentic! Official receipt generated.');
      if (onOrderUpdated) {
        onOrderUpdated(res.order);
      }
    } else {
      setVerificationError(
        res.error ||
          'Payment verification failed. Please ensure the screenshot clearly proves the payment to the payment method you chose.'
      );
    }
  };

  // Generate a complete, standalone, printable HTML Invoice / Official Receipt
  const generateInvoiceHtml = () => {
    const formattedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const itemsRows = currentOrder.items
      .map(
        (it, idx) => `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 13px;">
          <td style="padding: 12px 8px; color: #475569;">${idx + 1}</td>
          <td style="padding: 12px 8px;">
            <strong style="color: #0f172a; display: block;">${it.partName}</strong>
            <span style="color: #64748b; font-size: 11px; font-family: monospace;">OEM: ${it.oemNumber}</span>
          </td>
          <td style="padding: 12px 8px; text-align: center; color: #334155;">${it.quantity} ${it.unit}s</td>
          <td style="padding: 12px 8px; text-align: right; color: #334155; font-family: monospace;">${formatPrice(it.unitPrice, currencyCode)}</td>
          <td style="padding: 12px 8px; text-align: right; font-weight: bold; color: #0f172a; font-family: monospace;">${formatPrice(it.total, currencyCode)}</td>
        </tr>
      `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Receipt & Commercial Invoice ${currentOrder.orderId} - ApexParts Global</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            padding: 40px;
            font-size: 14px;
            line-height: 1.5;
          }
          .invoice-box {
            max-width: 820px;
            margin: auto;
            border: 1px solid #e2e8f0;
            padding: 36px;
            border-radius: 12px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 20px;
            margin-bottom: 24px;
          }
          .logo-mark {
            display: inline-block;
            background: #ff6600;
            color: white;
            font-weight: 900;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 18px;
            letter-spacing: -0.5px;
          }
          .badge-paid {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: bold;
            background: #ecfdf5;
            color: #047857;
            border: 1px solid #a7f3d0;
          }
          .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            margin-bottom: 24px;
          }
          .card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 16px;
            border-radius: 8px;
          }
          .card-title {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 800;
            color: #64748b;
            margin-bottom: 8px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
          }
          th {
            background: #f1f5f9;
            color: #334155;
            text-align: left;
            padding: 10px 8px;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #cbd5e1;
          }
          .totals-table {
            width: 340px;
            margin-left: auto;
            border-collapse: collapse;
          }
          .totals-table td {
            padding: 6px 8px;
            font-size: 13px;
          }
          .totals-table .grand-total {
            border-top: 2px solid #0f172a;
            font-size: 16px;
            font-weight: 900;
            color: #ff6600;
          }
          .fulfillment-tracker {
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            padding: 14px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 12px;
          }
          .footer {
            margin-top: 36px;
            padding-top: 20px;
            border-top: 1px dashed #cbd5e1;
            font-size: 11px;
            color: #64748b;
            display: flex;
            justify-content: space-between;
          }
          @media print {
            body { padding: 0; background: white; }
            .invoice-box { border: none; padding: 0; max-width: 100%; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <div class="header">
            <div>
              <div class="logo-mark">APEXPARTS GLOBAL</div>
              <p style="font-size: 11px; color: #64748b; margin-top: 6px;">
                Verified Automotive Direct Marketplace<br>
                Merchant Dispatch Desk: apexparts45@gmail.com
              </p>
            </div>
            <div style="text-align: right;">
              <h1 style="font-size: 20px; font-weight: 900; color: #0f172a;">OFFICIAL RECEIPT</h1>
              <p style="font-family: monospace; font-size: 13px; font-weight: bold; color: #ff6600;"># ${currentOrder.orderId}</p>
              <p style="font-size: 11px; color: #64748b;">Issued: ${formattedDate}</p>
              <div style="margin-top: 6px;">
                <span class="badge-paid">✓ PAYMENT SUCCESSFUL & VERIFIED</span>
              </div>
            </div>
          </div>

          <div class="fulfillment-tracker">
            <strong style="color: #0f172a; display: block; margin-bottom: 4px;">CURRENT FULFILLMENT STATUS:</strong>
            ✓ Payment Authenticated & Confirmed &nbsp;→&nbsp; 
            <strong>[ACTIVE] Packaging of Goods</strong> &nbsp;→&nbsp; 
            Sending & Transportation &nbsp;→&nbsp; 
            Air Delivery (${currentOrder.shippingMethod})
          </div>

          <div class="grid-2">
            <div class="card">
              <div class="card-title">Consignee & Shipping Destination</div>
              <strong style="color: #0f172a; font-size: 14px;">${currentOrder.shippingAddress.fullName}</strong>
              ${currentOrder.shippingAddress.companyName ? `<div style="color: #475569; font-size: 12px;">${currentOrder.shippingAddress.companyName}</div>` : ''}
              <div style="color: #334155; margin-top: 4px;">
                ${currentOrder.shippingAddress.streetAddress}<br>
                ${currentOrder.shippingAddress.city}, ${currentOrder.shippingAddress.stateProvince} ${currentOrder.shippingAddress.postalCode}<br>
                ${currentOrder.shippingAddress.country}
              </div>
              <div style="margin-top: 6px; font-size: 12px; color: #64748b;">
                Tel: ${currentOrder.shippingAddress.phoneNumber} · Email: ${currentOrder.shippingAddress.email}
              </div>
            </div>

            <div class="card">
              <div class="card-title">Payment & Logistics Authorization</div>
              <div style="margin-bottom: 6px;">
                <span style="color: #64748b; font-size: 11px;">Payment Method:</span><br>
                <strong style="color: #0f172a;">${getPaymentSummary()}</strong>
              </div>
              <div style="margin-bottom: 6px;">
                <span style="color: #64748b; font-size: 11px;">Air Waybill / Tracking Number:</span><br>
                <strong style="font-family: monospace; color: #0f172a;">${currentOrder.trackingNumber}</strong>
              </div>
              <div>
                <span style="color: #64748b; font-size: 11px;">Carrier Service:</span><br>
                <span style="color: #0f172a; font-size: 12px;">${currentOrder.shippingMethod}</span>
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 40px;">#</th>
                <th>Part Description & OEM Reference</th>
                <th style="text-align: center; width: 110px;">Quantity</th>
                <th style="text-align: right; width: 110px;">Unit Price</th>
                <th style="text-align: right; width: 120px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <table class="totals-table">
            <tr>
              <td style="color: #64748b;">Parts Subtotal:</td>
              <td style="text-align: right; font-family: monospace;">${formatPrice(currentOrder.subtotal, currencyCode)}</td>
            </tr>
            ${
              currentOrder.volumeDiscount > 0
                ? `<tr>
                    <td style="color: #059669;">Volume Discount:</td>
                    <td style="text-align: right; font-family: monospace; color: #059669;">-${formatPrice(currentOrder.volumeDiscount, currencyCode)}</td>
                  </tr>`
                : ''
            }
            <tr>
              <td style="color: #64748b;">Freight Shipping:</td>
              <td style="text-align: right; font-family: monospace;">${formatPrice(currentOrder.shippingCost, currencyCode)}</td>
            </tr>
            <tr class="grand-total">
              <td style="padding-top: 10px;">Total Paid:</td>
              <td style="text-align: right; padding-top: 10px; font-family: monospace;">${formatPrice(currentOrder.total, currencyCode)}</td>
            </tr>
          </table>

          <div class="footer">
            <div>
              <strong>ApexParts Global Escrow & Logistics</strong><br>
              Order notification and payment verified with apexparts45@gmail.com.
            </div>
            <div style="text-align: right;">
              Verification Code: <strong style="font-family: monospace;">APX-${currentOrder.orderId.replace(/\D/g, '')}-VERIFIED</strong><br>
              System Stamp: ${formattedDate}
            </div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;
  };

  // Printing Trigger
  const handlePrint = () => {
    setIsPrinting(true);

    try {
      const existingFrame = document.getElementById('apex-print-frame');
      if (existingFrame) existingFrame.remove();

      const printIframe = document.createElement('iframe');
      printIframe.id = 'apex-print-frame';
      printIframe.style.position = 'fixed';
      printIframe.style.right = '0';
      printIframe.style.bottom = '0';
      printIframe.style.width = '10px';
      printIframe.style.height = '10px';
      printIframe.style.border = '0';
      printIframe.style.opacity = '0.01';
      printIframe.style.zIndex = '-999';
      document.body.appendChild(printIframe);

      const htmlContent = generateInvoiceHtml();
      const iframeDoc = printIframe.contentWindow?.document;

      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(htmlContent);
        iframeDoc.close();

        setTimeout(() => {
          try {
            printIframe.contentWindow?.focus();
            printIframe.contentWindow?.print();
          } catch {
            window.print();
          } finally {
            setIsPrinting(false);
          }
        }, 350);
      } else {
        window.print();
        setIsPrinting(false);
      }
    } catch {
      window.print();
      setIsPrinting(false);
    }
  };

  // Download Invoice HTML
  const handleDownloadInvoice = () => {
    try {
      const htmlContent = generateInvoiceHtml();
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Receipt_${currentOrder.orderId}_ApexParts.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  };

  // Copy Receipt Text
  const handleCopyReceipt = () => {
    const text = `
APEXPARTS GLOBAL - OFFICIAL RECEIPT
=================================
Order ID: ${currentOrder.orderId}
Status: ${currentOrder.status}
Tracking Number: ${currentOrder.trackingNumber}
Carrier: ${currentOrder.shippingMethod}
Payment Method: ${getPaymentSummary()}
Merchant Desk: apexparts45@gmail.com
Date: ${currentOrder.createdAt}

PARTS ORDERED:
${currentOrder.items.map((it) => `- ${it.partName} (OEM: ${it.oemNumber}) x ${it.quantity} ${it.unit}s = ${formatPrice(it.total, currencyCode)}`).join('\n')}

TOTALS:
Subtotal: ${formatPrice(currentOrder.subtotal, currencyCode)}
${currentOrder.volumeDiscount > 0 ? `Volume Savings: -${formatPrice(currentOrder.volumeDiscount, currencyCode)}\n` : ''}Shipping: ${formatPrice(currentOrder.shippingCost, currencyCode)}
Total Paid: ${formatPrice(currentOrder.total, currencyCode)}

DESTINATION:
${currentOrder.shippingAddress.fullName}
${currentOrder.shippingAddress.streetAddress}
${currentOrder.shippingAddress.city}, ${currentOrder.shippingAddress.stateProvince} ${currentOrder.shippingAddress.postalCode}
${currentOrder.shippingAddress.country}
Phone: ${currentOrder.shippingAddress.phoneNumber}
Email: ${currentOrder.shippingAddress.email}
=================================
    `.trim();

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity no-print" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden z-10 my-auto border border-slate-200">
        {/* TOP STATUS BANNER */}
        <div
          className={`p-5 text-white text-center relative ${
            isPaymentSuccessful ? 'bg-emerald-600' : 'bg-slate-900'
          }`}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-300 hover:text-white p-1 rounded transition-colors cursor-pointer no-print"
          >
            <X className="w-5 h-5" />
          </button>

          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2.5 shadow-inner ${
              isPaymentSuccessful ? 'bg-white/20' : 'bg-orange-500/20'
            }`}
          >
            {isPaymentSuccessful ? (
              <CheckCircle className="w-7 h-7 text-white stroke-[2.5]" />
            ) : (
              <Clock className="w-7 h-7 text-[#ff8533] stroke-[2.5]" />
            )}
          </div>

          <h2 className="text-lg sm:text-xl font-black tracking-tight">
            {isPaymentSuccessful
              ? 'Payment Successful & Authentic Receipt Generated'
              : 'Request for Payment Sent Successfully to apexparts45@gmail.com'}
          </h2>

          <p className="text-xs text-slate-300 mt-1 max-w-lg mx-auto">
            {isPaymentSuccessful
              ? 'Your payment screenshot was verified as authentic. Official receipt is generated and ready for print or download.'
              : 'A payment request for this order was dispatched to apexparts45@gmail.com. Please complete payment and upload your screenshot below.'}
          </p>

          <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 bg-black/30 rounded-full px-3 py-1 text-xs font-mono font-bold">
              <span>{t.orderIdLabel} {currentOrder.orderId}</span>
            </span>

            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                isPaymentSuccessful
                  ? 'bg-emerald-100 text-emerald-900'
                  : 'bg-amber-400 text-slate-950 font-black animate-pulse'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-current"></span>
              <span>Status: {currentOrder.status}</span>
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 text-xs text-slate-700 max-h-[75vh] overflow-y-auto">
          {/* NOTICE: Details Sent via Email */}
          <div className="p-3.5 bg-orange-50 border-l-4 border-[#ff6600] rounded-r-lg space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-orange-950 text-xs">
              <ShieldCheck className="w-4 h-4 text-[#ff6600]" />
              <span>Payment Request Information</span>
            </div>
            <p className="text-[11px] text-slate-700 leading-relaxed">
              Every payment method you choose, the information of the payment method will be sent to you via email. We have sent the request for{' '}
              <strong>{getPaymentSummary()}</strong> (Total: <strong>{formatPrice(currentOrder.total, currencyCode)}</strong>) to{' '}
              <strong className="font-mono text-slate-900">apexparts45@gmail.com</strong> and dispatched your instructions to{' '}
              <strong className="font-mono text-slate-900">{currentOrder.clientEmail}</strong>.
            </p>
          </div>

          {/* STEP 2: SCREENSHOT VERIFICATION SECTION (If Payment is Pending) */}
          {!isPaymentSuccessful && (
            <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border-2 border-orange-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#ff6600] text-white flex items-center justify-center font-bold text-xs">
                    !
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Payment Verification · Upload Proof Screenshot
                    </h3>
                    <p className="text-[10px] text-slate-500">
                      Upload your transaction screenshot once money has been sent out of the system
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Banner */}
              {verificationError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-800">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium">{verificationError}</div>
                </div>
              )}

              {/* Upload Dropzone */}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {!screenshotData ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-[#ff6600] bg-white rounded-lg p-6 text-center cursor-pointer transition-all hover:bg-orange-50/30"
                  >
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="font-bold text-xs text-slate-800">
                      Click to upload screenshot of successful payment
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Supports PNG, JPG, JPEG, WebP from {getPaymentSummary()} transaction confirmation
                    </p>
                  </div>
                ) : (
                  <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center gap-3">
                    <img
                      src={screenshotData}
                      alt="Uploaded Payment Proof"
                      className="w-16 h-16 object-cover rounded border border-slate-200 bg-slate-900 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-slate-900 truncate">{screenshotName || 'Payment_Proof.png'}</p>
                      <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                        <Check className="w-3 h-3" />
                        Screenshot loaded & ready for verification
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setScreenshotData(null);
                          setScreenshotName('');
                        }}
                        className="text-[10px] text-red-600 hover:underline mt-1 cursor-pointer font-medium"
                      >
                        Change screenshot
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Transaction Reference Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-medium text-[11px] mb-1">
                    Transaction ID / Reference Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="e.g. Zelle Ref #, Venmo Code, Bank Auth #"
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:border-[#ff6600] placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium text-[11px] mb-1">
                    Sender Name / Payment Handle (Optional)
                  </label>
                  <input
                    type="text"
                    value={buyerNotes}
                    onChange={(e) => setBuyerNotes(e.target.value)}
                    placeholder="e.g. Account name or handle used for transfer"
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:border-[#ff6600] placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Verification Button */}
              <button
                type="button"
                disabled={isVerifying || !screenshotData}
                onClick={handleVerifyPayment}
                className="w-full py-2.5 px-4 rounded-lg bg-linear-to-r from-[#ff6600] to-[#ff8533] hover:from-[#e65c00] hover:to-[#ff751a] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                {isVerifying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Authentic Payment Proof via Backend...</span>
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4" />
                    <span>Verify Payment Proof & Generate Receipt</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* SUCCESS BANNER: Shown when payment is verified */}
          {isPaymentSuccessful && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center gap-2.5 text-xs text-emerald-900">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="flex-1 font-semibold">
                Payment has been verified as authentic and successful! The official receipt is now generated below.
              </div>
            </div>
          )}

          {/* FULFILLMENT TIMELINE: Showing What is Left (Packaging, Transportation, Air Delivery) */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-[#ff6600]" />
                Goods Fulfillment & Delivery Tracker
              </span>
              <span className="font-mono text-[11px] text-slate-600 font-semibold">
                AWB: {currentOrder.trackingNumber}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
              {/* Step 1: Payment */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full text-white flex items-center justify-center font-bold mb-1 shadow-xs ${
                    isPaymentSuccessful ? 'bg-emerald-600' : 'bg-amber-500 animate-pulse'
                  }`}
                >
                  {isPaymentSuccessful ? '✓' : '1'}
                </div>
                <span className="font-bold text-slate-900">Payment</span>
                <span
                  className={`font-semibold ${
                    isPaymentSuccessful ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  {isPaymentSuccessful ? 'Successful' : 'Pending Proof'}
                </span>
              </div>

              {/* Step 2: Packaging */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full text-white flex items-center justify-center font-bold mb-1 ${
                    isPaymentSuccessful ? 'bg-[#ff6600] animate-pulse' : 'bg-slate-300 text-slate-600'
                  }`}
                >
                  <Box className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold text-slate-900">Packaging</span>
                <span className="text-slate-500">
                  {isPaymentSuccessful ? 'In Progress' : 'Queued'}
                </span>
              </div>

              {/* Step 3: Sending & Transportation */}
              <div className="flex flex-col items-center">
                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold mb-1">
                  <Truck className="w-3.5 h-3.5" />
                </div>
                <span className="text-slate-700 font-medium">Transportation</span>
                <span className="text-slate-400">Regional Hub</span>
              </div>

              {/* Step 4: Air Delivery */}
              <div className="flex flex-col items-center">
                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold mb-1">
                  <Plane className="w-3.5 h-3.5" />
                </div>
                <span className="text-slate-700 font-medium">Air Delivery</span>
                <span className="text-slate-400">{currentOrder.estimatedDelivery}</span>
              </div>
            </div>
          </div>

          {/* Itemized Purchased Parts Table */}
          <div>
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide mb-2 flex items-center justify-between">
              <span>Purchased Parts ({currentOrder.items.length})</span>
              <span className="text-[11px] font-mono text-slate-500 font-normal">
                Method: {getPaymentSummary()}
              </span>
            </h3>
            <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden">
              {currentOrder.items.map((item, index) => (
                <div key={index} className="p-3 flex items-center justify-between gap-3 bg-white">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.image}
                      alt={item.partName}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 object-cover rounded border border-slate-200 bg-slate-50 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{item.partName}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        OEM: {item.oemNumber.split('/')[0]} · {item.quantity} {item.unit}s @ {formatPrice(item.unitPrice, currencyCode)}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-slate-900 tabular-nums shrink-0">
                    {formatPrice(item.total, currencyCode)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Destination and Financial Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <h4 className="font-bold text-slate-900 mb-1">Destination Address:</h4>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                {currentOrder.shippingAddress.fullName}
                {currentOrder.shippingAddress.companyName && ` (${currentOrder.shippingAddress.companyName})`}
                <br />
                {currentOrder.shippingAddress.streetAddress}
                <br />
                {currentOrder.shippingAddress.city}, {currentOrder.shippingAddress.stateProvince} {currentOrder.shippingAddress.postalCode}
                <br />
                {currentOrder.shippingAddress.country} · {currentOrder.shippingAddress.phoneNumber}
              </p>
            </div>

            <div className="space-y-1 sm:text-right text-[11px]">
              <h4 className="font-bold text-slate-900 mb-1">Financial Summary:</h4>
              <p className="text-slate-600">Subtotal: {formatPrice(currentOrder.subtotal, currencyCode)}</p>
              {currentOrder.volumeDiscount > 0 && (
                <p className="text-emerald-600">Volume Savings: -{formatPrice(currentOrder.volumeDiscount, currencyCode)}</p>
              )}
              <p className="text-slate-600">
                Shipping ({currentOrder.shippingMethod.split('(')[0].trim()}): {formatPrice(currentOrder.shippingCost, currencyCode)}
              </p>
              <p className="text-sm font-black text-[#ff6600] font-mono tabular-nums pt-1">
                Total Payable: {formatPrice(currentOrder.total, currencyCode)}
              </p>
            </div>
          </div>

          {/* ACTION BUTTONS: Print, Download, Copy, Continue */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-3 border-t border-slate-200 no-print">
            {/* Primary Print Button */}
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50 text-xs"
              title="Print official receipt directly via printer"
            >
              <Printer className="w-4 h-4 text-[#ff6600]" />
              <span>{isPrinting ? 'Preparing Print...' : 'Print Receipt / Invoice'}</span>
            </button>

            {/* Download Receipt Button */}
            <button
              onClick={handleDownloadInvoice}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs"
              title="Download standalone invoice HTML/PDF file"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Download Receipt</span>
            </button>

            {/* Copy Receipt Text Button */}
            <button
              onClick={handleCopyReceipt}
              className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs"
              title="Copy receipt summary to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>Copy</span>
                </>
              )}
            </button>

            {/* Continue Sourcing Button */}
            <button
              onClick={onContinueShopping}
              className="sm:ml-auto px-5 py-2.5 bg-[#ff6600] hover:bg-[#e65c00] text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer text-xs"
            >
              <span>{t.continueSourcing}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
