import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  ShieldCheck,
  Zap,
  Truck,
  CheckCircle2,
  ShoppingCart,
  ArrowRight,
  Check,
  Building,
  Info,
  AlertCircle,
} from 'lucide-react';
import { CarPart } from '../types';
import { formatPrice } from '../utils/currency';
import { useTranslation } from '../context/LanguageContext';

interface ProductDetailModalProps {
  part: CarPart | null;
  currencyCode?: string;
  isOpen: boolean;
  onClose: () => void;
  onOrderNow: (part: CarPart, quantity: number) => void;
  onAddToCart: (part: CarPart, quantity: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  part,
  currencyCode = 'USD',
  isOpen,
  onClose,
  onOrderNow,
  onAddToCart,
}) => {
  const { t } = useTranslation();
  const [quantity, setQuantity] = useState<number>(1);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState(false);
  const [activeImage, setActiveImage] = useState<number>(0);

  useEffect(() => {
    if (part) {
      setQuantity(part.moq);
      setValidationWarning(null);
      setActiveImage(0);
    }
  }, [part]);

  if (!isOpen || !part) return null;

  // Photo gallery: every photo that belongs to this part (falls back to the main image)
  const gallery = part.images && part.images.length > 0 ? part.images : [part.image];
  const shownImage = gallery[Math.min(activeImage, gallery.length - 1)];

  // Determine current active tier price based on quantity
  let currentUnitPrice = part.basePrice;
  for (const tier of part.priceTiers) {
    if (quantity >= tier.minQty) {
      if (!tier.maxQty || quantity <= tier.maxQty) {
        currentUnitPrice = tier.price;
        break;
      }
    }
  }

  const totalPrice = currentUnitPrice * quantity;

  // Enforced Quantity Handlers
  const handleQuantityChange = (val: number) => {
    if (val < part.moq) {
      setQuantity(part.moq);
      setValidationWarning(`${t.minOrderWarning} ${part.moq} ${part.unit}s.`);
    } else if (val > part.maxOrder) {
      setQuantity(part.maxOrder);
      setValidationWarning(`${t.maxOrderWarning} ${part.maxOrder} ${part.unit}s.`);
    } else {
      setQuantity(val);
      setValidationWarning(null);
    }
  };

  const stepDown = () => {
    const step = part.moq >= 20 ? 10 : part.moq >= 5 ? 5 : 1;
    handleQuantityChange(quantity - step);
  };

  const stepUp = () => {
    const step = part.moq >= 20 ? 10 : part.moq >= 5 ? 5 : 1;
    handleQuantityChange(quantity + step);
  };

  const handleAddToCartClick = () => {
    const validatedQty = Math.max(part.moq, Math.min(part.maxOrder, quantity));
    onAddToCart(part, validatedQty);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const handleOrderNowClick = () => {
    const validatedQty = Math.max(part.moq, Math.min(part.maxOrder, quantity));
    onOrderNow(part, validatedQty);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden z-10 my-auto border border-slate-200 max-h-[92vh] flex flex-col">
        {/* Header Bar */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-[#ff6600] text-white px-2 py-0.5 rounded font-bold uppercase">
              {part.condition}
            </span>
            <span className="text-xs text-slate-300">OEM: {part.oemNumber}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-50/40">
          {/* Left Column: Image & Supplier Specs (5 cols) */}
          <div className="md:col-span-5 flex flex-col gap-4">
            <div className="relative aspect-4/3 w-full bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
              <img
                src={shownImage}
                alt={part.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain object-center bg-white"
              />
              {part.isReadyToShip && (
                <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-current" />
                  {t.readyToShip}
                </span>
              )}
            </div>

            {/* Photo gallery thumbnails */}
            {gallery.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Product photos">
                {gallery.map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    className={`shrink-0 w-16 h-16 rounded-md border-2 bg-white overflow-hidden cursor-pointer transition-colors ${
                      i === activeImage ? 'border-[#ff6600]' : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <img
                      src={src}
                      alt={`${part.name} - photo ${i + 1}`}
                      loading="lazy"
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Supplier Audit Box */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-2 shadow-2xs">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Building className="w-4 h-4 text-[#ff6600] shrink-0" />
                <span className="font-bold text-slate-900 truncate">{part.supplierName}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400">Location:</span>
                  <p className="font-medium text-slate-800">{part.supplierLocation}</p>
                </div>
                <div>
                  <span className="text-slate-400">Experience:</span>
                  <p className="font-medium text-slate-800">{part.supplierYears} Years Certified</p>
                </div>
                <div>
                  <span className="text-slate-400">Rating:</span>
                  <div className="flex items-center gap-1 text-amber-500 font-semibold">
                    <Star className="w-3 h-3 fill-current" />
                    <span>{part.rating}</span>
                    <span className="text-slate-400 font-normal">({part.reviewsCount})</span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Dispatch Window:</span>
                  <p className="font-medium text-slate-800">{part.deliveryDays}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-emerald-700 font-medium text-[11px]">
                <ShieldCheck className="w-4 h-4 text-[#ff6600]" />
                <span>{t.auditedFactory} & {t.escrowProtected}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Part Name, Wholesale Tiers, Specs Table, Buy Form (7 cols) */}
          <div className="md:col-span-7 flex flex-col gap-4">
            <div>
              <span className="text-xs text-[#ff6600] font-bold uppercase tracking-wider">
                {part.categoryLabel}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug mt-0.5">
                {part.name}
              </h2>
            </div>

            {/* Wholesale Price Tier Grid with Currency */}
            <div className="bg-white p-3.5 rounded-lg border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-2">
                {t.wholesaleTierPricing} ({currencyCode})
              </span>
              <div className="grid grid-cols-3 gap-2 text-center">
                {part.priceTiers.map((tier, idx) => {
                  const isCurrent =
                    quantity >= tier.minQty && (!tier.maxQty || quantity <= tier.maxQty);
                  return (
                    <div
                      key={idx}
                      className={`p-2 rounded border transition-colors ${
                        isCurrent
                          ? 'border-[#ff6600] bg-orange-50/70 font-semibold text-[#ff6600]'
                          : 'border-slate-200 bg-slate-50 text-slate-600'
                      }`}
                    >
                      <p className="text-[11px] text-slate-500 font-mono">
                        {tier.maxQty ? `${tier.minQty} - ${tier.maxQty}` : `${tier.minQty}+`}{' '}
                        {part.unit}s
                      </p>
                      <p className="text-sm font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                        {formatPrice(tier.price, currencyCode)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Technical Specifications Table */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden text-xs">
              <div className="bg-slate-100 px-3.5 py-2 font-bold text-slate-800 border-b border-slate-200 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-600" />
                <span>{t.technicalSpecs}</span>
              </div>
              <div className="divide-y divide-slate-100">
                {part.material && (
                  <div className="grid grid-cols-3 px-3.5 py-2">
                    <span className="text-slate-500 font-medium">{t.material}</span>
                    <span className="col-span-2 text-slate-900 font-semibold">{part.material}</span>
                  </div>
                )}
                {part.dimensions && (
                  <div className="grid grid-cols-3 px-3.5 py-2">
                    <span className="text-slate-500 font-medium">{t.dimensions}</span>
                    <span className="col-span-2 text-slate-900 font-mono">{part.dimensions}</span>
                  </div>
                )}
                {part.specs.map((s, idx) => (
                  <div key={idx} className="grid grid-cols-3 px-3.5 py-2">
                    <span className="text-slate-500 font-medium">{s.name}</span>
                    <span className="col-span-2 text-slate-900 font-mono">{s.value}</span>
                  </div>
                ))}
                <div className="grid grid-cols-3 px-3.5 py-2">
                  <span className="text-slate-500 font-medium">{t.vehicleFitment}</span>
                  <span className="col-span-2 text-slate-900 font-medium">{part.vehicleFitment.join(', ')}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
              {part.description}
            </p>

            {/* Quantity Stepper & Price Calculation with STRICT MIN/MAX ORDER ENFORCEMENT */}
            <div className="bg-orange-50/50 p-4 rounded-lg border border-orange-200 flex flex-col gap-3">
              {/* Min/Max Order Enforced Indicator */}
              <div className="flex items-center justify-between text-xs pb-1 border-b border-orange-200/60">
                <span className="text-slate-700 font-medium">
                  {t.orderLimits}
                </span>
                <span className="font-mono text-slate-900 font-bold bg-white px-2 py-0.5 rounded border border-orange-200">
                  {t.minLabel}: {part.moq} {part.unit}s · {t.maxLabel}: {part.maxOrder} {part.unit}s
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700">{t.orderQuantity}</span>
                  <div className="flex items-center border border-slate-300 bg-white rounded overflow-hidden">
                    <button
                      type="button"
                      onClick={stepDown}
                      disabled={quantity <= part.moq}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-slate-700 cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={part.moq}
                      max={part.maxOrder}
                      value={quantity}
                      onChange={(e) => handleQuantityChange(parseInt(e.target.value) || part.moq)}
                      className="w-16 text-center text-xs font-bold font-mono focus:outline-hidden py-1"
                    />
                    <button
                      type="button"
                      onClick={stepUp}
                      disabled={quantity >= part.maxOrder}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-slate-700 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">{part.unit}s</span>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block">{t.calculatedTotal}</span>
                  <span className="text-lg font-black text-[#ff6600] font-mono tabular-nums">
                    {formatPrice(totalPrice, currencyCode)}
                  </span>
                </div>
              </div>

              {validationWarning && (
                <div className="p-2 bg-amber-50 border border-amber-300 rounded text-amber-800 text-[11px] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{validationWarning}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-orange-200/80">
                <button
                  type="button"
                  onClick={handleOrderNowClick}
                  className="py-2.5 px-4 bg-[#ff6600] hover:bg-[#e65c00] text-white font-bold text-xs sm:text-sm rounded-md shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{t.orderNowAndPay}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleAddToCartClick}
                  className={`py-2.5 px-4 border text-xs sm:text-sm font-bold rounded-md transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                    justAdded
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white border-slate-300 hover:border-[#ff6600] text-slate-800 hover:text-[#ff6600]'
                  }`}
                >
                  {justAdded ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{t.added} {quantity}!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      <span>{t.addQuantityToCart}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
