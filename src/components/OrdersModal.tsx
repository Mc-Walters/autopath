import React, { useState, useMemo, useEffect } from 'react';
import { X, Package, Truck, ExternalLink, ShieldCheck, Clock, Upload, CheckCircle2, Trash2 } from 'lucide-react';
import { OrderRecord } from '../types';
import { formatPrice } from '../utils/currency';
import { useTranslation } from '../context/LanguageContext';
import { isMockupOrder, isPendingOrder, isPaidOrder } from '../utils/orders';

interface OrdersModalProps {
  isOpen: boolean;
  currencyCode?: string;
  onClose: () => void;
  orders: OrderRecord[];
  onSelectOrder: (order: OrderRecord) => void;
  onDeleteOrder?: (orderId: string) => void;
  onClearAllOrders?: () => void;
  initialTab?: 'pending' | 'history';
}

export const OrdersModal: React.FC<OrdersModalProps> = ({
  isOpen,
  currencyCode = 'USD',
  onClose,
  orders,
  onSelectOrder,
  onDeleteOrder,
  onClearAllOrders,
  initialTab = 'pending',
}) => {
  const { t } = useTranslation();
  const [filterTab, setFilterTab] = useState<'pending' | 'history'>(initialTab);

  // Each time the window opens, start on the requested tab
  useEffect(() => {
    if (isOpen) setFilterTab(initialTab);
  }, [isOpen, initialTab]);

  // Diagnostic line: only appears if the page address contains ?debug
  const debugOn = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug');
  const [debugText, setDebugText] = useState('');
  useEffect(() => {
    if (!debugOn || !isOpen) return;
    (async () => {
      let saved = -1;
      try {
        saved = JSON.parse(localStorage.getItem('apexparts_orders') || '[]').length;
      } catch {
        saved = -1;
      }
      let server = -1;
      try {
        const r = await fetch('/api/orders');
        const d = await r.json();
        server = (d.orders || []).length;
      } catch {
        server = -1;
      }
      setDebugText(
        `Page: ${window.location.origin} | orders on this screen: ${orders.length} | saved in this browser: ${saved} | on the server: ${server}  (-1 = could not read)`
      );
    })();
  }, [debugOn, isOpen, orders]);

  const validOrders = useMemo(() => orders.filter((o) => !isMockupOrder(o)), [orders]);

  const pendingOrders = useMemo(
    () => validOrders.filter(isPendingOrder),
    [validOrders]
  );

  // Successfully paid orders (screenshot verified) live in the Payment History tab
  const historyOrders = useMemo(() => validOrders.filter(isPaidOrder), [validOrders]);

  const displayedOrders = useMemo(() => {
    if (filterTab === 'pending') {
      return pendingOrders;
    }
    return historyOrders;
  }, [filterTab, pendingOrders, historyOrders]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl overflow-hidden z-10 border border-slate-200 max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-[#ff6600]" />
            <h2 className="font-bold text-sm sm:text-base">
              My Orders ({validOrders.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100 px-5 pt-2">
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setFilterTab('pending')}
              className={`pb-2.5 px-3 font-bold text-xs flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                filterTab === 'pending'
                  ? 'border-[#ff6600] text-[#ff6600] bg-white rounded-t-lg shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pending Orders ({pendingOrders.length})</span>
              {pendingOrders.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setFilterTab('history')}
              className={`pb-2.5 px-3 font-bold text-xs flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                filterTab === 'history'
                  ? 'border-[#ff6600] text-[#ff6600] bg-white rounded-t-lg shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Payment History ({historyOrders.length})</span>
            </button>
          </div>

          {onClearAllOrders && validOrders.length > 0 && (
            <button
              type="button"
              onClick={onClearAllOrders}
              className="pb-2 text-[11px] text-red-500 hover:text-red-700 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              title="Clear all stored orders"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear Orders</span>
            </button>
          )}
        </div>

        {debugOn && (
          <div className="px-5 py-1.5 bg-yellow-100 text-yellow-900 text-[11px] font-mono border-b border-yellow-200">
            {debugText || 'checking...'}
          </div>
        )}

        {/* Orders List */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs text-slate-700 bg-slate-50/50">
          {displayedOrders.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Package className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-700 text-sm">
                {filterTab === 'pending' ? 'You have no pending orders at the moment' : 'No successful payments yet'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {filterTab === 'pending'
                  ? validOrders.length > 0
                    ? 'All your orders have been paid and verified.'
                    : 'When you place an order and have not yet uploaded your payment screenshot, it will appear here so you can complete it anytime.'
                  : 'Once your payment screenshot is verified as successful, the order moves here as a completed payment.'}
              </p>
            </div>
          ) : (
            displayedOrders.map((order) => {
              const isPending = isPendingOrder(order);

              return (
                <div
                  key={order.orderId}
                  onClick={() => onSelectOrder(order)}
                  className={`bg-white rounded-lg border p-4 shadow-2xs space-y-3 transition-all cursor-pointer hover:shadow-md ${
                    isPending
                      ? 'border-amber-300 ring-2 ring-amber-100 bg-gradient-to-b from-amber-50/20 to-white'
                      : 'border-slate-200'
                  }`}
                >
                  {/* Order Top Strip */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 text-xs">
                        {order.orderId}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="text-[11px] text-slate-500">{order.createdAt}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                          isPending
                            ? 'text-amber-900 bg-amber-100 border-amber-300 font-bold'
                            : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                        }`}
                      >
                        {isPending ? (
                          <Clock className="w-3 h-3 text-amber-600 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        )}
                        <span>{order.status}</span>
                      </span>

                      <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        Method: {order.paymentDetails.methodLabel}
                      </span>

                      {onDeleteOrder && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm?.('Are you sure you want to delete/cancel this order?') ?? true) {
                              onDeleteOrder(order.orderId);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                          title="Delete / Cancel order"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Items */}
                  <div className="space-y-2">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <img
                          src={it.image}
                          alt={it.partName}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 object-cover rounded border border-slate-200 bg-slate-50 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 truncate">{it.partName}</p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            OEM: {it.oemNumber.split('/')[0]} · {it.quantity} {it.unit}s
                          </p>
                        </div>
                        <span className="font-mono font-bold text-slate-900 tabular-nums">
                          {formatPrice(it.total, currencyCode)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Pending Notice & Action */}
                  {isPending && (
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950">
                      <div className="space-y-0.5">
                        <p className="font-bold flex items-center gap-1.5 text-amber-900">
                          <Clock className="w-4 h-4 text-amber-600" />
                          <span>Awaiting Payment Details & Transfer</span>
                        </p>
                        <p className="text-[11px] text-slate-600">
                          Payment instructions for {order.paymentDetails.methodLabel} sent to: <strong className="text-slate-800">{order.clientEmail}</strong>.
                          Once transferred, post your screenshot here.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {onDeleteOrder && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteOrder(order.orderId);
                            }}
                            className="px-3 py-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 font-semibold rounded-lg transition-colors cursor-pointer text-xs border border-slate-200 hover:border-red-200"
                          >
                            Cancel Order
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectOrder(order);
                          }}
                          className="px-4 py-2 bg-[#ff6600] hover:bg-[#e65c00] text-white font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs shadow-xs"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Payment Screenshot</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Summary bar */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
                    <div className="flex items-center gap-2">
                      <Truck className="w-3.5 h-3.5 text-slate-400" />
                      <span>Carrier: {order.shippingMethod.split('(')[0].trim()}</span>
                      <span>·</span>
                      <span className="font-mono">{order.trackingNumber}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="font-bold text-slate-900 text-xs">
                        Total: <span className="font-mono text-[#ff6600]">{formatPrice(order.total, currencyCode)}</span>
                      </div>

                      {!isPending && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectOrder(order);
                          }}
                          className="text-[#ff6600] hover:underline font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <span>View Official Receipt</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
