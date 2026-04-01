package com.fabrica.ecommerce.controller;

import com.fabrica.ecommerce.dto.report.ProfitabilityReportDTO;
import com.fabrica.ecommerce.repository.OrderItemRepository;
import com.fabrica.ecommerce.service.ReportService; // IMPORTACIÓN AÑADIDA
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpHeaders; // IMPORTACIÓN AÑADIDA
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final OrderItemRepository orderItemRepository;
    private final ReportService reportService; // INYECCIÓN AÑADIDA

    @GetMapping("/profitability")
    public ResponseEntity<List<ProfitabilityReportDTO>> getProfitabilityReport() {
        return ResponseEntity.ok(orderItemRepository.getProfitabilityByCategory());
    }

    @GetMapping("/profitability/export")
    public ResponseEntity<byte[]> exportProfitabilityReport() {
        byte[] csvData = reportService.exportProfitabilityCsv();
        
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=reporte_rentabilidad.csv");
        headers.setContentType(org.springframework.http.MediaType.parseMediaType("text/csv; charset=utf-8"));

        return new ResponseEntity<>(csvData, headers, HttpStatus.OK);
    }
}