import axios from 'axios';
import type { Product, OrderRequestDTO, ProfitabilityReport, Order, OrderDetail } from '../types';

export const apiClient = axios.create({
    baseURL: 'http://localhost:8080/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

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
    }
};

export const adminService = {
    createProduct: async (productData: { categoryId: number, sku: string, name: string, salePrice: number }) => {
        const response = await apiClient.post('/products', productData);
        return response.data;
    },
    updateProduct: async (id: number, productData: { categoryId: number, sku: string, name: string, salePrice: number }) => {
        const response = await apiClient.put(`/products/${id}`, productData);
        return response.data;
    },
    registerBatch: async (batchData: { productId: number, quantityProduced: number, totalBatchCost: number }) => {
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
    cancelOrder: async (orderCode: string) => {
        const response = await apiClient.post(`/orders/${orderCode}/cancel`);
        return response.data;
    },
    getOrderDetails: async (orderCode: string) => {
        const response = await apiClient.get<OrderDetail>(`/orders/${orderCode}`);
        return response.data;
    },
    deleteProduct: async (id: number) => {
        const response = await apiClient.delete(`/products/${id}`);
        return response.data;
    }
};