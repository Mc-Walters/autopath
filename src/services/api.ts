import { CarPart, OrderRecord, PartRequest, PaymentDetails, ShippingAddress, User } from '../types';

export interface CreateOrderPayload {
  items: {
    partId: string;
    quantity: number;
  }[];
  shippingAddress: ShippingAddress;
  shippingMethod: 'express' | 'standard' | 'ocean';
  paymentDetails: PaymentDetails;
}

export interface CreateRfqPayload {
  year?: string;
  make?: string;
  model?: string;
  trimEngine?: string;
  vin?: string;
  partName: string;
  oemNumber?: string;
  condition?: string;
  quantity?: number;
  targetBudget?: string;
  email: string;
  phone?: string;
  urgency?: string;
  notes?: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  companyName?: string;
  phoneNumber?: string;
  streetAddress?: string;
  city?: string;
  stateProvince?: string;
  postalCode?: string;
  country?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
  message?: string;
}

export interface BackendHealthResponse {
  status: string;
  service: string;
  version: string;
  uptime: number;
  partsAvailable: number;
  ordersPlaced: number;
  rfqsLogged: number;
}

class ApiService {
  private baseUrl = '';

  /**
   * Health Check
   */
  async getHealth(): Promise<BackendHealthResponse | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/health`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  /**
   * User Registration
   */
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    try {
      const res = await fetch(`${this.baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Registration failed' };
      }
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during registration' };
    }
  }

  /**
   * User Login
   */
  async login(payload: LoginPayload): Promise<AuthResponse> {
    try {
      const res = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Login failed' };
      }
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during login' };
    }
  }

  /**
   * Get Current Authenticated User
   */
  async getMe(token?: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`${this.baseUrl}/api/auth/me`, { headers });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Unauthorized' };
      }
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  }

  /**
   * Fetch Parts from Backend
   */
  async getParts(params?: {
    search?: string;
    category?: string;
    vehicleMake?: string;
    minPrice?: number | null;
    maxPrice?: number | null;
    minMoq?: number | null;
    maxMoq?: number | null;
    condition?: string;
    readyToShip?: boolean;
    tradeAssurance?: boolean;
    verified?: boolean;
    sortBy?: string;
  }): Promise<{ parts: CarPart[]; count: number } | null> {
    try {
      const query = new URLSearchParams();
      if (params?.search) query.set('search', params.search);
      if (params?.category && params.category !== 'all') query.set('category', params.category);
      if (params?.vehicleMake && params.vehicleMake !== 'All Vehicles') query.set('vehicleMake', params.vehicleMake);
      if (params?.minPrice != null) query.set('minPrice', String(params.minPrice));
      if (params?.maxPrice != null) query.set('maxPrice', String(params.maxPrice));
      if (params?.minMoq != null) query.set('minMoq', String(params.minMoq));
      if (params?.maxMoq != null) query.set('maxMoq', String(params.maxMoq));
      if (params?.condition && params.condition !== 'all') query.set('condition', params.condition);
      if (params?.readyToShip) query.set('readyToShip', 'true');
      if (params?.tradeAssurance) query.set('tradeAssurance', 'true');
      if (params?.verified) query.set('verified', 'true');
      if (params?.sortBy) query.set('sortBy', params.sortBy);

      const res = await fetch(`${this.baseUrl}/api/parts?${query.toString()}`);
      if (!res.ok) return null;
      const data = await res.json();
      return { parts: data.parts, count: data.count };
    } catch {
      return null;
    }
  }

  /**
   * Fetch Order History from Backend
   */
  async getOrders(): Promise<OrderRecord[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/orders`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.orders || [];
    } catch {
      return [];
    }
  }

  /**
   * Place Order to Backend (Enforces MOQ & Max Limits Server-side and emails apexparts45@gmail.com)
   */
  async placeOrder(payload: CreateOrderPayload): Promise<{ success: boolean; order?: OrderRecord; error?: string; message?: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: data.error || 'There was an error while sending the information to apexparts45@gmail.com. Please re-input the information to the fields to send it back.',
        };
      }

      return { success: true, order: data.order, message: data.message };
    } catch (err: any) {
      return {
        success: false,
        error: 'There was an error while sending the information to apexparts45@gmail.com. Please re-input the information to the fields to send it back.',
      };
    }
  }

  /**
   * Upload and Verify Payment Proof Screenshot
   */
  async verifyPaymentScreenshot(
    orderId: string,
    payload: { screenshot: string; transactionId?: string; notes?: string }
  ): Promise<{ success: boolean; order?: OrderRecord; error?: string; message?: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/api/orders/${orderId}/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Payment verification failed' };
      }

      return { success: true, order: data.order, message: data.message };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error verifying payment screenshot' };
    }
  }

  /**
   * Delete an order
   */
  async deleteOrder(orderId: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/orders/${orderId}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Clear all orders
   */
  async clearOrders(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/orders`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Submit Custom RFQ Part Request to Backend
   */
  async submitRfq(payload: CreateRfqPayload): Promise<{ success: boolean; rfq?: PartRequest; error?: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/api/rfq`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Server rejected RFQ submission.' };
      }

      return { success: true, rfq: data.rfq };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error connecting to backend.' };
    }
  }

  /**
   * Fetch RFQs from Backend
   */
  async getRfqs(): Promise<PartRequest[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/rfq`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.rfqs || [];
    } catch {
      return [];
    }
  }
}

export const api = new ApiService();
