import axios from 'axios';
import type { Product, OrderRequestDTO, ProfitabilityReport, Order, OrderDetail } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const apiClient = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    headers: {
        'Content-Type': 'application/json'
    }
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export const authService = {
    login: async (credentials: { username: string, password: string }) => {
        const response = await apiClient.post('/auth/login', credentials);
        return response.data;
    }
};

export const catalogService = {
    getCatalog: async () => {
        const response = await apiClient.get<Product[]>('/products/catalog');
        return response.data;
    }
};

export const orderService = {
    createPendingOrder: async (orderData: OrderRequestDTO) => {
        const response = await apiClient.post('/orders', orderData);
        return response.data;
    },
    getOrderDetails: async (orderCode: string) => {
        const response = await apiClient.get<OrderDetail>(`/orders/${orderCode}`);
        return response.data;
    }
};

export const adminService = {
    createProduct: async (formData: FormData) => {
        const token = localStorage.getItem('admin_token');
        
        const response = await axios.post(`${apiClient.defaults.baseURL}/products`, formData, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    },
    updateProduct: async (id: number, productData: { categoryId: number, sku: string, name: string, description: string, salePrice: number }) => {
        const response = await apiClient.put(`/products/${id}`, productData);
        return response.data;
    },
    registerBatch: async (batchData: { productId: number, size: string, quantityProduced: number, totalBatchCost: number }) => {
        const response = await apiClient.post('/inventory/batches', batchData);
        return response.data;
    },
    getProfitabilityReport: async () => {
        const response = await apiClient.get<ProfitabilityReport[]>('/reports/profitability');
        return response.data;
    },
    getOrders: async () => {
        const response = await apiClient.get<Order[]>('/orders');
        return response.data;
    },
    confirmOrder: async (orderCode: string) => {
        const response = await apiClient.post(`/orders/${orderCode}/confirm`);
        return response.data;
    },
    shipOrder: async (orderCode: string) => {
        const response = await apiClient.post(`/orders/${orderCode}/ship`);
        return response.data;
    },
    cancelOrder: async (orderCode: string) => {
        const response = await apiClient.post(`/orders/${orderCode}/cancel`);
        return response.data;
    },
    getOrderDetails: async (orderCode: string) => {
        const response = await apiClient.get<OrderDetail>(`/orders/${orderCode}`);
        return response.data;
    },
    downloadOrderPdf: async (orderCode: string) => {
        const response = await apiClient.get(`/orders/${orderCode}/pdf`, {
            responseType: 'blob'
        });
        return response.data;
    },
    deleteProduct: async (id: number) => {
        const response = await apiClient.delete(`/products/${id}`);
        return response.data;
    },
    downloadProfitabilityCsv: async () => {
        const response = await apiClient.get('/reports/profitability/export', {
            responseType: 'blob'
        });
        return response.data;
    },
    getAbandonedCarts: async () => {
        const response = await apiClient.get('/leads');
        return response.data;
    },
    recoverAbandonedCart: async (id: number) => {
        const response = await apiClient.patch(`/leads/${id}/recover`);
        return response.data;
    },
    deleteAbandonedCart: async (id: number) => {
        const response = await apiClient.delete(`/leads/${id}`);
        return response.data;
    },
};

export const leadService = {
    captureLead: async (payload: { email: string, phone: string, cartContent: string }) => {
        const response = await apiClient.post('/leads/capture', payload);
        return response.data;
    }
};

export const shippingService = {
  calculate: async (zip: string, totalItems: number) => {
    const response = await fetch(`${API_BASE_URL}/api/shipping/calculate?zip=${zip}&totalItems=${totalItems}`);
    if (!response.ok) throw new Error('Error al cotizar envío');
    return response.json();
  }
};