package com.fabrica.ecommerce.dto.product;

import java.math.BigDecimal;

public record ProductResponseDTO(
        Long id,
        String sku,
        String name,
        String description,
        java.math.BigDecimal salePrice,
        String categoryName,
        Long availableStock,
        java.util.List<String> imageUrls 
) {}