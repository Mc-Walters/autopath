import React, { useState } from 'react';
import { Filter, ShieldCheck, Zap, RotateCcw, Check } from 'lucide-react';
import { FilterState } from '../types';
import { VEHICLE_MAKES } from '../data/partsData';
import { useTranslation } from '../context/LanguageContext';

interface SidebarFiltersProps {
  filters: FilterState;
  onFilterChange: (updates: Partial<FilterState>) => void;
  onResetFilters: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const SidebarFilters: React.FC<SidebarFiltersProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { t } = useTranslation();
  const [localMin, setLocalMin] = useState(filters.minPrice !== null ? String(filters.minPrice) : '');
  const [localMax, setLocalMax] = useState(filters.maxPrice !== null ? String(filters.maxPrice) : '');

  const handleApplyPrice = (e: React.FormEvent) => {
    e.preventDefault();
    const min = localMin.trim() !== '' ? parseFloat(localMin) : null;
    const max = localMax.trim() !== '' ? parseFloat(localMax) : null;
    onFilterChange({
      minPrice: isNaN(min as number) ? null : min,
      maxPrice: isNaN(max as number) ? null : max,
    });
  };

  const conditions = [
    { id: 'all', label: t.allConditions },
    { id: 'OEM Genuine', label: t.condOem },
    { id: 'Aftermarket Heavy-Duty', label: t.condAftermarket },
    { id: 'Performance Racing', label: t.condRacing },
  ];

  const moqRanges = [
    { label: t.anyMoq, min: null, max: null },
    { label: t.singleUnitRetail, min: 1, max: 4 },
    { label: t.smallBatch, min: 5, max: 49 },
    { label: t.wholesaleLots, min: 50, max: null },
  ];

  const content = (
    <div className="flex flex-col gap-5 text-xs text-slate-700">
      {/* Header of Sidebar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#ff6600]" />
          <h2 className="text-sm font-bold text-slate-900">{t.filterParts}</h2>
        </div>
        <button
          onClick={onResetFilters}
          className="flex items-center gap-1 text-[11px] text-[#ff6600] hover:underline font-medium cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>{t.resetAll}</span>
        </button>
      </div>

      {/* Vehicle Compatibility Filter */}
      <div>
        <h3 className="font-bold text-slate-900 mb-2 text-xs uppercase tracking-wide">
          {t.vehicleFitment}
        </h3>
        <select
          value={filters.vehicleMake}
          onChange={(e) => onFilterChange({ vehicleMake: e.target.value })}
          className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 font-medium focus:outline-hidden focus:border-[#ff6600]"
        >
          {VEHICLE_MAKES.map((make) => (
            <option key={make} value={make}>
              {make === 'All Vehicles' ? t.allCompatible : `${t.fits} ${make}`}
            </option>
          ))}
        </select>
      </div>

      {/* Price Range Filter Form */}
      <div>
        <h3 className="font-bold text-slate-900 mb-2 text-xs uppercase tracking-wide">
          {t.priceRange}
        </h3>
        <form onSubmit={handleApplyPrice} className="flex items-center gap-1.5">
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Min $"
            value={localMin}
            onChange={(e) => setLocalMin(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-[#ff6600]"
          />
          <span className="text-slate-400">-</span>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Max $"
            value={localMax}
            onChange={(e) => setLocalMax(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-[#ff6600]"
          />
          <button
            type="submit"
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded font-semibold text-xs transition-colors shrink-0 cursor-pointer"
          >
            {t.go}
          </button>
        </form>
      </div>

      {/* Minimum Order Quantity (MOQ) Filter */}
      <div>
        <h3 className="font-bold text-slate-900 mb-2 text-xs uppercase tracking-wide">
          {t.minOrderMoq}
        </h3>
        <div className="space-y-1.5">
          {moqRanges.map((range, index) => {
            const isSelected =
              filters.minMoq === range.min && filters.maxMoq === range.max;
            return (
              <label
                key={index}
                className="flex items-center gap-2 cursor-pointer hover:text-slate-900"
              >
                <input
                  type="radio"
                  name="moqRange"
                  checked={isSelected}
                  onChange={() =>
                    onFilterChange({
                      minMoq: range.min,
                      maxMoq: range.max,
                    })
                  }
                  className="accent-[#ff6600]"
                />
                <span className={isSelected ? 'font-semibold text-slate-900' : 'text-slate-600'}>
                  {range.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Part Condition Filter */}
      <div>
        <h3 className="font-bold text-slate-900 mb-2 text-xs uppercase tracking-wide">
          {t.partCondition}
        </h3>
        <div className="space-y-1.5">
          {conditions.map((cond) => {
            const isSelected = filters.condition === cond.id;
            return (
              <label
                key={cond.id}
                className="flex items-center gap-2 cursor-pointer hover:text-slate-900"
              >
                <input
                  type="radio"
                  name="partCondition"
                  checked={isSelected}
                  onChange={() => onFilterChange({ condition: cond.id })}
                  className="accent-[#ff6600]"
                />
                <span className={isSelected ? 'font-semibold text-slate-900' : 'text-slate-600'}>
                  {cond.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Supplier Services & Protections */}
      <div className="pt-2 border-t border-slate-200">
        <h3 className="font-bold text-slate-900 mb-2 text-xs uppercase tracking-wide">
          {t.buyerAssurances}
        </h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
            <input
              type="checkbox"
              checked={filters.tradeAssuranceOnly}
              onChange={(e) => onFilterChange({ tradeAssuranceOnly: e.target.checked })}
              className="accent-[#ff6600] rounded"
            />
            <div className="flex items-center gap-1 text-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-[#ff6600]" />
              <span className="font-medium">{t.escrowProtected}</span>
            </div>
          </label>

          <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
            <input
              type="checkbox"
              checked={filters.readyToShipOnly}
              onChange={(e) => onFilterChange({ readyToShipOnly: e.target.checked })}
              className="accent-[#ff6600] rounded"
            />
            <div className="flex items-center gap-1 text-slate-700">
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-medium">{t.readyToShipShort}</span>
            </div>
          </label>

          <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
            <input
              type="checkbox"
              checked={filters.verifiedOnly}
              onChange={(e) => onFilterChange({ verifiedOnly: e.target.checked })}
              className="accent-[#ff6600] rounded"
            />
            <div className="flex items-center gap-1 text-slate-700">
              <Check className="w-3.5 h-3.5 text-blue-600" />
              <span className="font-medium">{t.auditedFactory}</span>
            </div>
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="bg-white rounded-lg border border-slate-200 p-4 sticky top-24 shadow-2xs">
          {content}
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative ml-auto w-full max-w-xs h-full bg-white p-5 overflow-y-auto shadow-2xl z-10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
                <span className="font-bold text-sm text-slate-900">{t.filterParts}</span>
                <button
                  onClick={onCloseMobile}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  ✕
                </button>
              </div>
              {content}
            </div>

            <div className="pt-4 mt-6 border-t border-slate-200">
              <button
                onClick={onCloseMobile}
                className="w-full py-2.5 bg-[#ff6600] text-white font-bold rounded text-xs shadow-xs cursor-pointer"
              >
                {t.applyFilters}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
