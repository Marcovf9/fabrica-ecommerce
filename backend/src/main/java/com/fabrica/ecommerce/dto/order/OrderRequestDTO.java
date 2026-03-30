package com.fabrica.ecommerce.dto.order;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record OrderRequestDTO(
        @NotBlank(message = "El contacto del cliente es obligatorio")
        String customerContact,
        
        @NotEmpty(message = "El pedido debe tener al menos un producto")
        List<OrderItemRequestDTO> items
) {}