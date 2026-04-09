package com.fabrica.ecommerce.dto.order;

import java.math.BigDecimal;

public record OrderItemDetailDTO(
        String productName,
        String sku,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal subTotal,
        String size
) {}