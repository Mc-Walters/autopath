import React from 'react';
import { Menu, Car, Zap } from 'lucide-react';
import { VEHICLE_MAKES, CATEGORY_OPTIONS } from '../data/partsData';
import { useTranslation } from '../context/LanguageContext';

interface SecondaryNavProps {
  selectedCategory: string;
  onSelectCategory: (catId: string) => void;
  selectedVehicle: string;
  onSelectVehicle: (make: string) => void;
  readyToShipOnly: boolean;
  onToggleReadyToShip: () => void;
}

export const SecondaryNav: React.FC<SecondaryNavProps> = ({
  selectedCategory,
  onSelectCategory,
  selectedVehicle,
  onSelectVehicle,
  readyToShipOnly,
  onToggleReadyToShip,
}) => {
  const { t } = useTranslation();

  const getCategoryLabel = (id: string) => {
    switch (id) {
      case 'all':
        return t.catAll;
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
        return t.catAll;
    }
  };

  return (
    <div className="w-full bg-[#1e2329] text-white text-xs border-b border-slate-700 select-none">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row md:items-center justify-between gap-2 py-2">
        {/* Category Links */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth">
          {/* All Categories Button */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ff6600] font-semibold text-white rounded-md shrink-0 cursor-default">
            <Menu className="w-3.5 h-3.5" />
            <span>{t.categories}</span>
          </div>

          <div className="flex items-center gap-1 pl-1">
            {CATEGORY_OPTIONS.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors text-xs font-medium cursor-pointer ${
                    isActive
                      ? 'bg-slate-700 text-[#ff8533] font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {getCategoryLabel(cat.id)}
                </button>
              );
            })}

            {/* Ready to Ship Pill Toggle */}
            <button
              onClick={onToggleReadyToShip}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md whitespace-nowrap transition-colors text-xs font-medium ml-1 cursor-pointer ${
                readyToShipOnly
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'text-emerald-400 hover:bg-slate-800'
              }`}
            >
              <Zap className="w-3 h-3" />
              <span>{t.readyToShip}</span>
            </button>
          </div>
        </div>

        {/* Vehicle Fitment Filter Bar */}
        <div className="flex items-center gap-2 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700 shrink-0 self-start md:self-auto">
          <Car className="w-3.5 h-3.5 text-[#ff8533]" />
          <span className="text-[11px] text-slate-300 font-medium hidden sm:inline">{t.fitmentLabel}</span>
          <select
            value={selectedVehicle}
            onChange={(e) => onSelectVehicle(e.target.value)}
            className="bg-slate-900 text-white text-[11px] font-medium rounded px-2 py-0.5 border border-slate-600 focus:outline-hidden focus:border-[#ff6600]"
          >
            {VEHICLE_MAKES.map((make) => (
              <option key={make} value={make}>
                {make === 'All Vehicles' ? t.allVehicles : `${t.fits} ${make}`}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
