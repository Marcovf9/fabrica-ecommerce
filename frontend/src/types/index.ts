export interface Product {
    id: number;
    categoryId: number;
    categoryName: string;
    sku: string;
    name: string;
    description: string;
    salePrice: number;
    originalPrice?: number;
    isActive: boolean;
    imageUrls: string[];
    sizes: SizeStock[];
    isFeatured?: boolean;
}

export interface SizeStock {
    size: string;
    stock: number;
}

export interface CartItem {
    product: Product;
    quantity: number;
    size: string;
}

export interface OrderRequestDTO {
    customerContact: string;
    deliveryAddress: string;
    items: {
        productId: number;
        quantity: number;
        size: string;
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
    size: string;
}

export interface OrderDetail {
    orderCode: string;
    customerContact: string;
    deliveryAddress: string;
    status: string;
    totalSaleAmount: number;
    items: OrderItemDetail[];
}