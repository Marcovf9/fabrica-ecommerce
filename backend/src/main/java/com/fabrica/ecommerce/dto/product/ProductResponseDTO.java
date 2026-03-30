package com.fabrica.ecommerce.dto.product;

import java.math.BigDecimal;

public record ProductResponseDTO(
        Long id,
        String sku,
        String name,
        BigDecimal salePrice,
        String categoryName,
        Long availableStock
) {}