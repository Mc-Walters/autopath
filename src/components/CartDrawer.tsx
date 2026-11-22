import React from 'react';
import { X, Trash2, ArrowRight, ShieldCheck, ShoppingCart, AlertCircle } from 'lucide-react';
import { CartItem } from '../types';
import { formatPrice } from '../utils/currency';
import { useTranslation } from '../context/LanguageContext';

interface CartDrawerProps {
  isOpen: boolean;
  currencyCode?: string;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (partId: string, quantity: number) => void;
  onRemoveItem: (partId: string) => void;
  onProceedToOrder: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  currencyCode = 'USD',
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToOrder,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const subtotal = items.reduce(
    (acc, item) => acc + item.selectedTierPrice * item.quantity,
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Drawer Container */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl z-10 flex flex-col justify-between">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-[#ff6600]" />
            <h2 className="font-bold text-sm">{t.sourcingCart} ({items.length})</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12 text-slate-400">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                <ShoppingCart className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-700">{t.cartEmpty}</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                {t.cartEmptyDesc}
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-[#ff6600] text-white text-xs font-bold rounded shadow-xs hover:bg-[#e65c00] transition-colors cursor-pointer"
              >
                {t.browseCatalog}
              </button>
            </div>
          ) : (
            items.map((item) => {
              const step = item.part.moq >= 20 ? 10 : item.part.moq >= 5 ? 5 : 1;
              const isAtMin = item.quantity <= item.part.moq;
              const isAtMax = item.quantity >= item.part.maxOrder;

              return (
                <div
                  key={item.part.id}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex gap-3 text-xs"
                >
                  <img
                    src={item.part.image}
                    alt={item.part.name}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 object-cover rounded border border-slate-200 bg-white shrink-0"
                  />

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <p className="font-semibold text-slate-900 line-clamp-1">{item.part.name}</p>
                        <button
                          onClick={() => onRemoveItem(item.part.id)}
                          className="text-slate-400 hover:text-red-600 transition-colors p-0.5 cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono">
                        OEM: {item.part.oemNumber.split('/')[0]}
                      </p>
                      {/* Min & Max Order Enforcement indicators */}
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {t.limits} {t.minLabel} <span className="font-bold text-slate-700 font-mono">{item.part.moq}</span> · {t.maxLabel} <span className="font-bold text-slate-700 font-mono">{item.part.maxOrder}</span> {item.part.unit}s
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-200/60">
                      {/* Quantity Stepper with Min/Max clamping */}
                      <div className="flex items-center border border-slate-300 bg-white rounded overflow-hidden">
                        <button
                          type="button"
                          disabled={isAtMin}
                          onClick={() =>
                            onUpdateQuantity(
                              item.part.id,
                              Math.max(item.part.moq, item.quantity - step)
                            )
                          }
                          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 font-bold cursor-pointer"
                          title={isAtMin ? `Cannot order less than MOQ (${item.part.moq})` : 'Decrease'}
                        >
                          -
                        </button>
                        <span className="w-12 text-center font-bold font-mono text-xs">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          disabled={isAtMax}
                          onClick={() =>
                            onUpdateQuantity(
                              item.part.id,
                              Math.min(item.part.maxOrder, item.quantity + step)
                            )
                          }
                          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 font-bold cursor-pointer"
                          title={isAtMax ? `Cannot exceed max stock (${item.part.maxOrder})` : 'Increase'}
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-slate-900 font-mono tabular-nums">
                          {formatPrice(item.selectedTierPrice * item.quantity, currencyCode)}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          ({formatPrice(item.selectedTierPrice, currencyCode)}/ea)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Checkout Bar */}
        {items.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">{t.cartSubtotal} ({currencyCode})</span>
              <span className="text-base font-black text-slate-900 font-mono tabular-nums">
                {formatPrice(subtotal, currencyCode)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-200">
              <ShieldCheck className="w-4 h-4 text-[#ff6600] shrink-0" />
              <span>{t.buyerProtectionTag}</span>
            </div>

            <button
              onClick={() => {
                onClose();
                onProceedToOrder();
              }}
              className="w-full py-3 bg-[#ff6600] hover:bg-[#e65c00] text-white font-bold text-xs sm:text-sm rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{t.orderAllAndSelectPayment}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
