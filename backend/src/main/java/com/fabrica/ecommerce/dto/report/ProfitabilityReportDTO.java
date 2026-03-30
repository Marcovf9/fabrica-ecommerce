package com.fabrica.ecommerce.dto.report;

import java.math.BigDecimal;

public record ProfitabilityReportDTO(
        String category,
        BigDecimal totalRevenue,
        BigDecimal totalCost,
        BigDecimal netProfit,
        Double marginPercentage
) {}