import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Camera,
  ShieldCheck,
  ShoppingCart,
  Globe,
  HelpCircle,
  ChevronDown,
  X,
  Wrench,
  Check,
  User as UserIcon,
  LogOut,
  Clock,
} from 'lucide-react';
import { CATEGORY_OPTIONS } from '../data/partsData';
import { CURRENCIES, LANGUAGES } from '../utils/currency';
import { useTranslation } from '../context/LanguageContext';
import { SupportedLanguage } from '../utils/translations';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: (e?: React.FormEvent) => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  cartCount: number;
  ordersCount: number;
  pendingOrdersCount?: number;
  currentCurrency: string;
  onCurrencyChange: (currency: string) => void;
  onOpenCart: () => void;
  onOpenOrders: () => void;
  onOpenPendingOrders?: () => void;
  onOpenImageSearch: () => void;
  onOpenHelpCenter: () => void;
  onOpenPartRequest: () => void;
  onResetFilters: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  selectedCategory,
  onSelectCategory,
  cartCount,
  ordersCount,
  pendingOrdersCount = 0,
  currentCurrency,
  onCurrencyChange,
  onOpenCart,
  onOpenOrders,
  onOpenPendingOrders,
  onOpenImageSearch,
  onOpenHelpCenter,
  onOpenPartRequest,
  onResetFilters,
}) => {
  const { t, language, setLanguage } = useTranslation();
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setShowCatDropdown(false);
        setShowCurrencyDropdown(false);
        setShowLanguageDropdown(false);
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Translate category label
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

  const selectedCategoryLabel = getCategoryLabel(selectedCategory);

  const activeCurrencyConfig = CURRENCIES[currentCurrency] || CURRENCIES.USD;
  const activeLanguageObj =
    LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit(e);
  };

  return (
    <header ref={headerRef} className="w-full bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top Utility Bar */}
      <div className="bg-[#181d24] text-[12px] text-slate-300 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <span className="text-slate-400 hidden sm:inline">
              {t.topBarSubtitle}
            </span>
            <div className="flex items-center gap-1.5 text-[#ff8533] font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t.buyerProtectionTag}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-4 relative">
            {/* Working Currency Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowCurrencyDropdown(!showCurrencyDropdown);
                  setShowLanguageDropdown(false);
                }}
                className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors cursor-pointer py-0.5"
              >
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold">{currentCurrency}</span>
                <span className="text-slate-400">({activeCurrencyConfig.symbol})</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showCurrencyDropdown && (
                <div className="absolute top-full right-0 mt-1 w-52 bg-white text-slate-800 border border-slate-200 rounded-md shadow-xl py-1 z-50 text-xs">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    {t.selectCurrency}
                  </div>
                  {Object.values(CURRENCIES).map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => {
                        onCurrencyChange(c.code);
                        setShowCurrencyDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-orange-50 hover:text-[#ff6600] transition-colors cursor-pointer ${
                        currentCurrency === c.code ? 'font-bold text-[#ff6600] bg-orange-50/50' : ''
                      }`}
                    >
                      <span>{c.name}</span>
                      <span className="font-mono text-slate-400 font-semibold">{c.symbol}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Working Language Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowLanguageDropdown(!showLanguageDropdown);
                  setShowCurrencyDropdown(false);
                }}
                className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer py-0.5"
              >
                <span>{activeLanguageObj.flag}</span>
                <span className="font-medium">{activeLanguageObj.name.split(' ')[0]}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showLanguageDropdown && (
                <div className="absolute top-full right-0 mt-1 w-48 bg-white text-slate-800 border border-slate-200 rounded-md shadow-xl py-1 z-50 text-xs">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    {t.selectLanguage}
                  </div>
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => {
                        setLanguage(l.code as SupportedLanguage);
                        setShowLanguageDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-orange-50 hover:text-[#ff6600] transition-colors cursor-pointer ${
                        language === l.code ? 'font-bold text-[#ff6600] bg-orange-50/50' : ''
                      }`}
                    >
                      <span className="text-base">{l.flag}</span>
                      <span>{l.name}</span>
                      {language === l.code && <Check className="w-3.5 h-3.5 ml-auto text-[#ff6600]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Working Help Center Button */}
            <button
              type="button"
              onClick={onOpenHelpCenter}
              className="flex items-center gap-1 text-slate-300 hover:text-[#ff8533] transition-colors cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>{t.helpCenter}</span>
            </button>

            {/* Request a Part button */}
            <button
              type="button"
              onClick={onOpenPartRequest}
              className="hidden lg:flex items-center gap-1 text-amber-300 hover:text-white transition-colors cursor-pointer font-medium"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>{t.requestPartRfq}</span>
            </button>

            {/* Account / Auth Trigger */}
            <div className="relative">
              {isAuthenticated && user ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowUserDropdown(!showUserDropdown);
                    setShowCurrencyDropdown(false);
                    setShowLanguageDropdown(false);
                  }}
                  className="flex items-center gap-1.5 text-slate-200 hover:text-white transition-colors cursor-pointer py-0.5"
                >
                  <div className="w-5 h-5 rounded-full bg-[#ff6600] text-white flex items-center justify-center font-bold text-[10px]">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-xs max-w-[110px] truncate">{user.fullName.split(' ')[0]}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
              ) : (
                <div className="flex items-center gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => openAuthModal('login')}
                    className="text-slate-300 hover:text-[#ff8533] font-medium transition-colors cursor-pointer"
                  >
                    Sign In
                  </button>
                  <span className="text-slate-600">/</span>
                  <button
                    type="button"
                    onClick={() => openAuthModal('register')}
                    className="text-[#ff8533] hover:text-white font-semibold transition-colors cursor-pointer"
                  >
                    Join Free
                  </button>
                </div>
              )}

              {/* User Account Dropdown */}
              {showUserDropdown && user && (
                <div className="absolute top-full right-0 mt-1 w-64 bg-white text-slate-800 border border-slate-200 rounded-md shadow-xl py-2 z-50 text-xs">
                  <div className="px-3 pb-2 border-b border-slate-100">
                    <p className="font-bold text-slate-900 truncate">{user.fullName}</p>
                    <p className="text-[11px] text-[#ff6600] font-mono truncate">{user.email}</p>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      ✓ Registered for payment emails
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowUserDropdown(false);
                      onOpenOrders();
                    }}
                    className="w-full text-left px-3 py-2 flex items-center justify-between hover:bg-orange-50 hover:text-[#ff6600] transition-colors cursor-pointer"
                  >
                    <span>My Orders & Invoices</span>
                    <span className="font-mono text-slate-500 font-bold">{ordersCount}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowUserDropdown(false);
                      onOpenPartRequest();
                    }}
                    className="w-full text-left px-3 py-2 flex items-center justify-between hover:bg-orange-50 hover:text-[#ff6600] transition-colors cursor-pointer"
                  >
                    <span>Request Custom Part (RFQ)</span>
                  </button>

                  <div className="pt-1 mt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserDropdown(false);
                        logout();
                      }}
                      className="w-full text-left px-3 py-2 flex items-center gap-2 text-red-600 hover:bg-red-50 transition-colors cursor-pointer font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3.5">
        <div className="flex items-center justify-between gap-3 md:gap-6">
          {/* Brand Wordmark (Brand Name: ApexParts Global) */}
          <div
            onClick={onResetFilters}
            className="flex items-center gap-2.5 cursor-pointer shrink-0 select-none"
          >
            <div className="w-9 h-9 rounded-lg bg-linear-to-tr from-[#e65100] to-[#ff6600] flex items-center justify-center text-white font-black text-xl shadow-xs">
              AP
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl md:text-2xl tracking-tight text-slate-900 leading-none">
                APEX<span className="text-[#ff6600]">PARTS</span>
              </span>
              <span className="text-[10px] tracking-wider text-slate-400 font-semibold uppercase">
                Global Automotive Direct
              </span>
            </div>
          </div>

          {/* Search Box with Category Selector & Image Search */}
          {/* Search Box with Category Selector & Image Search */}
          <div className="flex-1 min-w-0 max-w-2xl mx-1 md:mx-3">
            <form onSubmit={handleFormSubmit} className="relative flex items-center">
              <div className="flex w-full rounded-md border-2 border-[#ff6600] bg-white overflow-hidden shadow-xs focus-within:ring-2 focus-within:ring-[#ff6600]/30 transition-all">
                {/* Category Dropdown inside search bar */}
                <div className="relative hidden md:block border-r border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowCatDropdown(!showCatDropdown)}
                    className="h-10 px-3 bg-slate-50 text-xs font-medium text-slate-700 flex items-center gap-1 hover:bg-slate-100 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <span className="max-w-[130px] truncate">{selectedCategoryLabel}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {showCatDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-200 rounded-md shadow-xl py-1 z-50">
                      {CATEGORY_OPTIONS.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            onSelectCategory(cat.id);
                            setShowCatDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs hover:bg-orange-50 hover:text-[#ff6600] transition-colors cursor-pointer ${
                            selectedCategory === cat.id
                              ? 'bg-orange-50/60 font-semibold text-[#ff6600]'
                              : 'text-slate-700'
                          }`}
                        >
                          {getCategoryLabel(cat.id)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Search Input Field */}
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={t.placeholderSearch || t.searchPlaceholder}
                  className="flex-1 min-w-0 h-10 px-3.5 text-xs md:text-sm text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-hidden"
                />

                {/* Clear Input Button */}
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    className="p-2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                {/* Image Search Camera Button */}
                <button
                  type="button"
                  onClick={onOpenImageSearch}
                  title={t.searchByPhoto}
                  className="h-10 px-2.5 text-slate-500 hover:text-[#ff6600] hover:bg-orange-50 transition-colors flex items-center justify-center border-l border-slate-200 cursor-pointer shrink-0"
                >
                  <Camera className="w-4 h-4" />
                </button>

                {/* Primary Search Button */}
                <button
                  type="submit"
                  className="h-10 px-3 sm:px-4 md:px-6 bg-[#ff6600] hover:bg-[#e65c00] active:bg-[#cc5200] text-white font-semibold text-xs md:text-sm flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                >
                  <Search className="w-4 h-4 stroke-[2.5]" />
                  <span className="hidden sm:inline">{t.search}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Action Navigation Zone */}
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 shrink-0">
            {/* Sign In button (only when logged out).
                Once logged in, the account menu in the top strip is used instead. */}
            {!(isAuthenticated && user) && (
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-slate-700 hover:text-[#ff6600] hover:bg-orange-50 border border-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0"
              >
                <UserIcon className="w-4 h-4 text-[#ff6600]" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}

            {/* Pending Orders Button: ALWAYS visible in the top bar.
                - with unpaid orders: highlighted, with a counter
                - with none: neutral; clicking it says there are no pending orders */}
            <button
              type="button"
              onClick={() => (onOpenPendingOrders ?? onOpenOrders)()}
              className={`relative flex items-center gap-1.5 px-2.5 sm:px-3 py-2 border rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                pendingOrdersCount > 0
                  ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-950 shadow-2xs'
                  : 'bg-white hover:bg-orange-50 border-slate-200 hover:border-orange-200 text-slate-700 hover:text-[#ff6600]'
              }`}
              title={
                pendingOrdersCount > 0
                  ? 'Go back to your unpaid order to upload your payment screenshot'
                  : 'You have no pending orders at the moment'
              }
            >
              <Clock className={`w-4 h-4 shrink-0 ${pendingOrdersCount > 0 ? 'text-amber-600' : 'text-[#ff6600]'}`} />
              <span className="hidden sm:inline whitespace-nowrap">{t.pendingOrders || 'Pending Orders'}</span>
              {pendingOrdersCount > 0 && (
                <span className="bg-amber-500 text-white text-[11px] font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center">
                  {pendingOrdersCount}
                </span>
              )}
            </button>

            {/* Request a Part Button */}
            <button
              onClick={onOpenPartRequest}
              className="hidden sm:flex md:hidden lg:flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-slate-700 hover:text-[#ff6600] hover:bg-orange-50 border border-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0"
            >
              <Wrench className="w-4 h-4 text-[#ff6600]" />
              <span className="whitespace-nowrap">{t.requestPartRfq.split('(')[0].trim()}</span>
            </button>

            {/* Shopping Cart Drawer Trigger */}
            <button
              onClick={onOpenCart}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 bg-slate-100 hover:bg-orange-50 hover:text-[#ff6600] border border-slate-200 hover:border-orange-200 rounded-lg transition-all relative group cursor-pointer shrink-0"
            >
              <div className="relative shrink-0">
                <ShoppingCart className="w-5 h-5 text-slate-700 group-hover:text-[#ff6600] transition-colors" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2.5 bg-[#ff6600] text-white text-[11px] font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center border-2 border-white">
                    {cartCount}
                  </span>
                )}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-[10px] text-slate-500 leading-none">{t.cart}</span>
                <span className="text-xs font-bold text-slate-800 leading-tight whitespace-nowrap">
                  {cartCount} {cartCount === 1 ? t.item : t.items}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
