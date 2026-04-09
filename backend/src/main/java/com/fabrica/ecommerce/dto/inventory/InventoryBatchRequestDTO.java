package com.fabrica.ecommerce.dto.inventory;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record InventoryBatchRequestDTO(
        @NotNull(message = "El producto es obligatorio") Long productId,
        @NotNull (message = "Las medidas son obligatorias")String size,
        @NotNull(message = "La cantidad es obligatoria") 
        @Min(value = 1, message = "Debe producir al menos 1 unidad") Integer quantityProduced,
        @NotNull(message = "El costo total del lote es obligatorio") 
        @Min(value = 0, message = "El costo no puede ser negativo") BigDecimal totalBatchCost
) {}