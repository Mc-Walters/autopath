import React, { useState } from 'react';
import { X, Camera, Upload, Sparkles } from 'lucide-react';
import {
  FASTENERS_IMAGE,
  BRAKES_IMAGE,
  ENGINE_IMAGE,
  ELECTRICAL_IMAGE,
  TIRES_IMAGE,
  BODY_IMAGE,
  INTERIOR_IMAGE,
} from '../data/partsData';
import { useTranslation } from '../context/LanguageContext';

interface ImageSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSearchTarget: (query: string, category: string) => void;
}

export const ImageSearchModal: React.FC<ImageSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectSearchTarget,
}) => {
  const { t } = useTranslation();
  const [analyzing, setAnalyzing] = useState(false);

  if (!isOpen) return null;

  const sampleParts = [
    {
      id: 'micro',
      title: 'Micro Fasteners & Push Clips',
      category: 'micro-hardware',
      query: 'clips fasteners washers',
      image: FASTENERS_IMAGE,
      desc: 'Nylon rivets, copper washers, blade fuses',
    },
    {
      id: 'tires',
      title: 'Tires & Forged Wheels',
      category: 'tires-wheels',
      query: 'tire wheel rim',
      image: TIRES_IMAGE,
      desc: 'Radial sports tires, forged rims, lug nuts',
    },
    {
      id: 'body',
      title: 'Body Panels & Mirrors',
      category: 'body-exterior',
      query: 'bumper mirror splitter fender',
      image: BODY_IMAGE,
      desc: 'Carbon front lips, side mirrors, fenders',
    },
    {
      id: 'interior',
      title: 'Cabin & Interior Parts',
      category: 'cabin-interior',
      query: 'cabin filter window motor shift knob',
      image: INTERIOR_IMAGE,
      desc: 'HEPA filters, window motors, shift knobs',
    },
    {
      id: 'brakes',
      title: 'Brake Calipers & Rotors',
      category: 'braking-suspension',
      query: 'caliper rotor brake pads',
      image: BRAKES_IMAGE,
      desc: 'Vented discs, calipers, ceramic pads',
    },
    {
      id: 'engine',
      title: 'Pistons, Turbos & Engine',
      category: 'engine-transmission',
      query: 'piston turbocharger injector',
      image: ENGINE_IMAGE,
      desc: 'Forged pistons, impellers, turbochargers',
    },
  ];

  const handleSelectSample = (sample: (typeof sampleParts)[0]) => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      onSelectSearchTarget(sample.query, sample.category);
      onClose();
    }, 600);
  };

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAnalyzing(true);
      setTimeout(() => {
        setAnalyzing(false);
        onSelectSearchTarget('clips fasteners bolts', 'micro-hardware');
        onClose();
      }, 800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden z-10 border border-slate-200">
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#ff6600]" />
            <h2 className="font-bold text-sm">{t.searchByPhoto}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs text-slate-700">
          <p className="text-slate-600">
            Take or upload a picture of any broken car bolt, trim clip, wheel, or engine component to match against 500,000+ factory SKUs.
          </p>

          {/* Upload Dropzone */}
          <label className="border-2 border-dashed border-slate-300 hover:border-[#ff6600] rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-orange-50/40 transition-colors">
            <Upload className="w-8 h-8 text-slate-400 mb-2" />
            <span className="font-bold text-slate-800 text-sm">Upload Car Part Photo</span>
            <span className="text-[11px] text-slate-500 mt-0.5">Drag and drop or browse files (JPG, PNG)</span>
            <input type="file" accept="image/*" onChange={handleCustomUpload} className="hidden" />
          </label>

          {/* Sample Photos for 1-Click Visual Search */}
          <div>
            <div className="flex items-center gap-1.5 mb-2 font-bold text-slate-900 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#ff6600]" />
              <span>Or click a sample automotive category to match:</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {sampleParts.map((sample) => (
                <div
                  key={sample.id}
                  onClick={() => handleSelectSample(sample)}
                  className="p-2 border border-slate-200 hover:border-[#ff6600] rounded-lg cursor-pointer flex gap-2 items-center bg-white hover:bg-orange-50/30 transition-all group"
                >
                  <img
                    src={sample.image}
                    alt={sample.title}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 object-cover rounded bg-slate-100 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 text-[11px] group-hover:text-[#ff6600] truncate">
                      {sample.title}
                    </p>
                    <p className="text-[10px] text-slate-500 line-clamp-1">{sample.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {analyzing && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center justify-center gap-2 text-xs text-[#ff6600] font-semibold">
              <div className="w-4 h-4 border-2 border-[#ff6600] border-t-transparent rounded-full animate-spin" />
              <span>Analyzing automotive part geometry & matching OE codes...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
