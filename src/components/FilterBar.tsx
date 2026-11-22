import React from 'react';
import { SlidersHorizontal, ArrowUpDown, ShieldCheck, Zap, X } from 'lucide-react';
import { FilterState } from '../types';
import { useTranslation } from '../context/LanguageContext';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (updates: Partial<FilterState>) => void;
  totalResults: number;
  onOpenMobileFilters: () => void;
  onResetFilters: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  totalResults,
  onOpenMobileFilters,
  onResetFilters,
}) => {
  const { t } = useTranslation();

  const categories = [
    { id: 'all', label: t.catAll },
    { id: 'micro-hardware', label: t.catMicro },
    { id: 'tires-wheels', label: t.catTires },
    { id: 'body-exterior', label: t.catBody },
    { id: 'cabin-interior', label: t.catInterior },
    { id: 'braking-suspension', label: t.catBrakes },
    { id: 'engine-transmission', label: t.catEngine },
    { id: 'electrical-sensors', label: t.catElectrical },
    { id: 'cooling-exhaust', label: t.catCooling },
  ];

  const hasActiveFilters =
    filters.category !== 'all' ||
    filters.vehicleMake !== 'All Vehicles' ||
    filters.minPrice !== null ||
    filters.maxPrice !== null ||
    filters.condition !== 'all' ||
    filters.tradeAssuranceOnly ||
    filters.readyToShipOnly ||
    filters.verifiedOnly ||
    filters.searchQuery.trim() !== '';

  return (
    <div className="w-full bg-white rounded-lg border border-slate-200 p-3 mb-4 shadow-2xs">
      {/* Category Segmented Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-100 no-scrollbar">
        {categories.map((tab) => {
          const isActive = filters.category === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onFilterChange({ category: tab.id })}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#ff6600] text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Secondary Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5">
        <div className="flex items-center gap-2">
          {/* Mobile Filter Trigger Button */}
          <button
            onClick={onOpenMobileFilters}
            className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-md border border-slate-200 transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{t.filterParts}</span>
          </button>

          {/* Quick Checkbox Chips */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => onFilterChange({ tradeAssuranceOnly: !filters.tradeAssuranceOnly })}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded border transition-colors cursor-pointer ${
                filters.tradeAssuranceOnly
                  ? 'bg-orange-50 border-[#ff6600] text-[#ff6600] font-medium'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t.escrowProtected}</span>
            </button>

            <button
              onClick={() => onFilterChange({ readyToShipOnly: !filters.readyToShipOnly })}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded border transition-colors cursor-pointer ${
                filters.readyToShipOnly
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-700 font-medium'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.readyToShipShort}</span>
            </button>

            <button
              onClick={() => onFilterChange({ verifiedOnly: !filters.verifiedOnly })}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded border transition-colors cursor-pointer ${
                filters.verifiedOnly
                  ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <span>{t.auditedFactory}</span>
            </button>
          </div>
        </div>

        {/* Right side: Result Count & Sort Dropdown */}
        <div className="flex items-center gap-3 ml-auto">
          <span className="text-xs text-slate-500 hidden md:inline">
            <strong className="text-slate-800 tabular-nums">{totalResults}</strong> {t.partsFound}
          </span>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">{t.sortBy}</span>
            <select
              value={filters.sortBy}
              onChange={(e) => onFilterChange({ sortBy: e.target.value as FilterState['sortBy'] })}
              className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 font-medium focus:outline-hidden focus:border-[#ff6600]"
            >
              <option value="featured">{t.sortFeatured}</option>
              <option value="price-asc">{t.sortPriceAsc}</option>
              <option value="price-desc">{t.sortPriceDesc}</option>
              <option value="orders-desc">{t.sortOrdersDesc}</option>
              <option value="rating-desc">{t.sortRatingDesc}</option>
            </select>
          </div>

          {/* Reset Filters indicator */}
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="flex items-center gap-1 text-[11px] text-red-600 hover:text-red-700 hover:underline font-medium ml-1 cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span className="hidden sm:inline">{t.resetAll}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
