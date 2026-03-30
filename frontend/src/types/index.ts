export interface Product {
    id: number;
    sku: string;
    name: string;
    salePrice: number;
    categoryName: string;
    availableStock: number;
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