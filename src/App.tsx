import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { FilterBar } from './components/FilterBar';
import { SidebarFilters } from './components/SidebarFilters';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { OrderCheckoutModal } from './components/OrderCheckoutModal';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { CartDrawer } from './components/CartDrawer';
import { ImageSearchModal } from './components/ImageSearchModal';
import { OrdersModal } from './components/OrdersModal';
import { HelpCenterModal } from './components/HelpCenterModal';
import { FooterPolicyModal, PolicyModalData } from './components/FooterPolicyModal';
import { PartRequestSection } from './components/PartRequestSection';
import { AuthModal } from './components/AuthModal';
import { Footer } from './components/Footer';
import { CAR_PARTS_DATA } from './data/partsData';
import { CarPart, CartItem, FilterState, OrderRecord, PartRequest } from './types';
import { PackageSearch, RotateCcw, Wrench } from 'lucide-react';
import { useTranslation } from './context/LanguageContext';
import { api } from './services/api';
import { isMockupOrder, isPendingOrder, upsertOrder, mergeOrders } from './utils/orders';

export default function App() {
  const { t, language, setLanguage } = useTranslation();

  // --- Global Currency State ---
  const [currentCurrency, setCurrentCurrency] = useState<string>('USD');

  // --- Filter State ---
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    category: 'all',
    vehicleMake: 'All Vehicles',
    minPrice: null,
    maxPrice: null,
    minMoq: null,
    maxMoq: null,
    condition: 'all',
    tradeAssuranceOnly: false,
    verifiedOnly: false,
    readyToShipOnly: false,
    sortBy: 'featured',
  });

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // --- Cart State ---
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);

  // --- Orders State (Loaded from backend + local cache fallback, with zero mockup data) ---
  const [orders, setOrders] = useState<OrderRecord[]>(() => {
    try {
      const saved = localStorage.getItem('apexparts_orders');
      if (saved) {
        const parsed: OrderRecord[] = JSON.parse(saved);
        const filtered = Array.isArray(parsed) ? parsed.filter((o) => !isMockupOrder(o)) : [];
        localStorage.setItem('apexparts_orders', JSON.stringify(filtered));
        return filtered;
      }
      return [];
    } catch {
      return [];
    }
  });

  // Load orders and RFQ history from backend
  useEffect(() => {
    api.getOrders().then((backendOrders) => {
      if (backendOrders && backendOrders.length > 0) {
        setOrders((prev) => {
          const map = new Map<string, OrderRecord>();
          backendOrders.filter((o) => !isMockupOrder(o)).forEach((o) => map.set(o.orderId, o));
          prev.filter((o) => !isMockupOrder(o)).forEach((o) => {
            if (!map.has(o.orderId)) map.set(o.orderId, o);
          });
          const merged = Array.from(map.values());
          try {
            localStorage.setItem('apexparts_orders', JSON.stringify(merged));
          } catch {
            // ignore
          }
          return merged;
        });
      }
    });

    api.getRfqs().then((backendRfqs) => {
      if (backendRfqs && backendRfqs.length > 0) {
        setPartRequests(backendRfqs);
      }
    });
  }, []);

  useEffect(() => {
    try {
      const sanitized = orders.filter((o) => !isMockupOrder(o));
      localStorage.setItem('apexparts_orders', JSON.stringify(sanitized));
    } catch {
      // ignore
    }
  }, [orders]);

  // Order deletion and clearing handlers
  const handleDeleteOrder = async (orderId: string) => {
    setOrders((prev) => {
      const updated = prev.filter((o) => o.orderId !== orderId);
      try {
        localStorage.setItem('apexparts_orders', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    try {
      await api.deleteOrder(orderId);
    } catch {
      // ignore backend error if offline
    }
  };

  const handleClearAllOrders = async () => {
    setOrders([]);
    try {
      localStorage.removeItem('apexparts_orders');
      await api.clearOrders();
    } catch {
      // ignore
    }
  };

  // --- Custom Part Sourcing Inquiries (RFQ) State ---
  const [partRequests, setPartRequests] = useState<PartRequest[]>([]);

  // --- Modal States ---
  const [activeDetailPart, setActiveDetailPart] = useState<CarPart | null>(null);
  const [checkoutPart, setCheckoutPart] = useState<CarPart | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCheckoutFromCart, setIsCheckoutFromCart] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<OrderRecord | null>(null);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [ordersInitialTab, setOrdersInitialTab] = useState<'pending' | 'history'>('pending');
  const [isImageSearchOpen, setIsImageSearchOpen] = useState(false);
  const [isHelpCenterOpen, setIsHelpCenterOpen] = useState(false);

  // Footer Policy Modal State
  const [activePolicyData, setActivePolicyData] = useState<PolicyModalData | null>(null);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);

  // Ref for auto-scrolling to catalog or RFQ section
  const catalogRef = useRef<HTMLDivElement>(null);

  const scrollToPartRequest = () => {
    const el = document.getElementById('custom-part-request');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToCatalog = () => {
    if (catalogRef.current) {
      catalogRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // --- Filter Handlers ---
  const handleFilterUpdate = (updates: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      category: 'all',
      vehicleMake: 'All Vehicles',
      minPrice: null,
      maxPrice: null,
      minMoq: null,
      maxMoq: null,
      condition: 'all',
      tradeAssuranceOnly: false,
      verifiedOnly: false,
      readyToShipOnly: false,
      sortBy: 'featured',
    });
  };

  // --- Filtered & Sorted Parts Computation ---
  const filteredParts = useMemo(() => {
    let result = [...CAR_PARTS_DATA];

    // Search query matching name, OEM number, category, description, tags, vehicle fitment
    if (filters.searchQuery.trim() !== '') {
      const q = filters.searchQuery.toLowerCase().trim();
      result = result.filter(
        (part) =>
          part.name.toLowerCase().includes(q) ||
          part.oemNumber.toLowerCase().includes(q) ||
          part.categoryLabel.toLowerCase().includes(q) ||
          part.tags.some((tag) => tag.toLowerCase().includes(q)) ||
          part.description.toLowerCase().includes(q) ||
          part.vehicleFitment.some((fit) => fit.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (filters.category !== 'all') {
      result = result.filter((part) => part.category === filters.category);
    }

    // Vehicle make filter
    if (filters.vehicleMake !== 'All Vehicles') {
      result = result.filter(
        (part) =>
          part.vehicleFitment.includes('Universal') ||
          part.vehicleFitment.includes(filters.vehicleMake)
      );
    }

    // Price range filter
    if (filters.minPrice !== null) {
      result = result.filter((part) => part.basePrice >= (filters.minPrice as number));
    }
    if (filters.maxPrice !== null) {
      result = result.filter((part) => part.basePrice <= (filters.maxPrice as number));
    }

    // MOQ filter
    if (filters.minMoq !== null) {
      result = result.filter((part) => part.moq >= (filters.minMoq as number));
    }
    if (filters.maxMoq !== null) {
      result = result.filter((part) => part.moq <= (filters.maxMoq as number));
    }

    // Condition filter
    if (filters.condition !== 'all') {
      result = result.filter((part) => part.condition === filters.condition);
    }

    // Flags
    if (filters.tradeAssuranceOnly) {
      result = result.filter((part) => part.isTradeAssurance);
    }
    if (filters.verifiedOnly) {
      result = result.filter((part) => part.isVerifiedSupplier);
    }
    if (filters.readyToShipOnly) {
      result = result.filter((part) => part.isReadyToShip);
    }

    // Sorting
    if (filters.sortBy === 'price-asc') {
      result.sort((a, b) => a.basePrice - b.basePrice);
    } else if (filters.sortBy === 'price-desc') {
      result.sort((a, b) => b.basePrice - a.basePrice);
    } else if (filters.sortBy === 'orders-desc') {
      result.sort((a, b) => b.ordersCount - a.ordersCount);
    } else if (filters.sortBy === 'rating-desc') {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [filters]);

  // --- Cart Management Handlers with Min/Max Order Enforcement ---
  const handleAddToCart = (part: CarPart, qty?: number) => {
    // Strictly enforce minimum and maximum order constraints
    const targetQty = qty !== undefined ? qty : part.moq;
    const validatedQty = Math.max(part.moq, Math.min(part.maxOrder, targetQty));

    setCartItems((prev) => {
      const existing = prev.find((item) => item.part.id === part.id);
      if (existing) {
        const newQty = Math.min(part.maxOrder, existing.quantity + validatedQty);
        let newTierPrice = part.basePrice;
        for (const tier of part.priceTiers) {
          if (newQty >= tier.minQty && (!tier.maxQty || newQty <= tier.maxQty)) {
            newTierPrice = tier.price;
            break;
          }
        }
        return prev.map((item) =>
          item.part.id === part.id
            ? { ...item, quantity: newQty, selectedTierPrice: newTierPrice }
            : item
        );
      } else {
        let tierPrice = part.basePrice;
        for (const tier of part.priceTiers) {
          if (validatedQty >= tier.minQty && (!tier.maxQty || validatedQty <= tier.maxQty)) {
            tierPrice = tier.price;
            break;
          }
        }
        return [...prev, { part, quantity: validatedQty, selectedTierPrice: tierPrice }];
      }
    });

    setRecentlyAddedId(part.id);
    setTimeout(() => setRecentlyAddedId(null), 2000);
  };

  const handleUpdateCartQuantity = (partId: string, quantity: number) => {
    const targetPart = CAR_PARTS_DATA.find((p) => p.id === partId);
    if (!targetPart) return;

    // Enforce MOQ and Max Order
    const validatedQty = Math.max(targetPart.moq, Math.min(targetPart.maxOrder, quantity));

    setCartItems((prev) =>
      prev.map((item) => {
        if (item.part.id === partId) {
          let tierPrice = item.part.basePrice;
          for (const tier of item.part.priceTiers) {
            if (validatedQty >= tier.minQty && (!tier.maxQty || validatedQty <= tier.maxQty)) {
              tierPrice = tier.price;
              break;
            }
          }
          return { ...item, quantity: validatedQty, selectedTierPrice: tierPrice };
        }
        return item;
      })
    );
  };

  const handleRemoveCartItem = (partId: string) => {
    setCartItems((prev) => prev.filter((item) => item.part.id !== partId));
  };

  // --- Order & Payment Checkout Handlers ---
  const handleDirectOrderNow = (part: CarPart) => {
    setCheckoutPart(part);
    setIsCheckoutFromCart(false);
    setIsCheckoutOpen(true);
  };

  const handleProceedCartOrder = () => {
    setCheckoutPart(null);
    setIsCheckoutFromCart(true);
    setIsCheckoutOpen(true);
  };

  // Called the moment the server accepts an order, so it shows up under
  // "Pending Orders" immediately (even if the customer keeps shopping).
  const handleOrderCreated = (order: OrderRecord) => {
    setOrders((prev) => upsertOrder(prev, order));
  };

  // Re-reads every place an order can live (screen memory, this browser's saved
  // orders, and the server) and merges them, so no unpaid order is ever missing.
  const refreshOrders = async () => {
    let stored: OrderRecord[] = [];
    try {
      const raw = localStorage.getItem('apexparts_orders');
      const parsed = raw ? JSON.parse(raw) : [];
      stored = Array.isArray(parsed) ? parsed : [];
    } catch {
      stored = [];
    }
    let remote: OrderRecord[] = [];
    try {
      remote = (await api.getOrders()) || [];
    } catch {
      remote = [];
    }
    setOrders((prev) => mergeOrders(prev, stored, remote));
  };

  // Pending Orders button (top bar): always opens the list of orders that are
  // still unpaid. Clicking an order there takes the customer back to its
  // payment page to upload the screenshot.
  const handleOpenPendingOrders = () => {
    setOrdersInitialTab('pending');
    setIsOrdersOpen(true);
    void refreshOrders();
  };

  // Whenever the payment page is shown for an unpaid order, make sure that order
  // is in the pending list (whatever way the customer reached the page).
  useEffect(() => {
    if (isConfirmationOpen && confirmedOrder && isPendingOrder(confirmedOrder)) {
      setOrders((prev) => upsertOrder(prev, confirmedOrder));
    }
  }, [isConfirmationOpen, confirmedOrder]);

  const handleOrderSuccess = (order: OrderRecord) => {
    setOrders((prev) => upsertOrder(prev, order));
    setIsCheckoutOpen(false);

    if (isCheckoutFromCart) {
      setCartItems([]);
    }

    setConfirmedOrder(order);
    setIsConfirmationOpen(true);
  };

  // Total items in cart
  const totalCartCount = useMemo(() => {
    return cartItems.reduce((acc, it) => acc + it.quantity, 0);
  }, [cartItems]);

  const pendingOrdersCount = useMemo(() => {
    return orders.filter((o) => !isMockupOrder(o) && isPendingOrder(o)).length;
  }, [orders]);

  return (
    <div className="min-h-screen bg-[#f3f4f7] flex flex-col font-sans selection:bg-orange-200 selection:text-orange-900">
      {/* 1. Header with working Currency, Language, Help Center, RFQ, Cart */}
      <Header
        searchQuery={filters.searchQuery}
        onSearchChange={(q) => handleFilterUpdate({ searchQuery: q })}
        onSearchSubmit={() => scrollToCatalog()}
        selectedCategory={filters.category}
        onSelectCategory={(cat) => {
          handleFilterUpdate({ category: cat });
          scrollToCatalog();
        }}
        cartCount={totalCartCount}
        ordersCount={orders.length}
        pendingOrdersCount={pendingOrdersCount}
        currentCurrency={currentCurrency}
        onCurrencyChange={(c) => setCurrentCurrency(c)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenOrders={() => {
          setOrdersInitialTab('history');
          setIsOrdersOpen(true);
        }}
        onOpenPendingOrders={handleOpenPendingOrders}
        onOpenImageSearch={() => setIsImageSearchOpen(true)}
        onOpenHelpCenter={() => setIsHelpCenterOpen(true)}
        onOpenPartRequest={scrollToPartRequest}
        onResetFilters={handleResetFilters}
      />

      {/* 3. Hero Showcase Banner */}
      <HeroBanner
        onExploreMicro={() => {
          handleFilterUpdate({ category: 'micro-hardware', searchQuery: '' });
          scrollToCatalog();
        }}
        onExploreAssemblies={() => {
          handleFilterUpdate({ category: 'tires-wheels', searchQuery: '' });
          scrollToCatalog();
        }}
        onOpenPartRequest={scrollToPartRequest}
      />

      {/* 4. Main Marketplace Content Area */}
      <main ref={catalogRef} className="max-w-7xl w-full mx-auto px-4 py-6 flex-1 scroll-mt-16">
        {/* Category & Sorting Filter Bar */}
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterUpdate}
          totalResults={filteredParts.length}
          onOpenMobileFilters={() => setMobileFiltersOpen(true)}
          onResetFilters={handleResetFilters}
        />

        {/* Content Body: Sidebar Filters + Products Grid */}
        <div className="flex items-start gap-6">
          {/* Desktop & Mobile Sidebar Filters */}
          <SidebarFilters
            filters={filters}
            onFilterChange={handleFilterUpdate}
            onResetFilters={handleResetFilters}
            isOpenMobile={mobileFiltersOpen}
            onCloseMobile={() => setMobileFiltersOpen(false)}
          />

          {/* Product Grid Area */}
          <div className="flex-1 min-w-0">
            {filteredParts.length === 0 ? (
              <div className="bg-white rounded-lg border border-slate-200 p-10 text-center shadow-2xs space-y-4">
                <PackageSearch className="w-12 h-12 text-slate-300 mx-auto" />
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    {t.noPartsFound}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    {t.noPartsDesc}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={handleResetFilters}
                    className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded shadow-xs hover:bg-slate-900 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{t.resetFilters}</span>
                  </button>

                  <button
                    onClick={scrollToPartRequest}
                    className="px-4 py-2 bg-[#ff6600] text-white text-xs font-bold rounded shadow-xs hover:bg-[#e65c00] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>{t.requestPartRfq}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredParts.map((part) => (
                  <ProductCard
                    key={part.id}
                    part={part}
                    currencyCode={currentCurrency}
                    onOrderNow={handleDirectOrderNow}
                    onAddToCart={(p) => handleAddToCart(p)}
                    onQuickView={(p) => setActiveDetailPart(p)}
                    isAdded={recentlyAddedId === part.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 5. Custom Part Sourcing Request Section (Client can ask for unavailable parts!) */}
        <PartRequestSection
          onSubmitted={(req) => {
            setPartRequests((prev) => [req, ...prev]);
          }}
        />
      </main>

      {/* 6. Product Detail & Specs Modal */}
      <ProductDetailModal
        part={activeDetailPart}
        currencyCode={currentCurrency}
        isOpen={activeDetailPart !== null}
        onClose={() => setActiveDetailPart(null)}
        onOrderNow={(p, qty) => {
          setActiveDetailPart(null);
          setCheckoutPart(p);
          setIsCheckoutFromCart(false);
          setIsCheckoutOpen(true);
        }}
        onAddToCart={(p, qty) => {
          handleAddToCart(p, qty);
        }}
      />

      {/* 7. Order Checkout & Payment Method Selection Modal */}
      <OrderCheckoutModal
        singlePart={checkoutPart}
        cartItems={cartItems}
        currencyCode={currentCurrency}
        isOpen={isCheckoutOpen}
        onClose={() => {
          setIsCheckoutOpen(false);
          setCheckoutPart(null);
        }}
        onOrderSuccess={handleOrderSuccess}
        onOrderCreated={handleOrderCreated}
      />

      {/* 8. Post-Order Confirmation & Tracking Receipt Modal */}
      <OrderConfirmationModal
        order={confirmedOrder}
        currencyCode={currentCurrency}
        isOpen={isConfirmationOpen}
        onClose={() => setIsConfirmationOpen(false)}
        onContinueShopping={() => setIsConfirmationOpen(false)}
        onOrderUpdated={(updatedOrder) => {
          setConfirmedOrder(updatedOrder);
          setOrders((prev) =>
            prev.map((o) => (o.orderId === updatedOrder.orderId ? updatedOrder : o))
          );
        }}
      />

      {/* 9. Sourcing Cart Slide-Over Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        currencyCode={currentCurrency}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onProceedToOrder={handleProceedCartOrder}
      />

      {/* 10. Visual Part Image Search Modal */}
      <ImageSearchModal
        isOpen={isImageSearchOpen}
        onClose={() => setIsImageSearchOpen(false)}
        onSelectSearchTarget={(query, category) => {
          setFilters((prev) => ({
            ...prev,
            searchQuery: query,
            category,
          }));
          scrollToCatalog();
        }}
      />

      {/* 11. Orders History & Tracking Status Modal */}
      <OrdersModal
        isOpen={isOrdersOpen}
        currencyCode={currentCurrency}
        onClose={() => setIsOrdersOpen(false)}
        orders={orders}
        onSelectOrder={(ord) => {
          setIsOrdersOpen(false);
          setConfirmedOrder(ord);
          setIsConfirmationOpen(true);
        }}
        onDeleteOrder={handleDeleteOrder}
        onClearAllOrders={handleClearAllOrders}
        initialTab={ordersInitialTab}
      />

      {/* 12. Help Center Modal */}
      <HelpCenterModal
        isOpen={isHelpCenterOpen}
        onClose={() => setIsHelpCenterOpen(false)}
        onRequestCustomPart={() => {
          scrollToPartRequest();
        }}
      />

      {/* 13. Footer Policy & Legal Information Modal */}
      <FooterPolicyModal
        data={activePolicyData}
        isOpen={isPolicyModalOpen}
        onClose={() => {
          setIsPolicyModalOpen(false);
          setActivePolicyData(null);
        }}
        onGoToRfq={() => {
          setIsPolicyModalOpen(false);
          scrollToPartRequest();
        }}
      />

      {/* 14. Working Marketplace Footer */}
      <Footer
        onSelectCategory={(categoryId) => {
          handleFilterUpdate({ category: categoryId, searchQuery: '' });
          scrollToCatalog();
        }}
        onOpenPolicy={(policy) => {
          setActivePolicyData(policy);
          setIsPolicyModalOpen(true);
        }}
        onOpenPartRequest={scrollToPartRequest}
      />

      {/* 15. User Authentication (Login & Register) Modal */}
      <AuthModal />
    </div>
  );
}
