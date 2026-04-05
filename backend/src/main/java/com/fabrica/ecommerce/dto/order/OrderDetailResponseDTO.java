package com.fabrica.ecommerce.dto.order;

import java.math.BigDecimal;
import java.util.List;

public record OrderDetailResponseDTO(
        String orderCode,
        String customerContact,
        String deliveryAddress,
        String status,
        BigDecimal totalSaleAmount,
        List<OrderItemDetailDTO> items
) {}