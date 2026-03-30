package com.fabrica.ecommerce.dto.product;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record ProductRequestDTO(
        @NotNull(message = "La categoría es obligatoria") Long categoryId,
        @NotBlank(message = "El SKU es obligatorio") String sku,
        @NotBlank(message = "El nombre es obligatorio") String name,
        @NotNull(message = "El precio es obligatorio") 
        @Min(value = 0, message = "El precio no puede ser negativo") BigDecimal salePrice
) {}