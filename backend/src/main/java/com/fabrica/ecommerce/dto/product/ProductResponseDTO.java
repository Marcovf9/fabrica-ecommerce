package com.fabrica.ecommerce.dto.product;

import java.math.BigDecimal;
import java.util.List;

public record ProductResponseDTO(
        Long id,
        String sku,
        String name,
        String description,
        BigDecimal salePrice,
        String categoryName,
        List<String> imageUrls,
        List<SizeStockDTO> sizes,
        BigDecimal originalPrice,
        Boolean isFeatured
) {}