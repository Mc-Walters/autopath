import React from 'react';
import { Star, ShieldCheck, Zap, ShoppingCart, ArrowRight, Eye, Check } from 'lucide-react';
import { CarPart } from '../types';
import { formatPrice, formatPriceRange } from '../utils/currency';
import { useTranslation } from '../context/LanguageContext';

interface ProductCardProps {
  part: CarPart;
  currencyCode?: string;
  onOrderNow: (part: CarPart) => void;
  onAddToCart: (part: CarPart) => void;
  onQuickView: (part: CarPart) => void;
  isAdded?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  part,
  currencyCode = 'USD',
  onOrderNow,
  onAddToCart,
  onQuickView,
  isAdded = false,
}) => {
  const { t } = useTranslation();

  // Lowest tier price vs highest
  const highestPrice = part.priceTiers[0]?.price || part.basePrice;
  const lowestPrice = part.priceTiers[part.priceTiers.length - 1]?.price || part.basePrice;

  const getConditionLabel = (cond: string) => {
    if (cond === 'OEM Genuine') return t.condOem;
    if (cond === 'Aftermarket Heavy-Duty') return t.condAftermarket;
    if (cond === 'Performance Racing') return t.condRacing;
    return cond;
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'micro-hardware':
        return t.catMicro;
      case 'tires-wheels':
        return t.catTires;
      case 'body-exterior':
        return t.catBody;
      case 'cabin-interior':
        return t.catInterior;
      case 'braking-suspension':
        return t.catBrakes;
      case 'engine-transmission':
        return t.catEngine;
      case 'electrical-sensors':
        return t.catElectrical;
      case 'cooling-exhaust':
        return t.catCooling;
      default:
        return part.categoryLabel;
    }
  };

  return (
    <div className="group bg-white rounded-lg border border-slate-200 hover:border-orange-300 hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden">
      {/* Product Image Area */}
      <div
        className="relative aspect-4/3 w-full bg-white overflow-hidden cursor-pointer"
        onClick={() => onQuickView(part)}
      >
        <img
          src={part.image}
          alt={part.name}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain object-center bg-white group-hover:scale-105 transition-transform duration-300"
        />

        {/* Top Floating Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start z-10 pointer-events-none">
          {part.isReadyToShip && (
            <span className="bg-emerald-600/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5">
              <Zap className="w-2.5 h-2.5 fill-current" />
              {t.readyToShip}
            </span>
          )}
          <span className="bg-slate-900/80 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
            {getConditionLabel(part.condition)}
          </span>
        </div>

        {part.images && part.images.length > 1 && (
          <span className="absolute bottom-2 left-2 bg-slate-900/70 text-white text-[10px] font-medium px-1.5 py-0.5 rounded pointer-events-none">
            {part.images.length} photos
          </span>
        )}

        {/* Quick View Hover Overlay Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onQuickView(part);
          }}
          className="absolute bottom-2 right-2 bg-white/95 hover:bg-white text-slate-800 hover:text-[#ff6600] p-1.5 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[11px] font-medium cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{t.quickSpecs}</span>
        </button>
      </div>

      {/* Card Content Area */}
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* Category & OEM Number */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1 gap-2">
            <span className="truncate">{getCategoryLabel(part.category)}</span>
            <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 shrink-0">
              OEM: {part.oemNumber.split('/')[0].trim()}
            </span>
          </div>

          {/* Product Title */}
          <h3
            onClick={() => onQuickView(part)}
            className="text-xs sm:text-sm font-semibold text-slate-900 hover:text-[#ff6600] transition-colors line-clamp-2 cursor-pointer leading-snug mb-1"
            title={part.name}
          >
            {part.name}
          </h3>

          {/* Vehicle Fitment Tags */}
          <div className="text-[11px] text-slate-500 flex items-center gap-1 mb-2">
            <span className="text-slate-400">{t.fits}</span>
            <span className="font-medium text-slate-700 truncate">
              {part.vehicleFitment.join(', ')}
            </span>
          </div>

          {/* Pricing Zone with Currency Conversion */}
          <div className="pt-1 border-t border-slate-100">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-bold text-slate-900 tabular-nums font-mono">
                {formatPriceRange(lowestPrice, highestPrice, currencyCode, part.unit)}
              </span>
            </div>

            {/* Min and Max Order Limits (Enforced!) */}
            <div className="flex items-center justify-between text-[11px] text-slate-600 mt-1 bg-slate-50 px-2 py-1 rounded border border-slate-100">
              <span>
                {t.minLabel}: <strong className="text-slate-900 font-mono">{part.moq}</strong> · {t.maxLabel}: <strong className="text-slate-900 font-mono">{part.maxOrder}</strong>
              </span>
              <span className="text-slate-400 text-[10px]">
                {part.ordersCount.toLocaleString()} {t.sold}
              </span>
            </div>
          </div>

          {/* Supplier Info */}
          <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px]">
            <p className="font-medium text-slate-700 truncate" title={part.supplierName}>
              {part.supplierName}
            </p>
            <div className="flex items-center gap-2 text-slate-500 text-[10px] mt-0.5">
              <span className="text-amber-600 font-semibold">{part.supplierYears} YRS</span>
              <span>·</span>
              <div className="flex items-center gap-0.5 text-amber-500">
                <Star className="w-3 h-3 fill-current" />
                <span className="font-semibold text-slate-700">{part.rating}</span>
                <span className="text-slate-400">({part.reviewsCount})</span>
              </div>
              <span>·</span>
              <div className="flex items-center gap-0.5 text-emerald-600 font-medium">
                <ShieldCheck className="w-3 h-3" />
                <span>{t.auditedFactory}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons: Order Now & Add to Cart */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => onOrderNow(part)}
            className="w-full py-2 px-2 bg-[#ff6600] hover:bg-[#e65c00] active:bg-[#cc5200] text-white text-xs font-bold rounded transition-colors flex items-center justify-center gap-1 shadow-2xs whitespace-nowrap cursor-pointer"
          >
            <span>{t.orderNow}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onAddToCart(part)}
            className={`w-full py-2 px-2 border text-xs font-semibold rounded transition-colors flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer ${
              isAdded
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold'
                : 'bg-white border-slate-300 hover:border-[#ff6600] hover:text-[#ff6600] text-slate-700'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.added} ({part.moq})</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>{t.addToCart} ({part.moq})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
