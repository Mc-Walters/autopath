import React from 'react';
import { ShieldCheck, Truck, Percent, CheckCircle2, ArrowRight, Wrench } from 'lucide-react';
import { HERO_IMAGE } from '../data/partsData';
import { useTranslation } from '../context/LanguageContext';

interface HeroBannerProps {
  onExploreMicro: () => void;
  onExploreAssemblies: () => void;
  onOpenPartRequest: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onExploreMicro,
  onExploreAssemblies,
  onOpenPartRequest,
}) => {
  const { t } = useTranslation();

  return (
    <div className="relative w-full overflow-hidden bg-slate-900 border-b border-slate-800">
      {/* Background Graphic with overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={HERO_IMAGE}
          alt="Automotive parts and precision hardware"
          className="w-full h-full object-cover object-center opacity-30 mix-blend-luminosity filter contrast-125"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-linear-to-r from-slate-950 via-slate-950/85 to-slate-900/40" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="max-w-2xl">
          {/* Subheading Trust Kicker */}
          <div className="flex items-center gap-2 text-xs font-semibold text-[#ff8533] uppercase tracking-wider mb-2">
            <span>{t.heroKicker}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight mb-3">
            {t.heroHeadline1} <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-white via-orange-100 to-[#ff8533]">
              {t.heroHeadline2}
            </span>
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6 max-w-xl">
            {t.heroSubtitle}
          </p>

          {/* Quick CTA Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onExploreMicro}
              className="px-4 py-2.5 bg-[#ff6600] hover:bg-[#e65c00] active:bg-[#cc5200] text-white text-xs sm:text-sm font-semibold rounded-md shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span>{t.shopMicroBtn}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onExploreAssemblies}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs sm:text-sm font-semibold rounded-md transition-colors cursor-pointer"
            >
              <span>{t.exploreAssembliesBtn}</span>
            </button>

            <button
              onClick={onOpenPartRequest}
              className="px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs sm:text-sm font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Wrench className="w-4 h-4" />
              <span>{t.cantFindPartBtn}</span>
            </button>
          </div>
        </div>

        {/* 4 Trust Value Pillars */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8 pt-6 border-t border-slate-800/80 text-white">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#ff8533] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-white">{t.pillar1Title}</p>
              <p className="text-[11px] text-slate-400">{t.pillar1Desc}</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Percent className="w-5 h-5 text-[#ff8533] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-white">{t.pillar2Title}</p>
              <p className="text-[11px] text-slate-400">{t.pillar2Desc}</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-[#ff8533] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-white">{t.pillar3Title}</p>
              <p className="text-[11px] text-slate-400">{t.pillar3Desc}</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Truck className="w-5 h-5 text-[#ff8533] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-white">{t.pillar4Title}</p>
              <p className="text-[11px] text-slate-400">{t.pillar4Desc}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
