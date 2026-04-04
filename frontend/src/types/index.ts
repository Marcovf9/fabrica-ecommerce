export interface Product {
    id: number;
    categoryId: number;
    categoryName: string;
    sku: string;
    name: string;
    description: string;
    salePrice: number;
    availableStock: number;
    isActive: boolean;
    imageUrls: string[];
}

export interface CartItem {
    product: Product;
    quantity: number;
}

export interface OrderRequestDTO {
    customerContact: string;
    items: {
        productId: number;
        quantity: number;
    }[];
}

export interface Order {
    id: number;
    orderCode: string;
    customerContact: string;
    status: 'PENDING' | 'PAID' | 'SHIPPED' | 'CANCELLED';
    totalSaleAmount: number;
    totalCostAmount: number | null;
}

export interface ProfitabilityReport {
    category: string;
    totalRevenue: number;
    totalCost: number;
    netProfit: number;
    marginPercentage: number;
}

export interface OrderItemDetail {
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    subTotal: number;
}

export interface OrderDetail {
    orderCode: string;
    customerContact: string;
    status: string;
    totalSaleAmount: number;
    items: OrderItemDetail[];
}