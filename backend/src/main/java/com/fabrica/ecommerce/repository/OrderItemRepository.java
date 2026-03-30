package com.fabrica.ecommerce.repository;

import com.fabrica.ecommerce.dto.report.ProfitabilityReportDTO;
import com.fabrica.ecommerce.model.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    List<OrderItem> findByOrderId(Long orderId);

    @Query("SELECT new com.fabrica.ecommerce.dto.report.ProfitabilityReportDTO(" +
           "c.name, " +
           "SUM(oi.unitPrice * oi.quantity), " +
           "SUM(oi.unitCost * oi.quantity), " +
           "SUM((oi.unitPrice - oi.unitCost) * oi.quantity), " +
           "(SUM((oi.unitPrice - oi.unitCost) * oi.quantity) * 100.0 / SUM(oi.unitPrice * oi.quantity))) " +
           "FROM OrderItem oi " +
           "JOIN oi.product p " +
           "JOIN p.category c " +
           "JOIN oi.order o " +
           "WHERE o.status = 'CONFIRMED' " +
           "GROUP BY c.name")
    List<ProfitabilityReportDTO> getProfitabilityByCategory();
}