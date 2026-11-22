export type PartCategory =
  | 'micro-hardware'
  | 'engine-transmission'
  | 'braking-suspension'
  | 'electrical-sensors'
  | 'cooling-exhaust'
  | 'tires-wheels'
  | 'body-exterior'
  | 'cabin-interior';

export interface PriceTier {
  minQty: number;
  maxQty?: number;
  price: number;
}

export interface TechnicalSpec {
  name: string;
  value: string;
}

export interface CarPart {
  id: string;
  name: string;
  category: PartCategory;
  categoryLabel: string;
  oemNumber: string;
  basePrice: number; // Single piece price in USD
  priceRange: string;
  moq: number; // Minimum Order Quantity (enforced)
  maxOrder: number; // Maximum Order Quantity / stock limit (enforced)
  unit: string; // "Piece", "Set", "Bag (100 pcs)", "Kit", "Pair"
  stock: number;
  image: string; // main photo (cards, cart, orders)
  images: string[]; // full photo gallery (product detail view)
  rating: number;
  reviewsCount: number;
  ordersCount: number;
  vehicleFitment: string[];
  condition: 'OEM Genuine' | 'Aftermarket Heavy-Duty' | 'Performance Racing' | 'Remanufactured';
  isTradeAssurance: boolean;
  isVerifiedSupplier: boolean;
  isReadyToShip: boolean;
  supplierName: string;
  supplierLocation: string;
  supplierYears: number;
  deliveryDays: string;
  description: string;
  dimensions?: string;
  material?: string;
  priceTiers: PriceTier[];
  specs: TechnicalSpec[];
  tags: string[];
}

export interface CartItem {
  part: CarPart;
  quantity: number;
  selectedTierPrice: number;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  companyName?: string;
  phoneNumber?: string;
  streetAddress?: string;
  city?: string;
  stateProvince?: string;
  postalCode?: string;
  country?: string;
  createdAt: string;
}

export type PaymentMethodType =
  | 'paypal'
  | 'zelle'
  | 'venmo'
  | 'apple_pay'
  | 'google_pay';

export interface PaymentDetails {
  method: PaymentMethodType;
  methodLabel: string;
  instructionsSentToEmail: string;
  adminNotificationEmail: string; // apexparts45@gmail.com
  notice: string; // Every payment method you choose, the information of the payment method will be sent to you via email.
  paymentNotes?: string;
  screenshotUrl?: string;
  verifiedAt?: string;
  verificationNotes?: string;
}

export interface ShippingAddress {
  fullName: string;
  companyName?: string;
  streetAddress: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
  phoneNumber: string;
  email: string;
}

export type OrderStatus =
  | 'Payment Pending'
  | 'Payment Successful'
  | 'Packaging of Goods'
  | 'Sending & Transportation'
  | 'Air Delivery'
  | 'Delivered'
  | 'Payment Instructions Emailed'
  | 'Payment Authorized';

export interface OrderRecord {
  orderId: string;
  createdAt: string;
  items: {
    partId: string;
    partName: string;
    oemNumber: string;
    image: string;
    unitPrice: number;
    quantity: number;
    unit: string;
    total: number;
  }[];
  subtotal: number;
  volumeDiscount: number;
  shippingCost: number;
  tradeAssuranceFee: number;
  total: number;
  shippingAddress: ShippingAddress;
  paymentDetails: PaymentDetails;
  shippingMethod: string;
  status: OrderStatus;
  trackingNumber: string;
  estimatedDelivery: string;
  clientEmail: string;
  adminEmail: string;
  paymentVerified?: boolean;
  paymentVerifiedAt?: string;
  verificationScreenshot?: string;
  fulfillmentStage?: 'packaging' | 'transportation' | 'air_delivery' | 'delivered';
}

export interface FilterState {
  searchQuery: string;
  category: string;
  vehicleMake: string;
  minPrice: number | null;
  maxPrice: number | null;
  minMoq: number | null;
  maxMoq: number | null;
  condition: string;
  tradeAssuranceOnly: boolean;
  verifiedOnly: boolean;
  readyToShipOnly: boolean;
  sortBy: 'featured' | 'price-asc' | 'price-desc' | 'orders-desc' | 'rating-desc';
}

export interface PartRequest {
  id: string;
  createdAt: string;
  year: string;
  make: string;
  model: string;
  trimEngine?: string;
  vin?: string;
  partName: string;
  oemNumber?: string;
  condition: string;
  quantity: number;
  targetBudget?: string;
  email: string;
  phone: string;
  urgency: 'Standard (24-48h)' | 'Urgent (Within 4h)' | 'Immediate Sourcing';
  notes?: string;
  status: 'Received - Sourcing Factories' | 'Quotes Ready' | 'Matched';
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  rate: number; // Relative to USD = 1.0
  name: string;
}
