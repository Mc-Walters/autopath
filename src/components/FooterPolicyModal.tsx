import React from 'react';
import { X, ShieldCheck, FileText, CheckCircle2, Lock, ArrowRight } from 'lucide-react';

export interface PolicyModalData {
  title: string;
  category: 'protection' | 'payment' | 'legal';
  content: string[];
}

interface FooterPolicyModalProps {
  data: PolicyModalData | null;
  isOpen: boolean;
  onClose: () => void;
  onGoToRfq?: () => void;
}

export const FooterPolicyModal: React.FC<FooterPolicyModalProps> = ({
  data,
  isOpen,
  onClose,
  onGoToRfq,
}) => {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl overflow-hidden z-10 border border-slate-200">
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#ff6600]" />
            <h2 className="font-bold text-sm sm:text-base">{data.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4 text-xs text-slate-700 leading-relaxed bg-slate-50/40">
          <div className="space-y-3">
            {data.content.map((paragraph, index) => (
              <p key={index} className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                {paragraph}
              </p>
            ))}
          </div>

          {data.title.includes('Quotation') && onGoToRfq && (
            <div className="pt-2">
              <button
                onClick={() => {
                  onClose();
                  onGoToRfq();
                }}
                className="w-full py-2.5 bg-[#ff6600] hover:bg-[#e65c00] text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <span>Open Custom Part Sourcing Form (RFQ)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
