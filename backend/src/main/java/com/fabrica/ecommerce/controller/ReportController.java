package com.fabrica.ecommerce.controller;

import com.fabrica.ecommerce.dto.report.ProfitabilityReportDTO;
import com.fabrica.ecommerce.repository.OrderItemRepository;
import lombok.RequiredArgsConstructor;
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

    @GetMapping("/profitability")
    public ResponseEntity<List<ProfitabilityReportDTO>> getProfitabilityReport() {
        return ResponseEntity.ok(orderItemRepository.getProfitabilityByCategory());
    }
}