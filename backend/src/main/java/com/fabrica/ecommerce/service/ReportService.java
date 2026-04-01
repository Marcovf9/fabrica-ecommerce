package com.fabrica.ecommerce.service;

import com.fabrica.ecommerce.dto.report.ProfitabilityReportDTO;
import com.fabrica.ecommerce.repository.OrderItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final OrderItemRepository orderItemRepository;

    public byte[] exportProfitabilityCsv() {
        List<ProfitabilityReportDTO> report = orderItemRepository.getProfitabilityByCategory();
        StringBuilder csv = new StringBuilder();
        
        // Cabeceras UTF-8 con BOM para que Excel en español lea los acentos
        csv.append('\ufeff');
        csv.append("Categoría;Ingresos Brutos;Costo de Materiales;Ganancia Neta;Margen (%)\n");

        for (ProfitabilityReportDTO row : report) {
            csv.append(row.category()).append(";")
               .append(row.totalRevenue()).append(";")
               .append(row.totalCost()).append(";")
               .append(row.netProfit()).append(";")
               .append(String.format("%.2f", row.marginPercentage())).append("\n");
        }

        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }
}